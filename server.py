from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import sqlite3
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

DB_PATH = r"F:\photo_catalog.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.get("/")
async def root():
    return {"status": "online", "project": "Photo Catalog"}


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


@app.get("/api/trips")
async def list_trips():
    conn = get_db()
    rows = conn.execute("""
        SELECT trip_name, COUNT(*) as count
        FROM photos
        WHERE trip_name IS NOT NULL AND trip_name != ''
        GROUP BY trip_name
        ORDER BY trip_name
    """).fetchall()
    conn.close()
    return [{"trip_name": r["trip_name"], "count": r["count"]} for r in rows]


@app.get("/api/photos")
async def get_photos(
    trip_name: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    limit: int = Query(500, ge=1, le=5000),
    offset: int = Query(0, ge=0),
):
    conn = get_db()
    conditions = []
    params = []

    if trip_name:
        conditions.append("trip_name = ?")
        params.append(trip_name)
    if city:
        conditions.append("city = ?")
        params.append(city)

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    total = conn.execute(f"SELECT COUNT(*) FROM photos {where}", params).fetchone()[0]

    sql = f"""
        SELECT id, original_path, final_path, filename,
               lat, lng, date_taken, location_source,
               trip_name, city, province, country
        FROM photos
        {where}
        ORDER BY date_taken ASC
        LIMIT ? OFFSET ?
    """
    rows = conn.execute(sql, params + [limit, offset]).fetchall()
    conn.close()

    photos = []
    for r in rows:
        final_path = r["final_path"] or ""
        thumb_path = ""
        if final_path:
            d = os.path.dirname(final_path)
            b = os.path.basename(final_path)
            thumb_path = os.path.join(d, "_thumbs", f"thumb_{b}").replace("\\", "/")

        photos.append({
            "id": r["id"],
            "original_path": (r["original_path"] or "").replace("\\", "/"),
            "final_path": final_path.replace("\\", "/"),
            "thumb_path": thumb_path,
            "filename": r["filename"],
            "latitude": r["lat"],
            "longitude": r["lng"],
            "datetime_original": r["date_taken"],
            "location_source": r["location_source"],
            "trip_name": r["trip_name"],
            "city": r["city"],
            "province": r["province"],
            "country": r["country"],
        })

    return JSONResponse({"total": total, "limit": limit, "offset": offset, "photos": photos})
