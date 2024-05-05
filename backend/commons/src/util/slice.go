package util

func SliceOf[T any](items ...T) []T {
	slice := make([]T, 0, len(items))
	for _, item := range items {
		slice = append(slice, item)
	}
	return slice
}
