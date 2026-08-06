import { lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AppShell } from '../components/layout/AppShell'
import { HomePage } from '../pages/HomePage'
import { useAppStore } from '../store/useAppStore'
import { usePlayerSessionPersistence } from '../hooks/usePlayerSessionPersistence'

const VoiceClonePage = lazy(() => import('../pages/VoiceClonePage').then((module) => ({
  default: module.VoiceClonePage,
})))
const ProjectsPage = lazy(() => import('../pages/ProjectsPage').then((module) => ({
  default: module.ProjectsPage,
})))
const QualityPage = lazy(() => import('../pages/QualityPage').then((module) => ({
  default: module.QualityPage,
})))
const SettingsPage = lazy(() => import('../pages/SettingsPage').then((module) => ({
  default: module.SettingsPage,
})))

const secondaryPages = {
  clone: VoiceClonePage,
  quality: QualityPage,
  projects: ProjectsPage,
  settings: SettingsPage,
}

function PageLoading() {
  return (
    <div className="mx-auto flex min-h-[45vh] max-w-[1180px] items-center justify-center p-6" role="status">
      <div className="rounded-2xl border border-soa-line bg-soa-card px-5 py-4 text-sm font-bold text-soa-muted shadow-sm">
        화면을 준비하고 있습니다…
      </div>
    </div>
  )
}

export function App() {
  usePlayerSessionPersistence()
  const page = useAppStore((state) => state.page)
  const SecondaryPage = page === 'home' ? null : secondaryPages[page]

  return (
    <AppShell>
      <main className="min-h-0 flex-1">
        <section hidden={page !== 'home'} aria-hidden={page !== 'home'}>
          <HomePage />
        </section>
        <AnimatePresence mode="wait" initial={false}>
          {SecondaryPage ? (
            <motion.section
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <Suspense fallback={<PageLoading />}>
                <SecondaryPage />
              </Suspense>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </main>
    </AppShell>
  )
}
