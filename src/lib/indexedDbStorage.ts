/**
 * Bulletproof IndexedDB storage for DMS documents, PDF snapshots, and large file blobs.
 * IndexedDB has no 5MB limit and can safely store 100s of MBs of document payloads.
 */

const DB_NAME = 'FocusErpDmsDB';
const DB_VERSION = 1;
const STORE_NAME = 'document_blobs';

function openDmsDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export const dmsBlobStore = {
  async saveBlob(docId: string, contentUrlOrBlob: string): Promise<boolean> {
    try {
      const db = await openDmsDb();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({ id: docId, content: contentUrlOrBlob, updatedAt: Date.now() });

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  },

  async getBlob(docId: string): Promise<string | null> {
    try {
      const db = await openDmsDb();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(docId);

        req.onsuccess = () => {
          if (req.result && req.result.content) {
            resolve(req.result.content);
          } else {
            resolve(null);
          }
        };

        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },

  async deleteBlob(docId: string): Promise<void> {
    try {
      const db = await openDmsDb();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(docId);
    } catch {}
  },

  async deleteBlobsBatch(docIds: string[]): Promise<void> {
    try {
      const db = await openDmsDb();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      docIds.forEach((id) => store.delete(id));
    } catch {}
  },
};
