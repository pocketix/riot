package util

func SliceToSet[T comparable](slice []T) *Set[T] {
	set := NewSet[T]()
	for _, sliceItem := range slice {
		set.Add(sliceItem)
	}
	return set
}
