// Impostazioni dell'app salvate nel browser (IndexedDB): riferimento alla cartella
// dell'archivio, soglie dei suggerimenti. Mai dati dei clienti.
const DB = 'valutazione-posturale';
const STORE = 'impostazioni';

function idb(mode, fn) {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onerror = () => rej(r.error);
    r.onsuccess = () => {
      const tx = r.result.transaction(STORE, mode);
      const q = fn(tx.objectStore(STORE));
      tx.oncomplete = () => { r.result.close(); res(q?.result); };
      tx.onerror = () => rej(tx.error);
    };
  });
}

export async function leggi(chiave) {
  try { return await idb('readonly', (s) => s.get(chiave)); } catch { return undefined; }
}

export async function scrivi(chiave, valore) {
  try { await idb('readwrite', (s) => s.put(valore, chiave)); return true; } catch { return false; }
}

export async function elimina(chiave) {
  try { await idb('readwrite', (s) => s.delete(chiave)); } catch { /* niente da fare */ }
}
