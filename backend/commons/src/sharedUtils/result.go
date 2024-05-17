package sharedUtils

type Result[T any] struct {
	payload   T
	err       error
	isSuccess bool
}

func NewSuccessResult[T any](payload T) Result[T] {
	return Result[T]{
		payload:   payload,
		isSuccess: true,
	}
}

func NewFailureResult[T any](err error) Result[T] {
	return Result[T]{
		err:       err,
		isSuccess: false,
	}
}

func (r Result[T]) IsSuccess() bool {
	return r.isSuccess
}

func (r Result[T]) IsFailure() bool {
	return !r.isSuccess
}

func (r Result[T]) GetPayload() T {
	if r.IsFailure() {
		panic("trying to access the payload of a 'failure' Result[T]")
	}
	return r.payload
}

func (r Result[T]) GetError() error {
	if r.IsSuccess() {
		panic("trying to access the error of a 'success' Result[T]")
	}
	return r.err
}

// Unwrap turns the Result wrapper into the payload and error pair. This is useful for transforming the Result type into the standard return format required by many functions.
func (r Result[T]) Unwrap() (T, error) {
	return r.payload, r.err
}
