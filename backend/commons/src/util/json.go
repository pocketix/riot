package util

import "encoding/json"

func DeserializeFromJSON[T any](data []byte) Result[T] {
	var object T
	err := json.Unmarshal(data, &object)
	if err != nil {
		return NewFailureResult[T](err)
	}
	return NewSuccessResult[T](object)
}

func SerializeToJSON(object any) Result[[]byte] {
	data, err := json.Marshal(object)
	if err != nil {
		return NewFailureResult[[]byte](err)
	}
	return NewSuccessResult[[]byte](data)
}
