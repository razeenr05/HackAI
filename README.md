<div align="center">
  <img src="assets/banner.png" alt="MapScribe.ai" width="800"/>
</div>

# MapScribe.ai

An AI-powered learning platform...


# MapScribe.ai

An AI-powered learning platform that turns any topic into an interactive, personalized knowledge graph. Type a subject and Gemini AI generates a structured mind map of everything you need to learn, in the right order, with real resources and practice problems at every step.

---

## Features

### Knowledge Graph / Mind Map
- AI-generated directed graph of concepts for any topic
- Interactive React Flow canvas with zoom, pan, and drag
- Color-coded node statuses: Completed, In Progress, Weak, Recommended, Locked
- Animated edges between completed prerequisite nodes
- Click any node to open a detail panel with explanation, practice problems, and resources
- Mark nodes complete or incomplete directly from the panel

### Multi-Topic Learning Paths
- Generate graphs for unlimited topics, each saved independently
- Switch between topics instantly from the Assessment page
- Per-topic completion progress bar and node count
- Delete topics you no longer need

### AI YouTube Snippet Finder
- Searches YouTube for the most relevant educational video per topic using yt-dlp
- Fetches the full transcript using youtube-transcript-api (v1.0+)
- Sends the timestamped transcript to Gemini, which identifies the single best 60-90 second teaching segment
- Embeds the video starting at exactly that timestamp
- Shows the AI's reasoning for why that segment was chosen
- Falls back gracefully if no transcript is available

### Dashboard
- Real learning streak calculated from daily activity records
- Overall progress percentage for the active topic
- Knowledge gaps and recommended next topics
- Radar chart of skill levels across concepts

### Practice and Grading
- AI-generated practice problems per concept
- Answer submission with Gemini-powered grading
- Scores, detailed feedback, and model answers returned per submission

### Recommendations
- Prioritized list of what to study next based on node status and prerequisites
- Quick wins: concepts completable in about 30 minutes
- Skill level predictions after completing recommended topics

---

## Tech Stack

**Frontend**
- Next.js 14, TypeScript, Tailwind CSS
- React Flow (@xyflow/react) for the mind map canvas
- shadcn/ui component library
- Recharts for dashboard charts

**Backend**
- FastAPI, Python 3.11
- SQLAlchemy ORM
- PostgreSQL 15

**AI and External Services**
- Google Gemini API
- Google OAuth 2.0 for authentication
- yt-dlp for YouTube search
- youtube-transcript-api (v1.0+) for transcript fetching

**Infrastructure**
- Docker and Docker Compose

---

## Getting Started

### Prerequisites

