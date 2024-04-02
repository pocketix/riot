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

func NewOptionalFromPointer[T any](pointer *T) Optional[T] {
	if pointer == nil {
		return NewEmptyOptional[T]()
	} else {
		return NewOptionalOf[T](*pointer)
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
	if !o.isPresent {
		panic("trying to access Optional[T] payload that is not present")
	}
	return o.payload
}
