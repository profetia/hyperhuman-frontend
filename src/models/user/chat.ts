import { Sentence } from '@/models/task/detail'

export interface ChatDetail {
  task_uuid: string
  prompt: string
  resource_url: string
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
