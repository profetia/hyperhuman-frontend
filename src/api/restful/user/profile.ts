import { TaskSession } from '@/api/restful/task/cards'

export interface UserProfile {
  id: string
  name: string
  avatar_url: string
}

export const mockUserProfile: UserProfile = {
  id: '123',
  name: 'John Doe',
  avatar_url:
    'https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50',
}
