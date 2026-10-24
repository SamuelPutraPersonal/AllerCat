import { DEFAULT_PILL_ID } from './types'
import type { PillLog, StoreMap, StoreName } from './types'

const DB_NAME = 'allercat'
const DB_VERSION = 2
const STORES: StoreName[] = ['pillLogs']

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      for (const old of Array.from(req.result.objectStoreNames)) {
        if (!STORES.includes(old as StoreName)) req.result.deleteObjectStore(old)
      }
      for (const name of STORES) {
        if (!req.result.objectStoreNames.contains(name)) {
          req.result.createObjectStore(name, { keyPath: 'id' })
        }
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

async function run<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(store, mode).objectStore(store))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** Logs saved before multi-pill support have no `pillId`; they belong to the starter pill. */
function withPillId<S extends StoreName>(store: S, items: StoreMap[S][]): StoreMap[S][] {
  if (store !== 'pillLogs') return items
  return (items as PillLog[]).map((l) => (l.pillId ? l : { ...l, pillId: DEFAULT_PILL_ID })) as StoreMap[S][]
}

export const db = {
  getAll: async <S extends StoreName>(store: S) =>
    withPillId(store, await run<StoreMap[S][]>(store, 'readonly', (s) => s.getAll())),
  put: <S extends StoreName>(store: S, value: StoreMap[S]) => run(store, 'readwrite', (s) => s.put(value)),
  remove: (store: StoreName, id: string) => run(store, 'readwrite', (s) => s.delete(id)),
  clear: (store: StoreName) => run(store, 'readwrite', (s) => s.clear()),
}
