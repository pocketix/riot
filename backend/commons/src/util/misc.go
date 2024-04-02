package util

import (
	"strconv"
)

func SliceToSet[T comparable](slice []T) *Set[T] {
	set := NewSet[T]()
	for _, sliceItem := range slice {
		set.Add(sliceItem)
	}
	return set
}

func UINT32ToString(u uint32) string {
	return strconv.FormatUint(uint64(u), 10)
}

func UINT32FromString(s string) Result[uint32] {
	u, err := strconv.ParseUint(s, 10, 32)
	if err != nil {
		return NewFailureResult[uint32](err)
	}
	return NewSuccessResult[uint32](uint32(u))
}
