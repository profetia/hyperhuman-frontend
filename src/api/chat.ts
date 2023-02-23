import { GET, POST } from '@/api/utils'
import {
  GenerateProgress,
  mockSubscription,
  Subscription,
} from '@/models/user/chat'

export async function doStartAChat(): Promise<Subscription> {
  try {
    const response = await GET('/chat')

    return response.data
  } catch (e) {
    return mockSubscription
  }
}

export async function doGenerateModel(taskId: string, prompt: string) {
  try {
    const response = await POST('/task/generate', {
      task_uuid: taskId,
      prompt,
    })
  } catch (e) {}
}

export async function doGetGenerateProgress(
  taskId: string
): Promise<GenerateProgress> {
  const response = await POST(`/task/check_progress/${taskId}`)
  return response.data
}
