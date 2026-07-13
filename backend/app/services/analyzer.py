import pandas as pd
import pytz
import logging

logger = logging.getLogger(__name__)

def run_core_analysis(parsed_events: list[dict], metadata_cache: dict, timezone_str: str = "UTC") -> dict:
    # todo: this function is getting long, should probably split it up
    if not parsed_events:
        return {
            "top_channels": [],
            "temporal_heatmap": [],
            "binge_sessions": {"top_by_count": [], "top_by_duration": []}
        }

    df = pd.DataFrame(parsed_events)

    def get_duration(vid):
        if not vid or vid not in metadata_cache:
            return 0
        obj = metadata_cache[vid]
        # handles both sqlalchemy objects and dicts b/c im not sure which one we get
        if hasattr(obj, 'duration_seconds'):
            return obj.duration_seconds or 0
        elif isinstance(obj, dict):
            return obj.get('duration_seconds') or 0
        return 0

    df['duration_seconds'] = df['video_id'].apply(get_duration)

    # drop short clips (< 10s) but keep 0-duration entries (deleted/missing metadata)
    df = df[(df['duration_seconds'] >= 10) | (df['duration_seconds'] == 0)]
    # 10s filter removes accidental clicks, keep 0s for deleted vids

    if df.empty:
        return {
            "top_channels": [],
            "temporal_heatmap": [],
            "binge_sessions": {"top_by_count": [], "top_by_duration": []}
        }

    df['timestamp'] = pd.to_datetime(df['timestamp'])

    try:
        user_tz = pytz.timezone(timezone_str)
    except pytz.exceptions.UnknownTimeZoneError:
        logger.warning(f"Unknown timezone {timezone_str}, defaulting to UTC")
        user_tz = pytz.UTC

    df['local_time'] = df['timestamp'].dt.tz_convert(user_tz)

    channel_group = df[df['channel_name'].notna()].groupby('channel_name').agg(
        video_count=('channel_name', 'size'),
        total_duration_seconds=('duration_seconds', 'sum')
    ).reset_index()

    top_channels = channel_group.sort_values('video_count', ascending=False).head(50).to_dict(orient='records')
    del channel_group  # done with this, free it

    df['hour'] = df['local_time'].dt.hour
    df['day_of_week'] = df['local_time'].dt.dayofweek

    heatmap = df.groupby(['day_of_week', 'hour']).size().reset_index(name='count')
    temporal_heatmap = heatmap.to_dict(orient='records')
    del heatmap  # freed

    df = df.sort_values('timestamp').reset_index(drop=True)

    gap_threshold = pd.Timedelta(minutes=15)  # 15 min gap = new session, seemed reasonable idk
    df['time_diff'] = df['timestamp'].diff()
    df['new_session'] = (df['time_diff'] > gap_threshold) | df['time_diff'].isna()
    df['session_id'] = df['new_session'].cumsum()

    sessions = df.groupby('session_id').agg(
        video_count=('timestamp', 'size'),
        total_duration_seconds=('duration_seconds', 'sum'),
        start_time=('timestamp', 'min'),
        end_time=('timestamp', 'max'),
        channels=('channel_name', lambda x: list(x.dropna()))
    ).reset_index()
    del df  # big dataframe done, free it

    def get_top_channel(channels_list):
        if not channels_list:
            return None
        return pd.Series(channels_list).value_counts().idxmax()

    sessions['top_channel'] = sessions['channels'].apply(get_top_channel)
    sessions.drop(columns=['channels'], inplace=True)

    binges = sessions[(sessions['video_count'] > 5) & (sessions['total_duration_seconds'] > 3600)]
    # > 5 vids AND > 1 hour, pretty conservative but avoids false positives
    del sessions  # done with sessions, no need to keep a copy around

    if not binges.empty:
        binges['start_time'] = binges['start_time'].dt.strftime('%Y-%m-%dT%H:%M:%SZ')
        binges['end_time'] = binges['end_time'].dt.strftime('%Y-%m-%dT%H:%M:%SZ')

        top_by_count = binges.sort_values('video_count', ascending=False).head(10).to_dict(orient='records')
        top_by_duration = binges.sort_values('total_duration_seconds', ascending=False).head(10).to_dict(orient='records')
    else:
        top_by_count = []
        top_by_duration = []

    return {
        "top_channels": top_channels,
        "temporal_heatmap": temporal_heatmap,
        "binge_sessions": {
            "top_by_count": top_by_count,
            "top_by_duration": top_by_duration
        }
    }
