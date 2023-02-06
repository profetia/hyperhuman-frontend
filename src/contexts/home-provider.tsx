import { createContext, ReactNode, useState, useContext } from 'react'
import {
  exampleLatestSession,
  exampleFeaturedSessions,
  Session,
} from '@/models/session'
import { Sentence } from '@/models/dialog'

export interface HomeSessions {
  latestSessions: Session[]
  updateLatestSession: (index: number, session: Session) => void
  featuredSessions: Session[]
  updateFeaturedSession: (index: number, session: Session) => void
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
  updateLatestSession: (index: number, session: Session) => {},
  featuredSessions: [],
  updateFeaturedSession: (index: number, session: Session) => {},
  currentConversation: [],
  addSentence: (sentence: Sentence) => {},
  searchInput: '',
  setSearchInput: (input: string) => {},
  searchType: null,
  setSearchType: (type: 'search' | 'generate' | null) => {},
})

export default function HomeProvider({ children }: { children: ReactNode }) {
  const [latestSessions, setLatestSessions] = useState<Session[]>(
    Array(10).fill(exampleLatestSession)
  )
  const updateLatestSession = (index: number, session: Session) => {
    const newSessions = [...latestSessions]
    newSessions[index] = session
    setLatestSessions(newSessions)
  }
  const [featuredSessions, setFeaturedSessions] = useState<Session[]>(
    Array(10).fill(exampleFeaturedSessions)
  )
  const updateFeaturedSession = (index: number, session: Session) => {
    const newSessions = [...featuredSessions]
    newSessions[index] = session
    setFeaturedSessions(newSessions)
  }

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
        updateLatestSession,
        featuredSessions,
        updateFeaturedSession,
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
