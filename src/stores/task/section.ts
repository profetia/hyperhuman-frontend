import { SectionType, TaskSession } from '@/api/restful/task/cards'
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
    setCurrentSection(state, action) {
      state.currentSection = action.payload
    },
    setSearchSessions(state, action) {
      state.taskSessions.search = action.payload
    },
    setFeatureSessions(state, action) {
      state.taskSessions.feature = action.payload
    },
    extendFeatureSessions(state, action) {
      state.taskSessions.feature = [
        ...state.taskSessions.feature,
        ...action.payload,
      ]
    },
    setRecentSessions(state, action) {
      state.taskSessions.recent = action.payload
    },
    extendRecentSessions(state, action) {
      state.taskSessions.recent = [
        ...state.taskSessions.recent,
        ...action.payload,
      ]
    },
    setAuthorSessions(state, action) {
      state.taskSessions.author = action.payload
    },
    extendAuthorSessions(state, action) {
      state.taskSessions.author = [
        ...state.taskSessions.author,
        ...action.payload,
      ]
    },
  },
})

export const {
  setCurrentSection,
  setSearchSessions,
  extendFeatureSessions,
  extendRecentSessions,
  extendAuthorSessions,
} = sectionSlice.actions
export default sectionSlice.reducer
