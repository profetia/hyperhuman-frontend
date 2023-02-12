import { UserProfile } from '@/api/restful/user/profile'

export type SectionType = 'feature' | 'recent' | 'author'

export interface TaskCardRequest {
  section: SectionType
  page_num: number
}

export interface TaskSession {
  task_uuid: string
  video_url: string
  image_url: string
  prompt: string
  num_like: number
  time: number
  is_liked: boolean
}

export type TaskCardResponse = TaskSession[]