- Docker Desktop installed and running
- A Google Gemini API key (free tier works, get one at [aistudio.google.com](https://aistudio.google.com/app/apikey))
- A Google OAuth 2.0 Web Client ID from [Google Cloud Console](https://console.cloud.google.com/)

### 1. Clone the repository

```bash
git clone https://github.com/razeenr05/MapScribe.ai.git
cd MapScribe.ai
```

### 2. Configure environment variables

Create a `.env` file in the **root of the project**:

```env
# --- API KEYS ---
# Get these from https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here

# --- GOOGLE OAUTH (Sign in with Google) ---
# Use the SAME OAuth 2.0 Web client ID from Google Cloud Console in BOTH places.
# Backend checks the token's "aud" against GOOGLE_CLIENT_ID (or GOOGLE_CLIENT_IDS).
# Frontend uses NEXT_PUBLIC_GOOGLE_CLIENT_ID to request the token. If they differ → "Google token audience mismatch".
GOOGLE_CLIENT_ID=your_google_oauth_web_client_id.apps.googleusercontent.com

# Frontend (Next.js): copy the same value so the token is issued for this app.
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_web_client_id.apps.googleusercontent.com

# Optional: comma-separated list to accept multiple client IDs (e.g. old + new during migration).
# GOOGLE_CLIENT_IDS=old_id.apps.googleusercontent.com,new_id.apps.googleusercontent.com

# --- DATABASE CONFIG ---
# Default configuration for the Docker Compose postgres service
DATABASE_URL=***REMOVED***

# --- ENVIRONMENT ---
NODE_ENV=development
```

### 3. Start with Docker

```bash
docker compose up --build
```

This starts:
- PostgreSQL on port 5432 (internal)
- FastAPI backend on http://localhost:8000
- Next.js frontend on http://localhost:3000

### 4. Open the app

Go to http://localhost:3000, type any topic, and click **Start**.

### Reset all data

```bash
docker compose down -v
docker compose up --build
```

The `-v` flag removes the Postgres volume so the database is recreated fresh.

---

## File Structure

```
MapScribe/
├── .env
├── docker-compose.yml
├── backend/
│   ├── services/
│   │   ├── ai_service.py
│   │   └── youtube_service.py
│   ├── models.py
│   └── main.py
└── frontend/
    ├── app/
    └── components/
```

---

## API Reference

### Goals

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/goal/{user_id}` | Get the currently active goal |
| `GET` | `/api/goals/{user_id}` | List all saved goals with progress |
| `POST` | `/api/goal/switch` | Switch the active goal |
| `DELETE` | `/api/goal/{goal_id}?user_id=` | Delete a goal and its graph |

### Mind Map

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/generate-graph` | Generate a new knowledge graph via AI |
| `GET` | `/api/mindmap/{user_id}` | Get nodes and edges for the active graph |
| `GET` | `/api/nodes/{node_id}` | Get full concept detail |
| `DELETE` | `/api/graph/{user_id}` | Delete the active graph |

### Progress

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/progress/{user_id}` | Get all completed node IDs |
| `POST` | `/api/progress/complete` | Mark a node complete |
| `DELETE` | `/api/progress/uncomplete` | Unmark a node as complete |
| `GET` | `/api/progress/{user_id}/unlock/{node_id}` | Check if a node is unlocked |

### Learning Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/{user_id}` | Stats, streak, progress, recommendations |
| `GET` | `/api/recommendations/{user_id}` | Prioritized next-step recommendations |
| `GET` | `/api/resources?user_id=` | Resources for active topic |
| `GET` | `/api/practice?user_id=` | Practice problems for active topic |
| `POST` | `/api/grade-answer` | AI grades a practice answer |

### YouTube Snippets

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/snippet/{node_id}` | Find best YouTube snippet for a node |
| `GET` | `/api/snippet/search?topic=` | Find best YouTube snippet by topic name |

**Snippet response:**
```json
{
  "url": "https://youtube.com/watch?v=...",
  "video_title": "Music Theory Crash Course",
  "channel_name": "Rick Beato",
  "start_time": 222,
  "end_time": 312,
  "reasoning": "This segment directly explains the core concept from first principles."
}
```

---

## Troubleshooting

**"Load failed" on the home page** - The frontend cannot reach the backend. Run `docker compose ps` to confirm both containers are healthy and check `docker compose logs backend` for errors.

**"All models failed" when generating a graph** - Your Gemini API key is missing or invalid. Confirm `GEMINI_API_KEY` is set correctly in `.env`.

**Mind map shows the wrong topic after switching** - Ensure you are running the latest `main.py` and `models.py`. If the database has the old single-goal schema, do a clean restart: `docker compose down -v && docker compose up --build`.

**YouTube snippet shows no video or falls back to a placeholder** - Some videos disable transcripts. The service tries up to 8 candidates automatically. Make sure `yt-dlp` and `youtube-transcript-api` are in `requirements.txt`.

**"Google token audience mismatch"** - The `GOOGLE_CLIENT_ID` in `.env` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` must be the same value. Double-check both are set to the same OAuth Web Client ID from Google Cloud Console.

---

## Roadmap

- Mobile-responsive mind map view
- Learning time tracking (actual hours, not just streaks)

---

## License

MIT License. See [LICENSE](LICENSE) for details.
