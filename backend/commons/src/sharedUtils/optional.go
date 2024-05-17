package sharedUtils

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

func (o Optional[T]) IsEmpty() bool {
	return !o.isPresent
}

func (o Optional[T]) GetPayload() T {
	if o.IsEmpty() {
		panic("trying to access the payload of 'empty' Optional[T]")
	}
	return o.payload
}

func (o Optional[T]) DoIfPresent(payloadConsumerFunction func(T)) {
	if o.IsPresent() {
		payloadConsumerFunction(o.GetPayload())
	}
}

func (o Optional[T]) GetPayloadOrDefault(def T) T {
	if o.IsPresent() {
		return o.GetPayload()
	}
	return def
}
