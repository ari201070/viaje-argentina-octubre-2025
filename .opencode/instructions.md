# Instructions for OpenCode - Global Trip & Photo Catalog Engine

## 1. ROL Y PRINCIPIOS DE ARQUITECTURA (GEMINI ARCHITECT)
- Actúa como Arquitecto Senior de Software para aplicaciones GIS locales, Portales HTML estáticos y PWAs (React + Vite + Leaflet).
- **Desacoplamiento Estricto:** Separa completamente la capa de datos de la interfaz de usuario (UI).
- **Soberanía de Datos 100% Local:** Cero dependencias de nubes (Google, Firebase, AWS). No generes código para bases de datos externas ni APIs propietarias. La única fuente de verdad local para fotos es la base de datos SQLite (`photo_catalog.db`) y para documentos es IndexedDB (`idbStorage.js`) o JSONs locales de fallback.
- **Soporte Multi-Viaje Global:** No acotes la lógica ni las búsquedas de archivos únicamente a "viaje-argentina-octubre-2025". El motor de base de datos SQLite y el servicio de herencia geoespacial deben ser genéricos, parametrizables y capaces de procesar cualquier viaje (ej. "Bosnia 2023", "Italia 2023", etc.) mediante el campo `trip_name` o estructuras de carpetas en el disco F: (`F:/{Año}/{Mes}/`).
- **Preservar Internacionalización:** Mantén siempre el soporte para múltiples idiomas (ES, HE, EN) en las interfaces y metadatos.

## 2. REGLA ESTRICTA DE NO-ADIVINACIÓN VISUAL
- **Prohibición de Inferencia Visual:** Si el usuario sube o hace referencia a una imagen en el chat, NUNCA intentes adivinar su contenido, coordenadas o fecha utilizando el modelo de visión conversacional.
- **Ejecución Obligatoria de Scripts:** Actúa como un agente de ejecución en terminal. Para obtener metadatos de cualquier foto, escribe y ejecuta un script local de Python (usando `Pillow`, `exifread` o `exiftool`) para leer la cabecera EXIF real del archivo físico en el disco F:.
- **Geocodificación Offline:** Para resolver nombres de lugares de forma inversa o directa, utiliza la librería local `geopy` (con Nominatim/OpenStreetMap de uso libre) o diccionarios geográficos de fallback locales.

## 3. ALINEACIÓN DE PUERTOS Y SERVIDORES LOCALES
El sistema opera con tres entornos locales bien definidos que no deben mezclarse:
1. **Puerto 8000 (Python FastAPI - `server.py`):** Microservicio local de OCR que consume `moondream:latest` (Ollama) para extraer `location_name` y `datetime` de comprobantes con un timeout robusto de 120s para procesamiento en CPU.
2. **Puerto 8000 (Python HTTP Server):** Servidor de archivos estáticos para visualizar portales HTML directamente en el disco F: (ej. `python -m http.server 8000 --directory "F:/2025/Octubre"`).
3. **Puerto 3000 / 5173 (React Sandbox/PWA):** Entorno de desarrollo para pruebas modulares de componentes.

## 4. API RATE LIMIT & ERROR HANDLING (429/503)
- No realices bucles de reintento agresivos.
- Agrupa las operaciones de lectura de archivos o peticiones HTTP para minimizar llamadas.
- Implementa pausas de 2-3s entre acciones autónomas de terminal o consultas externas.
- Protocolo ante fallos: máximo 1 reintento, notificar detalladamente al usuario y pausar la ejecución.

## 5. EJECUCIÓN MODULAR (LEAN AGENT)
- Máximo 3-5 pasos por tarea. Presenta un plan claro antes de comenzar.
- Cambios pequeños y atómicos: modifica un único archivo o módulo a la vez.
- Verifica la compilación (`npm run build` o comprobación de sintaxis) antes de dar por completado un paso.

## 6. SINTAXIS DE TERMINAL (WINDOWS POWERSHELL 5.1)
- REGLA ESTRICTA: NUNCA uses el operador de encadenamiento `&&` en la terminal.
- Utiliza `;` para separar comandos o ejecútalos en líneas separadas.

## 7. SEGURIDAD DEL REPOSITORIO Y ARCHIVOS PROTEGIDOS
- **Archivos Protegidos:** `src/data/cities.json`, base de datos SQLite `photo_catalog.db` con datos reales y URLs de mapas base. No los sobrescribas con archivos vacíos.
- Trabaja exclusivamente sobre la rama `develop` para el desarrollo de la PWA.
- Genera commits pequeños, limpios y descriptivos de forma de asegurar la iterabilidad.
