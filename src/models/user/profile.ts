import { TaskSession } from '@/models/task/cards'

export interface UserProfile {
  id: string
  name: string
  avatar: string
}

export const mockUserProfile: UserProfile = {
  id: '123',
  name: 'John Doe',
  avatar: 'https://avatars.dicebear.com/api/male/username.svg',
}
