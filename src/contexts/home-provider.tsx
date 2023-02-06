import { createContext, ReactNode, useState, useContext } from 'react'
import {
  exampleLatestSession,
  exampleFeaturedSessions,
  Session,
  SessionState,
  SessionAction,
} from '@/models/session'
import { Sentence, DialogState, DialogAction } from '@/models/dialog'
import { SearchState, SearchAction, SearchType } from '@/models/search'

export const HomeContext = createContext<
  SearchState &
    DialogState &
    SessionState &
    SearchAction &
    DialogAction &
    SessionAction
>({
  featuredSessions: [],
  latestSessions: [],
  searchInput: '',
  searchType: undefined,
  prompt: '',
  modelSource: '',
  conversation: [],
  setLatestSessions: () => {},
  setFeaturedSessions: () => {},
  setSearchInput: () => {},
  setSearchType: () => {},
  setConversation: () => {},
  setPrompt: () => {},
  setModelSource: () => {},
})

export default function HomeProvider({ children }: { children: ReactNode }) {
  const [latestSessions, setLatestSessions] = useState<Session[]>(
    Array(10)
      .fill({})
      .map(() => ({ ...exampleLatestSession }))
  )
  const [featuredSessions, setFeaturedSessions] = useState<Session[]>(
    Array(10)
      .fill({})
      .map(() => ({ ...exampleFeaturedSessions }))
  )

  const [searchInput, setSearchInput] = useState('')
  const [searchType, setSearchType] = useState<SearchType>(undefined)

  const [prompt, setPrompt] = useState<string>('')
  const [modelSource, setModelSource] = useState<string>('')
  const [conversation, setConversation] = useState<Sentence[]>([])

  return (
    <HomeContext.Provider
      value={{
        featuredSessions,
        latestSessions,
        conversation,
        searchInput,
        searchType,
        setLatestSessions,
        setFeaturedSessions,
        setConversation,
        setSearchInput,
        setSearchType,
        prompt,
        modelSource,
        setPrompt,
        setModelSource,
      }}
    >
      {children}
    </HomeContext.Provider>
  )
}

export const useHomeContext = () => {
  return useContext(HomeContext)
}
