import { Dispatch, SetStateAction } from 'react'

export interface Sentence {
  content: string
  speaker: 'user' | 'bot'
}

export interface DialogState {
  prompt: string
  conversation: Sentence[]
  modelSource: string
}

export interface DialogAction {
  setConversation: Dispatch<SetStateAction<Sentence[]>>
  setPrompt: Dispatch<SetStateAction<string>>
  setModelSource: Dispatch<SetStateAction<string>>
}
