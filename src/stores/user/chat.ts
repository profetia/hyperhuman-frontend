import { Sentence } from '@/models/task/detail'
import { ChatDetail } from '@/models/user/chat'
import { AppAction } from '@/store'
import { createSlice } from '@reduxjs/toolkit'

export interface ChatState extends ChatDetail {
  subscription: string
  recommend: string
}

const initialState: ChatState = {
  task_uuid: '',
  prompt: '',
  resource_uuid: {
    image_uuid: '',
    video_uuid: '',
    model_uuid: '',
    texture_diff_high_uuid: '',
    texture_spec_high_uuid: '',
    texture_norm_high_uuid: '',
    texture_diff_low_uuid: '',
    texture_spec_low_uuid: '',
    texture_norm_low_uuid: '',
    export_info_uuid: '',
  },
  chat_history: [],
  subscription: '',
  recommend: '',
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
    setRecommend: (state, action: AppAction<string>) => {
      state.recommend = action.payload
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
  setRecommend,
  setChatHistory,
  extendChatHistory,
} = chatSlice.actions
export default chatSlice.reducer
