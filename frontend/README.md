# UpTrack frontend

React + Vite + TypeScript + Tailwind CSS 4 dashboard for the existing FastAPI backend in `../backend`.
Pages: Overview, Monitored websites, Website details (`/websites/:id`), Incidents.

## Run locally (frontend against the existing backend)

You need three things running: Postgres, the FastAPI backend, and Vite.

```bash
# 1. Database: start Postgres however you normally do. The backend expects
#    postgresql+psycopg://uptrack:uptrack_dev@localhost:5433/uptrack (hard-coded in backend/app/database.py).
#    The `db` service in the existing docker-compose.yml provides exactly this, if you use it.

# 2. Backend (from the repo root).
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --port 8000

# 3. Frontend (in a second terminal, from the repo root)
cd frontend
cp .env.example .env
npm install
npm run dev                                             # http://localhost:5173
```

Optional: `python test-site/server.py` starts a toggleable test site on `http://127.0.0.1:9000`
(`/down` makes it return 503, `/up` restores it). Add it as a website to see incidents open and resolve.

### Why requests go to `/api`

The backend has **no CORS middleware**, so a page on `:5173` cannot call `:8000` directly. The frontend always
calls the same-origin path `/api/...`; Vite strips the `/api` prefix and forwards to FastAPI.
No backend change is needed. Setting `VITE_API_BASE_URL` to an absolute URL only works if CORS is enabled
on the backend.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Base path for all API calls |
| `VITE_DEV_PROXY_TARGET` | `http://127.0.0.1:8000` | Where Vite proxies `/api` (dev and preview) |

If your backend runs on another port, change `VITE_DEV_PROXY_TARGET` in `.env` and restart Vite.

## Verify the integration

1. Top bar shows **API: Healthy** (this is the real result of `GET /health`, polled every 15 s).
2. Add a website. It appears in the table; with "Run the first check now" ticked the status comes from the
   backend's returned check.
3. Stop the backend: the indicator turns red and pages show an error with a retry button. Start it again and press Refresh.
4. Stop Postgres while the backend runs: the indicator shows "Database error" (`/health` fails).

## Endpoint mapping

| UI | Endpoint |
|---|---|
| Health indicator | `GET /health` |
| Summary cards | `GET /stats/overview` |
| Check success rate | `GET /stats/uptime?hours=` (1–720) |
| Response-time chart | `GET /stats/response-times?hours=&limit=500` |
| Website table | `GET /websites/`, then `GET /websites/{id}/checks?limit=30` per website |
| Add website | `POST /websites/` `{name, url, check_interval_seconds}` |
| Details | `GET /websites/{id}`, `GET /websites/{id}/checks?limit=100`, `GET /websites/{id}/incidents` |
| Check now | `POST /websites/{id}/check` |
| Delete | `DELETE /websites/{id}` |
| Incidents page | `GET /websites/`, then `GET /websites/{id}/incidents` per website (no global endpoint exists) |

## Scripts

`npm run dev` · `npm run build` (typecheck + bundle) · `npm run preview` (serve the production build on :4173, same proxy) · `npm run lint` · `npm test`

## Behaviour notes

- Status is derived only from the latest real check. A website with no checks is "Not checked", never "Up".
- Data refreshes every 30 s while the tab is visible, on the Refresh button, and after any change you make.
- Failed checks still carry a response time (time until failure). Charts mark them in red and say so.
- Partial failures (some websites' history/incidents could not load) are reported, never shown as empty.

## Not built because the backend has no support

Editing a website, pausing/resuming, alert notifications, global incident list, incident acknowledgement or manual
resolution, authentication. Settings and account menus are omitted for that reason.
