# YouTube Wrapped

**Your year in videos — analyzed, clustered, and presented.**

YouTube Wrapped takes your Google Takeout watch history and turns it into a Spotify Wrapped-style presentation — complete with binge session detection, genre clustering via machine learning, taste drift analysis, and a distinctive visual design.

---

## What Is This?

Basically, you export your YouTube watch history as a zip file from Google Takeout, upload it here, and the app does a bunch of analysis behind the scenes. It figures out your top channels, when you watch the most, whether you're a binge-watcher, and what genres you're into — then presents it all in a slick 7-slide phone-frame presentation with animations and everything.

The whole thing runs on a FastAPI backend with PostgreSQL and a Next.js frontend. There's some ML thrown in for the genre clustering (sentence-transformers + KMeans), a YouTube API enrichment step to get video metadata, and a custom binge detection algorithm that I'm pretty happy with.

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
| ML | sentence-transformers (`all-MiniLM-L6-v2`) | Lightweight embedding model, 384 dimensions, fast inference |
| Clustering | scikit-learn (KMeans) | Simple, deterministic, works well for this use case |
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
            └─ Embed video titles + category names via sentence-transformer
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
            ├─ Slide 6: Taste drift over time (area chart)
            └─ Slide 7: Summary + image export
```

---

## Architecture

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
│   │   ├── health.py         # Health check
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
└── tests/                    # 25 pytest tests

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
| `clusterer.py` | The complex one. Sentence-transformer embeddings, KMeans clustering, label assignment, taste drift. | ~290 |
| `CRTHero.js` | Interactive 3D monitor with Three.js. Mouse parallax, screen glow, boot text overlay. Respects reduced motion. | ~380 |
| `SlideContainer.js` | Story-style carousel. Auto-advance, swipe, progress bars, screen transition effects. | ~200 |
| `UploadClient.js` | Drag-and-drop upload, progress polling, past wraps display. | ~370 |

---

## Key Technical Decisions

This section explains some of the "why" behind the technical choices. Not everything here was the *optimal* solution — but it was the right tradeoff given my experience level and the project's constraints.

### Streaming Zip Extraction vs. Loading Everything

I went with stream-based extraction (reading 64KB chunks) instead of loading the entire zip into memory. The main reason is zip-bomb protection — a malicious zip could compress to 1MB but expand to 50GB, and you'd blow up your server's memory before you know it.

The 500MB threshold caught everything I tested against. The 64KB chunk size was honestly arbitrary — I tried bigger chunks but it didn't make a noticeable difference in speed, so I stuck with the smaller size for better memory control.

Could I have used a third-party library for this? Probably. But the stdlib `zipfile` module does the job fine, and I wanted to understand the streaming logic myself.

### Sentence-Transformers + KMeans for Clustering

I considered a few approaches for genre clustering:

- **TF-IDF + KMeans**: Simpler, but doesn't capture semantic similarity. "Python tutorial" and "coding lesson" would be in different clusters even though they're related.
- **YouTube categories alone**: Too coarse. "Entertainment" is a massive category that doesn't tell you much.
- **Sentence-transformers + KMeans**: Gets semantic embeddings from video titles, then clusters them. I append the YouTube category name in brackets ("Python Tutorial [Education]") to give the model more signal.

The `all-MiniLM-L6-v2` model is small (384 dimensions) and fast. For a personal project, I don't need GPT-4-level embeddings — this model does the job in milliseconds.

KMeans with `k=8` and `random_state=42` gives deterministic results. I could have used `KMeans` with `n_init="auto"` and let it figure out the optimal k, but deterministic output is more important here — I want the same watch history to produce the same clusters every time.

Small clusters (< 2% of videos) get merged into "Other." Without this, you'd end up with categories like "Music · Gaming" with 3 videos in them, which looks messy.

### JSONB for Embedding Storage

This is one of those "it would have been better but I haven't learned it yet" moments.

I store the 384-dimensional embedding vectors as JSONB in PostgreSQL's `video_metadata_cache` table. This works — I can store and retrieve them fine, and the cache invalidation logic (SHA-256 hash of the title) prevents stale embeddings.

But **pgvector** would have been the better choice. It's a PostgreSQL extension designed specifically for vector storage and similarity search. It supports HNSW indexing, which would make nearest-neighbor queries much faster if I ever wanted to add a "similar videos" feature.

The JSONB approach works for this project's scale (thousands of videos, not millions), but it's not what I'd use in production. I just haven't had time to learn pgvector yet.

### Background Tasks vs. Proper Job Queues

FastAPI's `BackgroundTasks` is dead simple — you just pass a function and it runs after the response is sent. For this project, it's perfect. The upload endpoint returns immediately, and the processing happens async.

But it's not a real job queue. There's no retry logic, no persistence (if the server restarts, the task is lost), no concurrency control. For a production app, I'd use **Celery with Redis** or **ARQ** — both give you proper task queues with retries, monitoring, and distributed workers.

For now, BackgroundTasks is fine. If the processing fails, the user can just re-upload.

### Client-Side Polling vs. WebSockets

The frontend polls `GET /api/upload/{id}/status` every 2 seconds to check if processing is done. It's simple and works, but it's not efficient — 99% of the polls return "still processing."

**WebSockets** or **Server-Sent Events (SSE)** would be better. The server could push a status update when processing completes, and the frontend wouldn't need to poll at all.

I went with polling because it was faster to implement and I didn't want to deal with WebSocket connection management in FastAPI. It's a known limitation — if I were building this for thousands of users, I'd switch to SSE.

### Partial Failure Resilience

If the clustering pipeline fails (maybe there aren't enough videos, or the model download fails), the system still returns the analysis results from Stage 3. The user gets their top channels, heatmap, and binge sessions — just no genre breakdown.

This was a deliberate choice. The clustering is the most failure-prone stage (requires 100+ enriched videos, external model loading, embedding computation). It shouldn't invalidate the simpler analysis that users still want to see.

I store a `clustering_skipped_reason` string so the frontend can display a message like "Genre breakdown unavailable (not enough videos)" instead of just showing nothing.

### Visual Design

This was 100% a vibes decision. Spotify Wrapped has a clean, modern look. I wanted something different — something that felt like you're booting up an old terminal to access your viewing archive.

The design uses **VT323** for display text, **phosphor orange** (#FFAE5C) as the primary accent, scanlines and grain overlays for texture, and a **3D interactive monitor** on the landing page built with Three.js.

The 3D monitor was the most fun part. It's a box geometry with a phosphor-glow screen, chrome frame pieces, ventilation slots, a power LED, and a base foot. Mouse movement drives parallax rotation, and the screen text renders to a canvas texture.

I also added a `prefers-reduced-motion` check — if the user has reduced motion enabled in their OS, the 3D monitor is replaced with a static fallback. Accessibility matters, even in side projects.

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (local or hosted)
- YouTube Data API v3 key (for enrichment — the app works without it, but you won't get video metadata)

### Backend Setup

1. Navigate to the `backend/` directory
2. Create a virtual environment: `python -m venv venv`
3. Activate it: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
4. Install dependencies: `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and fill in your values:
   - `DATABASE_URL` — your PostgreSQL connection string
   - `YOUTUBE_API_KEY` — your YouTube Data API v3 key
   - `NEXTAUTH_SECRET` — a random string for NextAuth
   - `FRONTEND_URL` — your frontend URL (default: `http://localhost:3000`)
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

