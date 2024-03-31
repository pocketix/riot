package util

type Result[T any] struct {
	payload T
	err     error
	isOK    bool
}

func NewSuccessResult[T any](payload T) Result[T] {
	return Result[T]{
		payload: payload,
		isOK:    true,
	}
}

func NewFailureResult[T any](err error) Result[T] {
	return Result[T]{
		err:  err,
		isOK: false,
	}
}

func (r Result[T]) IsSuccess() bool {
	return r.isOK
}

func (r Result[T]) IsFailure() bool {
	return !r.isOK
}

func (r Result[T]) GetPayload() T {
	return r.payload
}

func (r Result[T]) GetError() error {
	return r.err
}
