import { TaskSession } from '@/api/restful/task/cards'

export interface UserProfile {
  id: string
  name: string
  avatar_url: string
}

export const mockUserProfile: UserProfile = {
  id: '123',
  name: 'John Doe',
  avatar_url: 'https://avatars.dicebear.com/api/male/username.svg',
}
