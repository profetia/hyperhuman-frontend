import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit'
import section from '@/stores/task/section'
import user from '@/stores/user/profile'

export const store = configureStore({
  reducer: {
    // Add the generated reducer as a specific top-level slice
    section: section,
    user: user,
  },
})

export type AppDispatch = typeof store.dispatch
export type AppState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  AppState,
  unknown,
  Action<string>
>

export type AppAction<T> = {
  type: string
  payload: T
}
