package sharedUtils

func TypeIs[T any](subject any) bool {
	_, ok := subject.(T)
	return ok
}
