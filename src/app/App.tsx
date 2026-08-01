import { AnimatePresence, motion } from 'motion/react'
import { AppShell } from '../components/layout/AppShell'
import { HomePage } from '../pages/HomePage'
import { VoiceClonePage } from '../pages/VoiceClonePage'
import { ProjectsPage } from '../pages/ProjectsPage'
import { QualityPage } from '../pages/QualityPage'
import { SettingsPage } from '../pages/SettingsPage'
import { useAppStore } from '../store/useAppStore'

const pages = {
  home: HomePage,
  clone: VoiceClonePage,
  quality: QualityPage,
  projects: ProjectsPage,
  settings: SettingsPage,
}

export function App() {
  const page = useAppStore((state) => state.page)
  const Page = pages[page]

  return (
    <AppShell>
      <main className="min-h-0 flex-1">
        <section hidden={page !== 'home'} aria-hidden={page !== 'home'}>
          <HomePage />
        </section>
        <AnimatePresence mode="wait" initial={false}>
          {page !== 'home' ? (
            <motion.section
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <Page />
            </motion.section>
          ) : null}
        </AnimatePresence>
      </main>
    </AppShell>
  )
}
