import { Sentence } from '@/models/task/detail'
import { ChatDetail } from '@/models/user/chat'
import { AppAction } from '@/store'
import { createSlice } from '@reduxjs/toolkit'

export interface ChatState extends ChatDetail {
  subscription: string
}

const initialState: ChatState = {
  task_uuid: '',
  prompt: '',
  resource_url: '',
  chat_history: [],
  subscription: '',
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    initChat: (
      state,
      action: AppAction<{
        task_uuid: string
        subscription: string
      }>
    ) => {
      state.task_uuid = action.payload.task_uuid
      state.subscription = action.payload.subscription
    },
    setPrompt: (state, action: AppAction<string>) => {
      state.prompt = action.payload
    },
    setResourceUrl: (state, action: AppAction<string>) => {
      state.resource_url = action.payload
    },
    setChatHistory: (state, action: AppAction<Sentence[]>) => {
      state.chat_history = action.payload
    },
    extendChatHistory: (state, action: AppAction<Sentence>) => {
      state.chat_history = state.chat_history.concat(action.payload)
    },
  },
})

export const {
  initChat,
  setPrompt,
  setResourceUrl,
  setChatHistory,
  extendChatHistory,
} = chatSlice.actions
export default chatSlice.reducer
