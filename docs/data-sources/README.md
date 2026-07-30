# Data sources

This folder documents external and imported source material for the Argentina
family trip project.

## Imported into the repository

- `public/travel-documents/`: small travel documents from
  `F:/Documentos_Viaje/2025/Octubre`.
- `public/travel-references/`: loose reference screenshots and images from
  `F:/2025/Octubre/Viaje Familiar de 30 dias por Argentina`.
- `legacy/photo_catalog.db`: imported placeholder from
  `C:/Users/flier/GitHub/photo_catalog.db`. It was empty at import time.
- `src/data/sources/travelSources.json`: machine-readable inventory of the
  imported files and the larger external album.

## Referenced externally

The full family photo/video archive is intentionally not copied into Git because
it contains more than 11 GB of media. It is tracked by source path, folder,
extension, file count, and byte size in `src/data/sources/travelSources.json`.

Original archive path:

```text
F:/2025/Octubre/Viaje Familiar de 30 dias por Argentina
```

When the app gains a media ingestion pipeline, use the JSON inventory as the
starting point and import optimized derivatives instead of committing originals.
