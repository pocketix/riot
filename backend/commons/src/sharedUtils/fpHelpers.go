package sharedUtils

// Map is a custom functional programming helper function useful to change the type of slice items.
func Map[T any, U any](sourceSlice []T, mappingFunction func(T) U) []U {
	targetSlice := make([]U, len(sourceSlice))
	for index, sourceSliceItem := range sourceSlice {
		targetSlice[index] = mappingFunction(sourceSliceItem)
	}
	return targetSlice
}

// EMap is a custom functional programming helper function useful to change the type of slice items. The EMap function takes a mapping function that may return an error and if it does, the EMap function stops and propagates said error.
func EMap[T any, U any](sourceSlice []T, mappingFunction func(T) (U, error)) ([]U, error) {
	targetSlice := make([]U, len(sourceSlice))
	for index, sourceSliceItem := range sourceSlice {
		result, err := mappingFunction(sourceSliceItem)
		if err != nil {
			return nil, err
		}
		targetSlice[index] = result
	}
	return targetSlice, nil
}

// FindFirst is a custom functional programming helper function useful to find the first item in a slice that satisfies the supplied predicate. If there is no such item, the function empty optional.
func FindFirst[T any](sourceSlice []T, predicate func(T) bool) Optional[T] {
	for _, sourceSliceItem := range sourceSlice {
		if predicate(sourceSliceItem) {
			return NewOptionalOf[T](sourceSliceItem)
		}
	}
	return NewEmptyOptional[T]()
}

// Any is a custom functional programming helper function useful to check if there is any item in the slice that satisfies the supplied predicate.
func Any[T any](sourceSlice []T, predicate func(T) bool) bool {
	for _, sourceSliceItem := range sourceSlice {
		if predicate(sourceSliceItem) {
			return true
		}
	}
	return false
}

// All is a custom functional programming helper function useful to check if all items of the slice satisfy the supplied predicate.
func All[T any](sourceSlice []T, predicate func(T) bool) bool {
	for _, sourceSliceItem := range sourceSlice {
		if !predicate(sourceSliceItem) {
			return false
		}
	}
	return true
}

// Filter is a custom functional programming helper function useful to get rid of items that do not satisfy the supplied predicate and keep the ones that do.
func Filter[T any](sourceSlice []T, predicate func(T) bool) []T {
	targetSlice := make([]T, 0, len(sourceSlice))
	for _, sourceSliceItem := range sourceSlice {
		if predicate(sourceSliceItem) {
			targetSlice = append(targetSlice, sourceSliceItem)
		}
	}
	return targetSlice
}

func ForEach[T any](sourceSlice []T, consumerFunction func(T)) {
	for _, sourceSliceItem := range sourceSlice {
		consumerFunction(sourceSliceItem)
	}
}
