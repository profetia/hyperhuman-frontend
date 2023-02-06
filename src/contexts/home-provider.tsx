import { createContext, ReactNode, useState, useContext } from 'react'
import {
  exampleLatestSession,
  exampleFeaturedSessions,
  Session,
} from '@/models/session'
import { Sentence } from '@/models/dialog'

export interface HomeSessions {
  latestSessions: Session[]
  featuredSessions: Session[]
}

export interface HomeConversation {
  currentConversation: Sentence[]
  addSentence: (sentence: Sentence) => void
}

export interface HomeSearch {
  searchInput: string
  setSearchInput: (input: string) => void
  searchType: 'search' | 'generate' | null
  setSearchType: (type: 'search' | 'generate' | null) => void
}

export const HomeContext = createContext<
  HomeSessions & HomeConversation & HomeSearch
>({
  latestSessions: [],
  featuredSessions: [],
  currentConversation: [],
  addSentence: (sentence: Sentence) => {},
  searchInput: '',
  setSearchInput: (input: string) => {},
  searchType: null,
  setSearchType: (type: 'search' | 'generate' | null) => {},
})

export default function HomeProvider({ children }: { children: ReactNode }) {
  const latestSessions: Session[] = Array(10).fill(exampleLatestSession)
  const popularSessions: Session[] = Array(10).fill(exampleFeaturedSessions)

  const [currentConversation, setCurrentConversation] = useState<Sentence[]>([])
  const addSentence = (sentence: Sentence) => {}

  const [searchInput, setSearchInput] = useState('')
  const [searchType, setSearchType] = useState<'search' | 'generate' | null>(
    null
  )

  return (
    <HomeContext.Provider
      value={{
        latestSessions,
        featuredSessions: popularSessions,
        currentConversation,
        addSentence,
        searchInput,
        setSearchInput,
        searchType,
        setSearchType,
      }}
    >
      {children}
    </HomeContext.Provider>
  )
}

export const useHomeContext = () => {
  return useContext(HomeContext)
}
