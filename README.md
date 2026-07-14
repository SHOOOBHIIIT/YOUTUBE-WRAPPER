# YouTube Wrapped

**Your year in videos — analyzed, clustered, and presented.**

YouTube Wrapped takes your Google Takeout watch history and turns it into a Spotify Wrapped-style presentation — complete with binge session detection, genre clustering via machine learning, taste drift analysis, and a distinctive visual design.

**Live** → [youtube-wrapper-alpha.vercel.app](https://youtube-wrapper-alpha.vercel.app) (frontend) · [youtube-wrapper.onrender.com](https://youtube-wrapper.onrender.com) (API)

---

## What Is This?

Basically, you export your YouTube watch history as a zip file from Google Takeout, upload it here, and the app does a bunch of analysis behind the scenes. It figures out your top channels, when you watch the most, whether you're a binge-watcher, and what genres you're into — then presents it all in a slick 7-slide phone-frame presentation with animations and everything.

The whole thing runs on a FastAPI backend with PostgreSQL and a Next.js frontend. There's some ML thrown in for the genre clustering (HF Inference API for embeddings + TF-IDF fallback), a YouTube API enrichment step to get video metadata, and a custom binge detection algorithm that I'm pretty happy with.

---

## Tech Stack

### Frontend

| Category | Technology | Why This One |
|----------|-----------|--------------|
| Framework | Next.js 16 (App Router) | Server components + client components, great DX |
| UI Library | React 19 | It's React, nothing fancy |
| Styling | Tailwind CSS 4 + CSS Modules + Global Variables | Hybrid approach — Tailwind for utilities, CSS Modules for page-specific stuff, global vars for the design system |
| Animation | Framer Motion | Declarative animations, way easier than manual CSS transitions |
| Scroll Effects | GSAP + ScrollTrigger | Industry standard for scroll-driven animations |
| Charts | Recharts | Simple API, good for the donut and area charts |
| 3D Graphics | Three.js + React Three Fiber + Drei | Interactive 3D monitor on the landing page |
| Auth | NextAuth.js (Google Provider) | Standard OAuth flow, handles session management |
| Image Export | html-to-image | Client-side screenshot generation, no server needed |
| Fonts | VT323, Space Grotesk, JetBrains Mono | Display font + clean body + monospace for stats |

### Backend

| Category | Technology | Why This One |
|----------|-----------|--------------|
| Framework | FastAPI | Async support, automatic docs, fast |
| Database | PostgreSQL (via SQLAlchemy) | Relational data + JSON support for flexible schemas |
| ORM | SQLAlchemy 2.0 | Mature, well-documented, good type hints |
| ML | HF Inference API (`all-MiniLM-L6-v2`) + TF-IDF fallback | Remote embeddings with a local fallback that needs zero external APIs |
| Clustering | scikit-learn (KMeans + TfidfVectorizer) | Simple, deterministic, works well for this use case |
| Data Analysis | pandas | DataFrame operations make the analysis code way cleaner |
| HTTP Client | httpx | Async HTTP for YouTube API calls |
| Validation | Pydantic | Schema validation, settings management, serialization |
| Testing | pytest | Standard Python testing framework |

---

## How It Works

Here's the full data flow from upload to presentation:

```
User uploads Google Takeout .zip
        │
        ▼
POST /api/upload
        │
        ├─ Validates file (must be .zip, max 200MB)
        ├─ Auto-provisions user if they don't exist yet (safety net)
        ├─ Creates upload record in database (status: processing)
        ├─ Extracts watch-history.json from the zip
        │   └─ Stream-extracts with 500MB zip-bomb protection
        │   └─ Case-insensitive search across nested folders
        │
        ├─ Returns immediately with upload_id
        │
        ▼
Background Processing (runs async)
        │
        ├─ STAGE 1: Parse
        │   └─ Convert raw JSON to typed WatchEvent objects
        │   └─ Extract video IDs from URLs, clean up titles
        │   └─ Store parsed events in DB (safety net)
        │
        ├─ STAGE 2: Enrich
        │   └─ Query cache for existing metadata
        │   └─ Batch-fetch from YouTube Data API v3 (50 IDs per request)
        │   └─ Cache results with TTL (30 days available, 90 days for tombstones)
        │   └─ Create tombstone records for deleted/unavailable videos
        │
        ├─ STAGE 3: Analyze
        │   └─ Build pandas DataFrame from events + metadata
        │   └─ Filter out sub-10-second clips (accidental clicks)
        │   └─ Convert timestamps to user's local timezone
        │   └─ Compute top 50 channels, temporal heatmap, binge sessions
        │   └─ Store results in WrappedResult
        │
        └─ STAGE 4: Cluster (optional, requires 100+ videos)
            └─ Try HF Inference API for embeddings
            │   └─ Falls back to TF-IDF if API unreachable (render SG DNS issue)
            └─ Run KMeans clustering (k ≤ 8)
            └─ Merge small clusters (< 2%) into "Other"
            └─ Assign human-readable labels
            └─ Compute monthly taste drift
            └─ Store in WrappedResult (failure doesn't break the pipeline)

Frontend polls GET /api/upload/{id}/status every 2 seconds
        │
        └─ On "complete" → redirects to /wrapped/{upload_id}
                │
                ▼
        7-Slide Presentation
            ├─ Slide 1: Total videos watched (count-up animation)
            ├─ Slide 2: Top channels leaderboard
            ├─ Slide 3: Peak viewing hour + personality badge
            ├─ Slide 4: Longest binge session
            ├─ Slide 5: Genre breakdown (donut chart)
            ├─ Slide 6: Taste drift over time (line chart)
            └─ Slide 7: Summary + image export
```

---

## Architecture

### Deployment

```
Vercel (Frontend)                    Render (Backend)
├─ Next.js 16 serverless             ├─ FastAPI on uvicorn
├─ Auto-deploy from deploy branch    ├─ Python 3.12.9 (pinned)
├─ /api/auth/* routes (NextAuth)     ├─ PostgreSQL (Neon, free tier)
├─ WarmUpPing pings /health          ├─ BackgroundTasks for processing
└─ NEXT_PUBLIC_API_URL ───────────→  └─ CORS: comma-separated FRONTEND_URL
```

The frontend is a Vercel static deployment that talks to the Render backend. A `WarmUpPing` component mounts on the landing page and hits `/health` so the Render free tier instance wakes up before the user actually uploads anything. Cold starts on free tier are ~30 seconds, so this takes the edge off.

The backend uses `BackgroundTasks` for the upload pipeline — the upload endpoint returns in milliseconds, and processing happens async. A heartbeat loop in the background task keeps the connection alive so Render's 60-second idle timeout doesn't kill it mid-processing.

### Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, router registration
│   ├── config.py             # Environment variables via Pydantic
│   ├── database.py           # SQLAlchemy engine + session factory
│   ├── api_deps.py           # Shared dependencies (ownership checks)
│   ├── models/               # SQLAlchemy ORM models
│   │   ├── user.py           # User accounts (Google OAuth)
│   │   ├── upload.py         # Upload records + parsed events
│   │   ├── result.py         # Wrapped analysis results
│   │   └── cache.py          # Video metadata + embedding cache
│   ├── schemas/              # Pydantic validation schemas
│   ├── routers/              # API endpoints
│   │   ├── health.py         # Health check (+ DB connectivity check)
│   │   ├── auth.py           # User sync from NextAuth
│   │   ├── upload.py         # Zip upload + background processing
│   │   ├── status.py         # Processing status polling
│   │   └── wrapped.py        # Retrieve/delete wrapped results
│   └── services/             # Business logic
│       ├── zip_handler.py    # Zip extraction + bomb protection
│       ├── parser.py         # JSON → WatchEvent conversion
│       ├── youtube_api.py    # YouTube API enrichment + caching
│       ├── analyzer.py       # Pandas-based analysis pipeline
│       └── clusterer.py      # ML clustering pipeline
└── tests/                    # 31 pytest tests

frontend/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── page.js           # Landing page
│   │   ├── auth/             # Google sign-in
│   │   ├── upload/           # Zip upload with drag-and-drop
│   │   ├── onboarding/       # Google Takeout guide
│   │   └── wrapped/[id]/    # Results presentation
│   ├── components/
│   │   ├── CRTHero.js        # 3D CRT monitor (Three.js)
│   │   ├── WarmUpPing.js     # Pre-warms Render cold starts
│   │   ├── TypewriterText.js # Typewriter animation
│   │   └── wrapped/          # 7 slide components + container
│   └── hooks/
│       └── useCountUp.js     # Animated counter hook
```

### Module Responsibilities

| Module | What It Does | Lines of Code |
|--------|-------------|---------------|
| `zip_handler.py` | Safely extracts `watch-history.json` from zips. Handles zip bombs (500MB limit), nested paths, case-insensitive search. | ~120 |
| `parser.py` | Converts raw Google Takeout JSON to typed `WatchEvent` objects. Cleans titles, extracts video IDs from URLs. | ~50 |
| `youtube_api.py` | Enriches video IDs with metadata from YouTube Data API v3. Two-tier cache (30d/90d TTL), handles quota limits. | ~170 |
| `analyzer.py` | Pandas-based analysis. Computes top channels, temporal heatmap, binge sessions. Timezone-aware. | ~105 |
| `clusterer.py` | HF Inference API for embeddings with TF-IDF fallback. KMeans clustering, label assignment, taste drift. | ~380 |
| `CRTHero.js` | Interactive 3D monitor with Three.js. Mouse parallax, screen glow, boot text overlay. Respects reduced motion. | ~380 |
| `SlideContainer.js` | Story-style carousel. Auto-advance, swipe, progress bars, screen transition effects. | ~200 |
| `UploadClient.js` | Drag-and-drop upload, progress polling, past wraps display. | ~370 |

---

## Key Technical Decisions

### Streaming Zip Extraction vs. Loading Everything

I went with stream-based extraction (reading 64KB chunks) instead of loading the entire zip into memory. The main reason is zip-bomb protection — a malicious zip could compress to 1MB but expand to 50GB, and you'd blow up your server's memory before you know it.

The 500MB threshold caught everything I tested against. The 64KB chunk size was honestly arbitrary — I tried bigger chunks but it didn't make a noticeable difference in speed, so I stuck with the smaller size for better memory control.

Could I have used a third-party library for this? Probably. But the stdlib `zipfile` module does the job fine, and I wanted to understand the streaming logic myself.

### Embedding Strategy: HF API + TF-IDF Fallback

I started with sentence-transformers running locally (PyTorch + the model). Then I deployed to Render and realized the free tier has 512MB of RAM. PyTorch alone is 730MB. That was a problem.

So I switched to the HF Inference API — send the titles over HTTP, get embeddings back. Clean, no local dependencies. But then Render's Singapore region couldn't resolve HuggingFace's DNS. Neither could the original `api-inference.huggingface.co` domain (it's dead, apparently).

The solution: try the HF API first, fall back to sklearn's `TfidfVectorizer` if it's unreachable. TF-IDF doesn't capture semantic similarity the way sentence-transformers does ("Python tutorial" and "coding lesson" end up in different clusters), but it's good enough for genre breakdown and needs zero external APIs. The clustering still works, it's just slightly less nuanced.

This is one of those things where the "worse" solution is actually better for the project — it's faster, more reliable, and doesn't depend on a third party's DNS.

### Sentence-Transformers + KMeans for Clustering

Even with TF-IDF as fallback, the core clustering logic stays the same. KMeans with `k=8` and `random_state=42` gives deterministic results. I could have used `n_init="auto"` and let it figure out the optimal k, but deterministic output is more important here — I want the same watch history to produce the same clusters every time.

Small clusters (< 2% of videos) get merged into "Other." Without this, you'd end up with categories like "Music · Gaming" with 3 videos in them, which looks messy.

I append the YouTube category name in brackets ("Python Tutorial [Education]") to give the embeddings more signal. The category acts as a semantic anchor — without it, titles alone don't cluster as cleanly.

### JSONB for Embedding Storage

This is one of those "it would have been better but I haven't learned it yet" moments.

I store the 384-dimensional embedding vectors as JSONB in PostgreSQL's `video_metadata_cache` table. This works — I can store and retrieve them fine, and the cache invalidation logic (SHA-256 hash of the title) prevents stale embeddings.

But **pgvector** would have been the better choice. It's a PostgreSQL extension designed specifically for vector storage and similarity search. It supports HNSW indexing, which would make nearest-neighbor queries much faster if I ever wanted to add a "similar videos" feature.

The JSONB approach works for this project's scale (thousands of videos, not millions), but it's not what I'd use in production. I just haven't had time to learn pgvector yet.

### Background Tasks vs. Proper Job Queues

FastAPI's `BackgroundTasks` is dead simple — you just pass a function and it runs after the response is sent. For this project, it's perfect. The upload endpoint returns immediately, and the processing happens async.

But it's not a real job queue. There's no retry logic, no persistence (if the server restarts, the task is lost), no concurrency control. For a production app, I'd use **Celery with Redis** or **ARQ** — both give you proper task queues with retries, monitoring, and distributed workers.

For now, BackgroundTasks is fine. If the processing fails, the user can just re-upload. I did add a heartbeat loop though — Render's free tier kills idle connections after 60 seconds, and the clustering pipeline can easily take longer than that. The heartbeat sends a "still alive" signal every 15 seconds so the connection doesn't get stale-detected.

### Client-Side Polling vs. WebSockets

The frontend polls `GET /api/upload/{id}/status` every 2 seconds to check if processing is done. It's simple and works, but it's not efficient — 99% of the polls return "still processing."

**WebSockets** or **Server-Sent Events (SSE)** would be better. The server could push a status update when processing completes, and the frontend wouldn't need to poll at all.

I went with polling because it was faster to implement and I didn't want to deal with WebSocket connection management in FastAPI. It's a known limitation — if I were building this for thousands of users, I'd switch to SSE.

### Partial Failure Resilience

If the clustering pipeline fails (maybe there aren't enough videos, or the model download fails), the system still returns the analysis results from Stage 3. The user gets their top channels, heatmap, and binge sessions — just no genre breakdown.

This was a deliberate choice. The clustering is the most failure-prone stage (requires 100+ enriched videos, external model loading, embedding computation). It shouldn't invalidate the simpler analysis that users still want to see.

I store a `clustering_skipped_reason` string so the frontend can display a message like "Genre breakdown unavailable (not enough videos)" instead of just showing nothing.

### CORS for Cross-Origin Deployments

When you deploy the frontend and backend to different domains (Vercel and Render, in my case), you hit CORS issues immediately. The solution is straightforward — `FRONTEND_URL` on the backend supports comma-separated origins, and the `CORSMiddleware` reads them all.

But there's a subtle gotcha: the frontend at `localhost:3000` and `youtube-wrapper-alpha.vercel.app` both need to be allowed, so the env var is set to `https://youtube-wrapper-alpha.vercel.app,http://localhost:3000` on Render. Simple, but easy to forget when you're wondering why your local dev works but production doesn't.

### Auto-Provisioning Users

When a user signs in with Google on the frontend, NextAuth calls the backend `/api/auth/sync` endpoint to create or update the user record. But the `signIn` callback in NextAuth catches errors silently — if the sync fails (Render instance is cold, network blip, whatever), the user still gets signed in on the frontend side.

Then they try to upload, and the backend throws a foreign key violation because their user ID doesn't exist in the database. That's a fun one to debug.

The fix: the upload endpoint auto-provisions a placeholder user if they don't exist before inserting the upload record. It's a safety net. Not elegant, but it works and it means uploads never fail because of a missing sync.

### Visual Design

This was 100% a vibes decision. Spotify Wrapped has a clean, modern look. I wanted something different — something that felt like you're booting up an old terminal to access your viewing archive.

The design uses **VT323** for display text, **phosphor orange** (#FFAE5C) as the primary accent, scanlines and grain overlays for texture, and a **3D interactive monitor** on the landing page built with Three.js.

The 3D monitor was the most fun part. It's a box geometry with a phosphor-glow screen, chrome frame pieces, ventilation slots, a power LED, and a base foot. Mouse movement drives parallax rotation, and the screen text renders to a canvas texture.

I also added a `prefers-reduced-motion` check — if the user has reduced motion enabled in their OS, the 3D monitor is replaced with a static fallback. Accessibility matters, even in side projects.

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL (local or hosted)
- YouTube Data API v3 key (for enrichment — the app works without it, but you won't get video metadata)

### Backend Setup

1. Navigate to the `backend/` directory
2. Create a virtual environment: `python -m venv venv`
3. Activate it: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
4. Install dependencies: `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and fill in your values:
   - `DATABASE_URL` — your PostgreSQL connection string (strip `channel_binding=require` if using Neon)
   - `YOUTUBE_API_KEY` — your YouTube Data API v3 key
   - `NEXTAUTH_SECRET` — a random string for NextAuth
   - `FRONTEND_URL` — your frontend URL (default: `http://localhost:3000`)
   - `HF_API_TOKEN` — your HuggingFace API token (optional, enables better clustering)
6. Run the server: `uvicorn app.main:app --reload`
7. The API docs are at `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to the `frontend/` directory
2. Install dependencies: `npm install`
3. Create a `.env.local` file with:
   - `NEXTAUTH_URL` — your frontend URL (default: `http://localhost:3000`)
   - `NEXTAUTH_SECRET` — same as backend
   - `GOOGLE_CLIENT_ID` — from Google Cloud Console
   - `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
   - `NEXT_PUBLIC_API_URL` — your backend URL (default: `http://localhost:8000`)
4. Run the dev server: `npm run dev`
5. The app is at `http://localhost:3000`

### Database

The app creates tables automatically on startup via SQLAlchemy's `create_all()`. Just make sure your PostgreSQL instance is running and the `DATABASE_URL` is correct.

---

## Testing

### Running Tests

From the `backend/` directory:

```
pytest
```

Or with verbose output:

```
pytest -v
```

### What's Tested

| Test File | Tests | What It Covers |
|-----------|-------|----------------|
| `test_zip_handler.py` | 14 | Zip extraction, bomb protection, file-not-found, JSON validation, bad zips |
| `test_parser.py` | 3 | Happy path, deleted video handling, missing timestamps |
| `test_analyzer.py` | 3 | Empty input, channel ranking, binge detection |
| `test_clusterer.py` | 11 | Hash determinism, label generation, clustering pipeline, edge cases |

**Total: 31 tests**

The full upload-to-presentation flow also works — I verified it manually end-to-end. The automated tests cover the core services (zip extraction, parsing, analysis, clustering) but not the HTTP layer or frontend.

### What's Not Automated Yet

| Area | Status |
|------|--------|
| API endpoint integration tests | No `TestClient` usage — endpoints work but aren't tested via scripts |
| YouTube API enrichment service | Untested — would need API mocking to test properly |
| Frontend components | No test framework installed — zero Jest/Playwright setup |
| End-to-end browser flow | No Playwright/Cypress — manual testing covers this for now |

---

## What I Learned Building This

### Things That Worked Well

**Pandas for data analysis.** The analysis pipeline went from "I have no idea how to structure this" to "oh, this is just groupby operations" once I started using DataFrames. The temporal heatmap, channel rankings, and session detection all fell into place naturally. If I had written this with raw Python dicts and loops, it would have been twice as long and half as readable.

**HF Inference API instead of local models.** Sentence-transformers requires PyTorch (~730MB). Render's free tier gives you 512MB of RAM. The math doesn't work. The HF Inference API gives you the same embeddings over HTTP, and your `requirements.txt` stays at 13 lines instead of 50.

**TF-IDF as a fallback.** When the HF API is unreachable (which, turns out, happens on Render's Singapore region), sklearn's TfidfVectorizer kicks in. It's not as good semantically, but it's local, instant, and needs zero dependencies beyond what we already have. Ship both plans.

**FastAPI's BackgroundTasks.** Dead simple async processing. The upload endpoint returns in milliseconds while the heavy lifting happens in the background. For a side project, this is way simpler than setting up Celery + Redis.

**The CRT aesthetic.** It's distinctive. Every "Spotify Wrapped clone" has a clean, modern look. The retro terminal vibe makes this one memorable. The 3D monitor on the landing page was the most fun I've had building a component.

**Render MCP for debugging.** Instead of SSHing into the server and reading logs, I set up the Render MCP server in opencode and could query deployment status, logs, and metrics directly from the CLI. Way faster than switching to a browser tab and scrolling through log lines.

### Things I'd Do Differently

**pgvector instead of JSONB for embeddings.** I store 384-dimensional vectors as JSONB because I didn't know how to set up pgvector. It works, but pgvector would give me proper vector indexing and faster similarity queries. It's on my list to learn.

**WebSockets for real-time status updates.** The 2-second polling is wasteful. SSE or WebSockets would be more efficient and feel more responsive. Polling was just faster to implement.

**Proper job queue (Celery/ARQ).** BackgroundTasks is fine for a demo, but it doesn't persist tasks across server restarts and has no retry logic. A real job queue would make this more robust.

**End-to-end tests.** I have 31 unit tests covering the core logic, but no tests that actually upload a zip and verify the full pipeline runs. Playwright or Cypress would catch integration issues that unit tests miss.

**Oregon region on Render from day one.** I started on Singapore because it's close to me. Then I discovered Render Singapore can't resolve HuggingFace's DNS. Migrating regions on Render means redeploying from scratch — there's no "move this service to another region" button. If I had picked Oregon at the start, the HF API would have worked fine and I wouldn't have needed the TF-IDF fallback. (The fallback is arguably better, but that's not the point.)

**NextAuth signIn callback shouldn't swallow errors.** The `catch { return true; }` pattern in the signIn callback means auth sync failures are invisible. The user gets signed in, but their record doesn't exist in the backend. Then uploads fail with mysterious FK violations. I should have at least logged the error.

### Random Things I Learned

- Google Takeout zips can have inconsistent folder structures. The same export might have `Takeout/YouTube/history/watch-history.json` in one case and `takeout_2024/YouTube and YouTube Music/history/watch-history.json` in another. That's why the zip search is case-insensitive and works recursively.
- YouTube's API returns nested error objects that are annoying to parse. A 403 response has `error.errors[0].reason` — three levels deep. It's not documented anywhere obvious.
- The `isodate` library can throw weird exceptions for malformed durations. I just catch everything and default to 0 seconds. Not ideal, but YouTube's duration format is mostly consistent.
- SQLAlchemy sometimes returns naive datetimes even when you configured timezone-aware columns. I added a `tzinfo is None` check in the status endpoint to handle this.
- `runtime.txt` and `NIXPACKS_PYTHON_VERSION` don't work on Render. The only way to pin Python on Render is via the `PYTHON_VERSION` environment variable plus a `.python-version` file. Took me three deploys to figure this out.
- Neon's connection strings include `channel_binding=require` by default. psycopg2 doesn't support that — it'll throw a connection error that looks like a password problem but isn't. Strip it.
- HuggingFace's old inference domain (`api-inference.huggingface.co`) is dead. The new one is `router.huggingface.co/hf-inference/models/...`. Both the subdomain and the path structure changed. No redirect.
- Render free tier kills idle connections after 60 seconds. If your background task runs longer than that, you need a heartbeat. I send a ping every 15 seconds to keep the connection alive.

---

## Known Limitations

| Limitation | Impact | Potential Fix |
|-----------|--------|---------------|
| No rate limiting on YouTube API | Could exceed daily quota with multiple users | Implement token bucket or queue-based rate limiting |
| BackgroundTasks don't persist | Server restart loses in-progress tasks | Switch to Celery + Redis |
| JSONB for embeddings | Slower than pgvector for similarity queries | Migrate to pgvector extension |
| No end-to-end tests | Integration bugs could slip through | Add Playwright tests |
| 2-second polling for status | Wasteful network requests | Switch to SSE or WebSockets |
| 100-video minimum for clustering | Users with small histories don't get genre breakdown | Lower threshold or use a simpler algorithm |
| TF-IDF fallback is less semantic | Genre clusters are slightly less accurate without HF embeddings | Not fixable without fixing Render DNS |
| Single-server deployment | No horizontal scaling | Add proper job queue + load balancer |

---

## License

This project is for personal/educational use. Not licensed for commercial deployment.

---

Built with Python, JavaScript, and a concerning amount of caffeine. Deployed on Vercel and Render, held together by CORS headers and a heartbeat loop.
