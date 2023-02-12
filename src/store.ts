import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit'
import sectionReducer from '@/stores/task/section'

export const store = configureStore({
  reducer: {
    // Add the generated reducer as a specific top-level slice
    sectionReducer: sectionReducer,
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
