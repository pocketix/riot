package util

func Ternary[T any](cond bool, r1 T, r2 T) T {
	if cond {
		return r1
	} else {
		return r2
	}
}
