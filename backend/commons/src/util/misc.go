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

func Float64FromString(s string) Result[float64] {
	f, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return NewFailureResult[float64](err)
	}
	return NewSuccessResult[float64](f)
}

func Float64ToString(f float64) string {
	return strconv.FormatFloat(f, 'f', -1, 64)
}

func TypeIs[T any](subject any) bool {
	_, ok := subject.(T)
	return ok
}

func Ternary[T any](cond bool, r1 T, r2 T) T {
	if cond {
		return r1
	} else {
		return r2
	}
}
