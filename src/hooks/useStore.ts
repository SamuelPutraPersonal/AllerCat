import { useCallback, useEffect, useState } from 'react'
import { db } from '../storage'
import { LOGS_CHANGED_EVENT } from '../lib/reminders'
import type { StoreMap, StoreName } from '../storage'

/** Offline-first collection backed by IndexedDB. */
export function useStore<S extends StoreName>(store: S) {
  const [items, setItems] = useState<StoreMap[S][]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    const load = () =>
      db
        .getAll(store)
        .then((all) => alive && setItems(all))
        .finally(() => alive && setLoading(false))
    load()
    // Other components (and Settings resets) change the same store; stay in sync.
    window.addEventListener(LOGS_CHANGED_EVENT, load)
    return () => {
      alive = false
      window.removeEventListener(LOGS_CHANGED_EVENT, load)
    }
  }, [store])

  const save = useCallback(
    async (item: StoreMap[S]) => {
      await db.put(store, item)
      setItems((prev) => [...prev.filter((i) => i.id !== item.id), item])
      window.dispatchEvent(new Event(LOGS_CHANGED_EVENT))
    },
    [store],
  )

  const remove = useCallback(
    async (id: string) => {
      await db.remove(store, id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      window.dispatchEvent(new Event(LOGS_CHANGED_EVENT))
    },
    [store],
  )

  return { items, loading, save, remove }
}
