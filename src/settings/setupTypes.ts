export type SetupStepStatus = 'ready' | 'warning' | 'missing'

export interface SetupStep {
  id: string
  label: string
  status: SetupStepStatus
  required: boolean
  detail: string
  action: string | null
}

export interface SetupStatus {
  version: string
  ready: boolean
  realEngineCount: number
  steps: SetupStep[]
}
