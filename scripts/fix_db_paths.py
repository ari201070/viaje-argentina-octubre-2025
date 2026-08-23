import sys, sqlite3
sys.stdout.reconfigure(encoding='utf-8')

DB_PATH = r'C:\Users\flier\GitHub\viaje-argentina-octubre-2025\legacy\photo_catalog.db'

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Fix all file_path references from Septiembre to Octubre
c.execute("UPDATE photos SET file_path = REPLACE(file_path, 'F:\\2025\\Septiembre\\', 'F:\\2025\\Octubre\\') WHERE file_path LIKE '%Septiembre%'")
updated1 = c.rowcount

# Also fix any that might have relative paths
c.execute("UPDATE photos SET file_path = REPLACE(file_path, 'Viaje Familiar de 30 dias por Argentina', 'Viaje Familiar de 30 dias por Argentina') WHERE trip_name='argentina-2025'")
updated2 = c.rowcount

conn.commit()

# Verify
c.execute("SELECT COUNT(*) FROM photos WHERE trip_name='argentina-2025' AND file_path LIKE '%Septiembre%'")
remaining = c.fetchone()[0]
print(f"Updated {updated1} rows from Septiembre to Octubre")
print(f"Remaining Septiembre refs: {remaining}")

conn.close()
