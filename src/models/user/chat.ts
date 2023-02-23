import { MeshProfile, Sentence } from '@/models/task/detail'

export interface ChatDetail {
  task_uuid: string
  prompt: string
  resource: MeshProfile
  chat_history: Sentence[]
}

export interface Subscription {
  subscription: string
  task_uuid: string
}

export interface GeneratePrompt {
  prompt: string
  task_uuid: string
}

export const mockSubscription: Subscription = {
  task_uuid: '66efeec6-5c25-4dd9-a77e-988166ad1503',
  subscription:
    'eyJhbGciOiJIUzI1NiJ9.NjZlZmVlYzYtNWMyNS00ZGQ5LWE3N2UtOTg4MTY2YWQxNTAz.Jz0cwBKztW5Zb5VBwoqlBdSDHyQTJd9QlXq_33q83Gg',
}

export enum GenerateStep {
  CREATED = 'Created',
  WAITING = 'Waiting',
  CANCELED = 'Canceled',
  MODELSTAGE = 'ModelStage',
  APPEARENCESTAGE = 'AppearanceStage',
  DETAILSTAGE = 'DetailStage',
  UPSCALESTAGE = 'UpscaleStage',
  EXPORTSTAGE = 'ExportStage',
  DONE = 'Done',
  FAILED = 'Failed',
}

export interface GenerateProgress {
  stage: GenerateStep
  estimate_time: number
  waiting_num: number
}
