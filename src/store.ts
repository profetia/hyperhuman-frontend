import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit'

export const store = configureStore({
  reducer: {
    // Add the generated reducer as a specific top-level slice
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
