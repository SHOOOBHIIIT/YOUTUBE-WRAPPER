import logging
from urllib.parse import urlparse, parse_qs
from datetime import datetime
from app.schemas.watch_event import WatchEvent

logger = logging.getLogger(__name__)

def parse_watch_history(raw_data: list[dict]) -> list[WatchEvent]:
    events = []
    # todo: add some validation here maybe?

    for item in raw_data:
        time_str = item.get("time")
        if not time_str:
            continue

        try:
            timestamp = datetime.fromisoformat(time_str.replace("Z", "+00:00"))  # dumb hack b/c google uses "Z"
        except ValueError:
            continue

        title_url = item.get("titleUrl")
        video_id = None
        if title_url:
            parsed_url = urlparse(title_url)
            query_params = parse_qs(parsed_url.query)
            if "v" in query_params:
                video_id = query_params["v"][0]

        channel_name = None
        subtitles = item.get("subtitles")
        # subtitles is sometimes a weird format, just grab the first one
        if subtitles and isinstance(subtitles, list) and len(subtitles) > 0:
            channel_name = subtitles[0].get("name")

        title = item.get("title", "Unknown Title")
        # takeout always sticks "Watched " in front, kinda annoying
        if title.startswith("Watched "):
            title = title[8:]

        events.append(
            WatchEvent(
                video_id=video_id,
                title=title,
                channel_name=channel_name,
                timestamp=timestamp
            )
        )

    return events
