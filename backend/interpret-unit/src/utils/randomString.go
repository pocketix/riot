package utils

import (
	"math/rand"
	"time"
)

func RandomString(l int) string {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	bytes := make([]byte, l)
	for i := range l {
		bytes[i] = byte(randInt(r, 65, 90))
	}
	return string(bytes)
}

func randInt(r *rand.Rand, min int, max int) int {
	return min + r.Intn(max-min)
}
