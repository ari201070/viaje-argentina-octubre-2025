from fastapi import FastAPI, Query
from fastapi.responses import FileResponse, PlainTextResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import urllib.parse
import os
import sqlite3
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PUBLIC_TRAVELS = os.path.abspath(os.path.join("public", "travels"))
SLOVENIA_DIR = r"F:\2015\Julio\טיול בסלובניה"
ARGENTINA_ROOT = r"F:\2025\Octubre"
DB_PATH = r"F:\photo_catalog.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

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

    count_sql = f"SELECT COUNT(*) FROM photos {where}"
    total = conn.execute(count_sql, params).fetchone()[0]

    sql = f"""
        SELECT
            id,
            original_path,
            final_path,
            filename,
            lat,
            lng,
            date_taken,
            location_source,
            trip_name,
            city,
            province,
            country
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
            dir_part = os.path.dirname(final_path)
            base = os.path.basename(final_path)
            thumb_path = os.path.join(dir_part, "_thumbs", f"thumb_{base}").replace("\\", "/")

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

    return JSONResponse({
        "total": total,
        "limit": limit,
        "offset": offset,
        "photos": photos,
    })

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return PlainTextResponse("", media_type="image/x-icon")

@app.get("/travels/{path:path}")
async def serve_travel_files(path: str):
    decoded_path = urllib.parse.unquote(path)

    direct_file = os.path.join(PUBLIC_TRAVELS, decoded_path)
    if os.path.isfile(direct_file):
        return FileResponse(direct_file, headers={"Cache-Control": "no-cache"})

    if decoded_path.startswith("טיול בסלובניה"):
        rel = decoded_path[len("טיול בסלובניה"):].lstrip("/\\")
        target = os.path.join(SLOVENIA_DIR, rel)
        if os.path.isfile(target):
            return FileResponse(target)

    if decoded_path.startswith("Viaje Familiar de 30 dias por Argentina"):
        target = os.path.join(ARGENTINA_ROOT, decoded_path)
        if os.path.isfile(target):
            return FileResponse(target)

    fallback_arg = os.path.join(ARGENTINA_ROOT, decoded_path)
    if os.path.isfile(fallback_arg):
        return FileResponse(fallback_arg)

    if os.path.isfile(direct_file):
        return FileResponse(direct_file)

    return PlainTextResponse(f"Not found: {decoded_path}", status_code=404)
