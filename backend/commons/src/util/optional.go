package util

type Optional[T any] struct {
	payload   T
	isPresent bool
}

func NewOptionalOf[T any](payload T) Optional[T] {
	return Optional[T]{
		payload:   payload,
		isPresent: true,
	}
}

func NewEmptyOptional[T any]() Optional[T] {
	return Optional[T]{
		isPresent: false,
	}
}

func (o Optional[T]) IsPresent() bool {
	return o.isPresent
}

func (o Optional[T]) GetPayload() T {
	return o.payload
}
