import { GET } from '@/api/utils'
import { mockSubscription, Subscription } from '@/models/user/chat'

export async function doStartAChat(): Promise<Subscription> {
  try {
    const response = await GET('/chat')

    return response.data
  } catch (e) {
    return mockSubscription
  }
}
