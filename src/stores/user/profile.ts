import { SectionType, TaskSession } from '@/api/restful/task/cards'
import { mockUserProfile, UserProfile } from '@/api/restful/user/profile'
import { AppAction } from '@/store'
import { createSlice } from '@reduxjs/toolkit'

export interface UserState {
  isLogin: boolean
  profile: UserProfile
}

const initialState: UserState = {
  isLogin: true,
  profile: mockUserProfile,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    doLogout(state) {
      state.isLogin = false
    },
  },
})

export const { doLogout } = userSlice.actions
export default userSlice.reducer
