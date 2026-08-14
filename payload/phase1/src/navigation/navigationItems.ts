import type { AppPage } from '../store/useAppStore'

export interface NavigationItem {
  page: AppPage
  label: string
  icon: string
}

export const primaryNavigationItems: NavigationItem[] = [
  { page: 'home', label: '만들기', icon: '＋' },
  { page: 'clone', label: '내 목소리', icon: '◉' },
  { page: 'quality', label: '품질', icon: '◎' },
  { page: 'projects', label: '프로젝트', icon: '▣' },
]

export const workspacePageLabels: Record<AppPage, string> = {
  home: '텍스트를 음성으로',
  clone: '내 목소리',
  quality: '품질 연구소',
  projects: '프로젝트',
  settings: '설정',
}
