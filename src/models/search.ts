import { Dispatch, SetStateAction } from 'react'

export type SearchType = 'search' | 'generate' | undefined

export interface SearchState {
  searchInput: string
  searchType: SearchType
}

export interface SearchAction {
  setSearchInput: Dispatch<SetStateAction<string>>
  setSearchType: Dispatch<SetStateAction<SearchType>>
}
