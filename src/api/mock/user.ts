import { UserProfile } from '../restful/user/profile'
import { mockTaskSession } from './task'

export const mockUserProfile: UserProfile = {
  id: '123',
  name: 'John Doe',
  avatar_url:
    'https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50',
  liked_cards: [mockTaskSession],
}
