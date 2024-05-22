package sharedUtils

func SliceOf[T any](items ...T) []T {
	return items
}

func EmptySlice[T any]() []T {
	return make([]T, 0)
}
