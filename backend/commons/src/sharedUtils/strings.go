package sharedUtils

import "github.com/dchest/uniuri"

func GenerateRandomAlphanumericString(length int) string {
	return uniuri.NewLen(length)
}
