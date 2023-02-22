import { mockTaskSession, SectionType, TaskSession } from '@/models/task/cards'
import { mockTaskDetail, TaskDetail } from '@/models/task/detail'
import { POST } from './utils'

export async function doGetTaskCards(
  pageNum: number,
  type: SectionType
): Promise<TaskSession[]> {
  try {
    const response = await POST('/task/cards', {
      page_num: pageNum,
      type: type,
    })
    return response.data
  } catch (e) {
    return [mockTaskSession]
  }
}

export async function doGetTaskDetail(taskId: string): Promise<TaskDetail> {
  try {
    const response = await POST(`/task/card/${taskId}`, {})
    return response.data
  } catch(e) {
    return mockTaskDetail
  }
}

export async function doGetSearchResult(
  keyword: string
): Promise<TaskSession[]> {
  const response = await POST('/task/search', {
    keyword: keyword,
  })
  return response.data
}
