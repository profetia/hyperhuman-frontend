import { mockTaskSession } from '@/models/task/cards'
import { mockTaskDetail } from '@/models/task/detail'

export function getTaskCards(pageNum: number) {
  return new Array(10).fill(mockTaskSession)
}

export function getTaskDetail(taskId: string) {
  return mockTaskDetail
}
