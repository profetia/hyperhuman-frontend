import { mockTaskSession, TaskSession } from '@/models/task/cards'
import { mockTaskDetail, TaskDetail } from '@/models/task/detail'

export async function doGetTaskCards(pageNum: number): Promise<TaskSession[]> {
  return new Array(10).fill(mockTaskSession)
}

export async function doGetTaskDetail(taskId: string): Promise<TaskDetail> {
  return mockTaskDetail
}
