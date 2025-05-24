// Adapted from: https://github.com/jonasschmedtmann/ultimate-react-course/blob/main/17-the-wild-oasis/final-6-final/src/hooks/useLocalStorageState.js
// Author: Jonas Schmedtmann

import { useState, useEffect, Dispatch, SetStateAction } from 'react'

export function useLocalStorageState<T>(key: string, initialState: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const storedValue = localStorage.getItem(key)
    return storedValue ? JSON.parse(storedValue) : initialState
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [value, key])

  return [value, setValue]
}
