export const WEB_QUALITY_SCHEMA_VERSION = 1

export const WEB_QUALITY_PHASES = [
  {
    id: 'lock-structure',
    label: 'npm lock structure',
    command: ['npm', 'run', 'locks:check', '--', '--component', 'npm'],
  },
  {
    id: 'web-toolchain',
    label: 'installed web toolchain',
    command: ['npm', 'run', 'quality:web-toolchain'],
  },
  {
    id: 'dependency-tree',
    label: 'npm dependency tree',
    command: ['npm', 'run', 'quality:dependency-tree'],
  },
  {
    id: 'lint',
    label: 'ESLint',
    command: ['npm', 'run', 'lint'],
  },
  {
    id: 'typecheck',
    label: 'TypeScript',
    command: ['npm', 'run', 'typecheck'],
  },
  {
    id: 'test',
    label: 'Vitest',
    command: ['npm', 'run', 'test:ci'],
  },
  {
    id: 'build',
    label: 'Vite production build',
    command: ['npm', 'run', 'build'],
  },
]
