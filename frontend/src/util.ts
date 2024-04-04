/**
 * Truncates the input string to the given maximum length and appends an ellipsis ('...') if truncation occurs.
 * @param input - The input string to truncate.
 * @param maxLength - The maximum allowable length of the string.
 * @returns The truncated string, with an ellipsis appended if truncation occurs.
 */
export const truncateWithEllipsis = (input: string, maxLength: number): string => (input.length > maxLength ? input.substring(0, maxLength) + '...' : input)
