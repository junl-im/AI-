import type { AppPage } from '../../store/useAppStore'
import { useAppStore } from '../../store/useAppStore'

const items: Array<{ page: AppPage; label: string; icon: string }> = [
  { page: 'home', label: '만들기', icon: '＋' },
  { page: 'projects', label: '프로젝트', icon: '▣' },
  { page: 'settings', label: '설정', icon: '⚙' },
]

export function BottomNavigation() {
  const currentPage = useAppStore((state) => state.page)
  const setPage = useAppStore((state) => state.setPage)

  return (
    <nav className="safe-bottom sticky bottom-0 z-20 mt-4 border-t border-soa-line/80 bg-soa-paper/95 pt-2 backdrop-blur-xl" aria-label="주요 메뉴">
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const active = currentPage === item.page
          return (
            <button
              key={item.page}
              type="button"
              onClick={() => setPage(item.page)}
              aria-current={active ? 'page' : undefined}
              className={`focus-ring flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-semibold transition ${
                active ? 'bg-soa-ink text-white' : 'text-soa-muted hover:bg-soa-card'
              }`}
            >
              <span aria-hidden="true" className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
