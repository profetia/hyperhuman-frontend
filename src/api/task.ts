import { mockTaskSession, SectionType, TaskSession } from '@/models/task/cards'
import { mockTaskDetail, TaskDetail } from '@/models/task/detail'
import { POST } from './utils'

export async function doGetTaskCards(
  pageNum: number,
  type: SectionType
): Promise<TaskSession[]> {
  const response = await POST('/task/cards', {
    page_num: pageNum,
    type: type,
  })
  return response.data
}

export async function doGetTaskDetail(taskId: string): Promise<TaskDetail> {
  const response = await POST(`/task/card/${taskId}`, {})
  return response.data
}
