import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { AppShell } from '../components/layout/AppShell'
import { LandingHome } from '../pages/LandingHome'
import { loadWorkspaceSession } from '../workspace/workspaceSessionRepository'
import { WorkspaceLoadBoundary } from '../components/ui/WorkspaceLoadBoundary'
import { useAppStore } from '../store/useAppStore'
import { usePlayerSessionPersistence } from '../hooks/usePlayerSessionPersistence'

const HomePage = lazy(() => import('../pages/HomePage').then((module) => ({ default: module.HomePage })))

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
  const workspaceEntered = useAppStore((state) => state.workspaceEntered)
  const [studioRequested, setStudioRequested] = useState(workspaceEntered)
  useEffect(() => {
    let active = true
    // The existing workspace hook owns restoration; only decide whether to load it here.
    void loadWorkspaceSession().then(({ session }) => {
      if (active && session) setStudioRequested(true)
    }).catch(() => { /* Landing remains usable when local storage is unavailable. */ })
    return () => { active = false }
  }, [])
  useEffect(() => {
    if (workspaceEntered) setStudioRequested(true)
  }, [workspaceEntered])
  const SecondaryPage = page === 'home' ? null : secondaryPages[page]

  return (
    <MotionConfig reducedMotion="user">
      <AppShell>
        <main className="min-h-0 flex-1">
          <section hidden={page !== 'home'} aria-hidden={page !== 'home'}>
            {studioRequested || workspaceEntered ? (
              <WorkspaceLoadBoundary>
                <Suspense fallback={<PageLoading />}>
                  <HomePage />
                </Suspense>
              </WorkspaceLoadBoundary>
            ) : <LandingHome />}
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
    </MotionConfig>
  )
}
