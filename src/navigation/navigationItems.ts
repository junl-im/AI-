import type { AppPage } from '../store/useAppStore'

export interface NavigationItem {
  page: AppPage
  label: string
  icon: string
}

export const primaryNavigationItems: NavigationItem[] = [
  { page: 'home', label: '만들기', icon: '＋' },
  { page: 'clone', label: '복제', icon: '◉' },
  { page: 'quality', label: '품질', icon: '◎' },
  { page: 'projects', label: '프로젝트', icon: '▣' },
]

export const workspacePageLabels: Record<AppPage, string> = {
  home: 'AI 음성 스튜디오',
  clone: '목소리 복제',
  quality: '품질 연구소',
  projects: '프로젝트',
  settings: '설정',
}
