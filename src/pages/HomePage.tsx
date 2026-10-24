import PageHeader from '../components/PageHeader'
import CheckInCard from '../components/CheckInCard'
import CatCompanion, { type CatStatus } from '../components/CatCompanion'
import { useStore } from '../hooks/useStore'
import { useSettings } from '../hooks/useSettings'
import { allTaken, toDateKey } from '../lib/streak'

export default function HomePage() {
  const { items, loading } = useStore('pillLogs')
  const { settings } = useSettings()
  const today = toDateKey()
  const done = allTaken(items, settings.pills.map((p) => p.id), today)
  const hadSymptoms = items.some((l) => l.date === today && l.pillTaken && l.hasSymptoms)
  const status: CatStatus = done ? (hadSymptoms ? 'symptoms' : 'taken') : 'pending'

  return (
    <>
      <PageHeader title="AllerCat" subtitle="Your immunotherapy buddy 🐾" />
      {!loading && <CatCompanion status={status} />}
      <CheckInCard />
    </>
  )
}
