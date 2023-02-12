import { TaskSession } from '@/api/restful/task/cards'

export interface UserProfile {
  id: string
  name: string
  avatar_url: string
  liked_cards: TaskSession[]
}
