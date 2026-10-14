# Proposed backend changes (not applied)

The frontend works with the backend exactly as supplied. These are the smallest changes that would be needed
for specific goals. Nothing here has been made to your backend code.

## 1. Rename `___init___.py` to `__init__.py`

`backend/app/___init___.py` and `backend/app/routers/___init___.py` have three underscores each. Python's implicit
namespace packages make imports work anyway, but tools that expect real packages may not.

## 2. Guard job removal on delete

`DELETE /websites/{id}` calls `scheduler.remove_job(...)` unguarded. If no job exists for that id (for example an
inactive website), APScheduler raises `JobLookupError` and the request returns 500 before the row is deleted.
Wrap it in `try/except JobLookupError`.

## 3. Optional: CORS

Not needed by this frontend (it uses a same-origin proxy). Only add `CORSMiddleware` if you want a browser app
to call the API cross-origin.

## 4. Optional endpoints that would simplify the UI

- A global `GET /incidents` would replace the per-website fan-out on the Incidents page.
- Including the latest check in `GET /websites/` would replace the per-website check requests on the table.
