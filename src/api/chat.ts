import { GET } from '@/api/utils'

export async function doStartAChat(): Promise<{
  subscription: string
  task_uuid: string
}> {
  const response = await GET('/chat')

  return response.data
}
