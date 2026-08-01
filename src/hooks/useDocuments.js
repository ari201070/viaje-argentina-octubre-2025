import { useState, useEffect, useCallback } from "react";
import { putItem, getAllItems, getItem, deleteItem } from "../utils/idbStorage";

/**
 * Hook para gestionar documentos en IndexedDB.
 * Operaciones CRUD: guardar, listar, eliminar, obtener URL temporal.
 *
 * @returns {Object} - { documents, loading, saveDocument, deleteDocument, getDocumentUrl, revokeUrl }
 */
export default function useDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const items = await getAllItems();
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setDocuments(items);
    } catch (err) {
      console.error("useDocuments: Error al listar documentos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await getAllItems();
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (!cancelled) {
          setDocuments(items);
        }
      } catch (err) {
        console.error("useDocuments: Error al listar documentos:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveDocument = useCallback(
    async (doc) => {
      try {
        await putItem(doc);
        await refresh();
      } catch (err) {
        console.error("useDocuments: Error al guardar documento:", err);
      }
    },
    [refresh]
  );

  const removeDocument = useCallback(
    async (id) => {
      try {
        await deleteItem(id);
        await refresh();
      } catch (err) {
        console.error("useDocuments: Error al eliminar documento:", err);
      }
    },
    [refresh]
  );

  const getDocumentUrl = useCallback(async (id) => {
    try {
      const doc = await getItem(id);
      if (!doc || !doc.blob) return null;
      return URL.createObjectURL(doc.blob);
    } catch (err) {
      console.error("useDocuments: Error al obtener URL:", err);
      return null;
    }
  }, []);

  const revokeUrl = useCallback((url) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }, []);

  return {
    documents,
    loading,
    saveDocument,
    deleteDocument: removeDocument,
    getDocumentUrl,
    revokeUrl,
  };
}