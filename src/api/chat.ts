import { GET, POST } from '@/api/utils'
import { mockSubscription, Subscription } from '@/models/user/chat'

export async function doStartAChat(): Promise<Subscription> {
  try {
    const response = await GET('/chat')

    return response.data
  } catch (e) {
    return mockSubscription
  }
}

export async function doGenerateModel(
  taskId: string,
  prompt: string
): Promise<string> {
  try {
    const response = await POST('/task/generate', {
      task_uuid: taskId,
      prompt,
    })

    return response.data
  } catch (e) {
    return ''
  }
}
