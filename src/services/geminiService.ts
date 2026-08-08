import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

/**
 * geminiService.ts — Servicio de IA Visual (Gemini) para análisis de fotos.
 *
 * Adaptado de `src/imports/geomatica-vision-ai/src/services/geminiService.ts`
 * para el proyecto principal. Usa `@google/generative-ai` (ya instalado) y
 * lee la API Key desde `import.meta.env.VITE_GEMINI_API_KEY` con fallback seguro.
 */

/** Modelo por defecto para análisis visual. */
export const DEFAULT_VISION_MODEL = "gemini-2.5-flash";

/** Lee la API Key de forma segura (Vite env + fallback). */
export function getGeminiApiKey(): string {
  const fromVite = (import.meta as any)?.env?.VITE_GEMINI_API_KEY;
  if (fromVite && fromVite.trim()) return fromVite.trim();
  // Fallback seguro: no exponer claves hardcodeadas en producción.
  return "";
}

/** Indica si hay una API Key configurada. */
export function hasGeminiApiKey(): boolean {
  return getGeminiApiKey().length > 0;
}

let cachedClient: GoogleGenerativeAI | null = null;

/** Obtiene (y cachea) el cliente de Gemini. Devuelve null si no hay key. */
export function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  if (!cachedClient) {
    cachedClient = new GoogleGenerativeAI(apiKey);
  }
  return cachedClient;
}

/** Configuración de seguridad conservadora para análisis de fotos de viaje. */
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

/** Convierte un File a base64 (sin prefijo data URL). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Resultado del análisis visual de una foto. */
export interface PhotoAnalysisResult {
  description: string;
  landmarks: string[];
  labels: string[];
  texts: string[];
  category?: string;
  locationHint?: string;
  isTravelRelevant: boolean;
}

const EMPTY_RESULT: PhotoAnalysisResult = {
  description: "",
  landmarks: [],
  labels: [],
  texts: [],
  isTravelRelevant: false,
};

/**
 * Analiza una imagen con Gemini (visión por computadora).
 * Extrae descripción, hitos, etiquetas, texto OCR y relevancia de viaje.
 */
export async function analyzePhoto(
  file: File,
  options?: { model?: string; context?: string }
): Promise<PhotoAnalysisResult> {
  const client = getGeminiClient();
  if (!client) return EMPTY_RESULT;

  const modelName = options?.model || DEFAULT_VISION_MODEL;
  const model = client.getGenerativeModel({
    model: modelName,
    safetySettings: SAFETY_SETTINGS,
  });

  const base64 = await fileToBase64(file);
  const mimeType = file.type || "image/jpeg";

  const contextPrompt = options?.context
    ? `\nContexto del viaje: ${options.context}`
    : "";

  const prompt = `Analiza esta fotografía de un viaje familiar por Argentina.
Extrae la siguiente información en formato JSON:
1. description: Una descripción breve (1-2 frases) de lo que se ve en la imagen.
2. landmarks: Lista de puntos de interés o lugares famosos reconocidos (vacío si no hay).
3. labels: Lista de etiquetas descriptivas generales (ej: "montaña", "ciudad", "comida", "playa", "museo").
4. texts: Lista de textos o carteles visibles en la imagen (OCR, vacío si no hay).
5. category: Categoría de la foto (ej: "Paisaje", "Comida", "Personas", "Arquitectura", "Naturaleza", "Transporte", "Otro").
6. locationHint: Sugerencia de ubicación o lugar probable (ej: "Bariloche", "Cataratas del Iguazú") si se puede inferir.
7. isTravelRelevant: true si la foto es relevante para documentar el viaje (paisajes, lugares, comida, actividades), false si es irrelevante (capturas de pantalla, documentos, selfies de baja calidad).${contextPrompt}

Devuelve SOLO un objeto JSON válido, sin markdown ni explicaciones.`;

  try {
    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      { text: prompt },
    ]);

    const text = result.response.text()?.trim() || "";
    if (!text) return EMPTY_RESULT;

    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as Partial<PhotoAnalysisResult>;
    return {
      description: parsed.description || "",
      landmarks: Array.isArray(parsed.landmarks) ? parsed.landmarks : [],
      labels: Array.isArray(parsed.labels) ? parsed.labels : [],
      texts: Array.isArray(parsed.texts) ? parsed.texts : [],
      category: parsed.category,
      locationHint: parsed.locationHint,
      isTravelRelevant: parsed.isTravelRelevant !== false,
    };
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("quota")) {
      throw new Error("RATE_LIMIT_EXCEEDED");
    }
    console.error("geminiService: Error analizando foto:", error);
    return EMPTY_RESULT;
  }
}

/**
 * Auto-etiqueta una foto con etiquetas relevantes para el viaje.
 * Devuelve un array de strings (tags) en español.
 */
export async function autoTagPhoto(
  file: File,
  options?: { model?: string; maxTags?: number }
): Promise<string[]> {
  const client = getGeminiClient();
  if (!client) return [];

  const modelName = options?.model || DEFAULT_VISION_MODEL;
  const model = client.getGenerativeModel({
    model: modelName,
    safetySettings: SAFETY_SETTINGS,
  });

  const base64 = await fileToBase64(file);
  const mimeType = file.type || "image/jpeg";
  const maxTags = options?.maxTags || 8;

  const prompt = `Genera hasta ${maxTags} etiquetas (tags) en español para esta fotografía de un viaje por Argentina.
Las etiquetas deben ser útiles para organizar un álbum de viaje (ej: "Bariloche", "Cataratas", "Asado", "Montañas", "Familia", "Naturaleza").
Devuelve SOLO un array JSON de strings, sin markdown ni explicaciones.`;

  try {
    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      { text: prompt },
    ]);

    const text = result.response.text()?.trim() || "";
    if (!text) return [];

    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.filter((t) => typeof t === "string" && t.trim()).slice(0, maxTags);
    }
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("quota")) {
      throw new Error("RATE_LIMIT_EXCEEDED");
    }
    console.error("geminiService: Error auto-etiquetando foto:", error);
  }
  return [];
}

/**
 * Extrae contexto/lugares de una foto (hitos + hint de ubicación).
 * Conveniente para enriquecer la Galería o el Mapa.
 */
export async function extractPhotoContext(
  file: File,
  options?: { model?: string; context?: string }
): Promise<{ landmarks: string[]; locationHint?: string; category?: string }> {
  const result = await analyzePhoto(file, options);
  return {
    landmarks: result.landmarks,
    locationHint: result.locationHint,
    category: result.category,
  };
}