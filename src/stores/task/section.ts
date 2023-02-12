import { SectionType, TaskSession } from '@/api/restful/task/cards'
import { AppAction } from '@/store'
import { createSlice } from '@reduxjs/toolkit'

export interface SectionState {
  currentSection: SectionType | 'search'
  taskSessions: {
    [key in SectionType | 'search']: TaskSession[]
  }
}

const initialState: SectionState = {
  currentSection: 'feature',
  taskSessions: {
    feature: [],
    recent: [],
    author: [],
    search: [],
  },
}

const sectionSlice = createSlice({
  name: 'section',
  initialState,
  reducers: {
    initTaskSessions(
      state,
      action: AppAction<{
        feature: TaskSession[]
        recent: TaskSession[]
        author: TaskSession[]
      }>
    ) {
      const { feature, recent, author } = action.payload
      state.taskSessions.feature = feature
      state.taskSessions.recent = recent
      state.taskSessions.author = author
    },
    setCurrentSection(state, action: AppAction<SectionType | 'search'>) {
      state.currentSection = action.payload
    },
    setSearchSessions(state, action: AppAction<TaskSession[]>) {
      state.taskSessions.search = action.payload
    },
    setFeatureSessions(state, action: AppAction<TaskSession[]>) {
      state.taskSessions.feature = action.payload
    },
    extendFeatureSessions(state, action: AppAction<TaskSession[]>) {
      state.taskSessions.feature = state.taskSessions.feature.concat(
        action.payload
      )
    },
    setRecentSessions(state, action: AppAction<TaskSession[]>) {
      state.taskSessions.recent = action.payload
    },
    extendRecentSessions(state, action: AppAction<TaskSession[]>) {
      state.taskSessions.recent = state.taskSessions.recent.concat(
        action.payload
      )
    },
    setAuthorSessions(state, action: AppAction<TaskSession[]>) {
      state.taskSessions.author = action.payload
    },
    extendAuthorSessions(state, action: AppAction<TaskSession[]>) {
      state.taskSessions.author = state.taskSessions.author.concat(
        action.payload
      )
    },
    giveALike(
      state,
      action: AppAction<{
        collection: SectionType | 'search'
        index: number
        target: boolean
      }>
    ) {
      const { collection, index, target } = action.payload
      state.taskSessions[collection][index].is_liked = target
    },
  },
})

export const {
  initTaskSessions,
  setCurrentSection,
  setSearchSessions,
  extendFeatureSessions,
  extendRecentSessions,
  extendAuthorSessions,
  giveALike,
} = sectionSlice.actions
export default sectionSlice.reducer