**Sentence-transformers for embeddings.** The model is small, fast, and the embeddings are surprisingly good for clustering video titles. Combining the title with the YouTube category name in brackets ("Python Tutorial [Education]") gave much better clusters than titles alone. The category acts as a semantic anchor.

**FastAPI's BackgroundTasks.** Dead simple async processing. The upload endpoint returns in milliseconds while the heavy lifting happens in the background. For a side project, this is way simpler than setting up Celery + Redis.

**The CRT aesthetic.** It's distinctive. Every "Spotify Wrapped clone" has a clean, modern look. The retro terminal vibe makes this one memorable. The 3D monitor on the landing page was the most fun I've had building a component.

### Things I'd Do Differently

**pgvector instead of JSONB for embeddings.** I store 384-dimensional vectors as JSONB because I didn't know how to set up pgvector. It works, but pgvector would give me proper vector indexing and faster similarity queries. It's on my list to learn.

**WebSockets for real-time status updates.** The 2-second polling is wasteful. SSE or WebSockets would be more efficient and feel more responsive. Polling was just faster to implement.

**Proper job queue (Celery/ARQ).** BackgroundTasks is fine for a demo, but it doesn't persist tasks across server restarts and has no retry logic. A real job queue would make this more robust.

**End-to-end tests.** I have 31 unit tests covering the core logic, but no tests that actually upload a zip and verify the full pipeline runs. Playwright or Cypress would catch integration issues that unit tests miss.

**Rate limiting on the YouTube API.** The quota is 10,000 units/day. If multiple users upload large histories on the same day, I could blow through the quota fast. I handle the `quotaExceeded` error gracefully, but I don't implement any rate limiting or quota tracking on my end.

### Random Things I Learned

- Google Takeout zips can have inconsistent folder structures. The same export might have `Takeout/YouTube/history/watch-history.json` in one case and `takeout_2024/YouTube and YouTube Music/history/watch-history.json` in another. That's why the zip search is case-insensitive and works recursively.
- YouTube's API returns nested error objects that are annoying to parse. A 403 response has `error.errors[0].reason` — three levels deep. It's not documented anywhere obvious.
- The `isodate` library can throw weird exceptions for malformed durations. I just catch everything and default to 0 seconds. Not ideal, but YouTube's duration format is mostly consistent.
- SQLAlchemy sometimes returns naive datetimes even when you configured timezone-aware columns. I added a `tzinfo is None` check in the status endpoint to handle this.

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
| No user-uploaded model options | Stuck with `all-MiniLM-L6-v2` | Allow model selection or fine-tuning |
| Single-server deployment | No horizontal scaling | Add proper job queue + load balancer |

---

## License

This project is for personal/educational use. Not licensed for commercial deployment.

---

Built with Python, JavaScript, and a concerning amount of caffeine.
