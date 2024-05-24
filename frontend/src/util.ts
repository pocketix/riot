import { useNavigate } from 'react-router-dom'
import { v4 } from 'uuid'

/**
 * Truncates the input string to the given maximum length and appends an ellipsis ('...') if truncation occurs.
 * @param input - The input string to truncate.
 * @param maxLength - The maximum allowable length of the string.
 * @returns The truncated string, with an ellipsis appended if truncation occurs.
 */
export const truncateWithEllipsis = (input: string, maxLength: number): string => (input.length > maxLength ? input.substring(0, maxLength) + '...' : input)

export type EffectFunction = () => void
export type ConsumerFunction<T> = (arg: T) => void
export type BiConsumerFunction<T, U> = (arg1: T, arg2: U) => void
export type TriConsumerFunction<T, U, R> = (arg1: T, arg2: U, arg3: R) => void
export type TetraConsumerFunction<T, U, R, S> = (arg1: T, arg2: U, arg3: R, arg4: S) => void
export type ProducerFunction<T> = () => T
export type UnaryFunction<T, R> = (arg: T) => R
export type BinaryFunction<T, U, R> = (arg1: T, arg2: U) => R

export type AsynchronousEffectFunction = () => Promise<void>
export type AsynchronousConsumerFunction<T> = (arg: T) => Promise<void>
export type AsynchronousBiConsumerFunction<T, U> = (arg1: T, arg2: U) => Promise<void>
export type AsynchronousTriConsumerFunction<T, U, R> = (arg1: T, arg2: U, arg3: R) => Promise<void>
export type AsynchronousProducerFunction<T> = () => Promise<T>
export type AsynchronousUnaryFunction<T, R> = (arg: T) => Promise<R>
export type AsynchronousBinaryFunction<T, U, R> = (arg1: T, arg2: U) => Promise<R>

export const useChangeURL = () => {
  const navigate = useNavigate()
  function changeURL(newURL: string) {
    navigate(newURL)
  }
  return changeURL
}

export const generateNewUUID = (): string => v4()

export interface SelectionSubject {
  id: string
  name: string
}

export class SequentialNumberGenerator {
  private counter: number

  constructor(startValue: number = 0) {
    this.counter = startValue
  }

  getNextNumber(): number {
    return this.counter++
  }
}
