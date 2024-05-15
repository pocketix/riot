package util

import "sync/atomic"

func SequentialNumberGenerator() func() uint32 {
	counter := uint32(0)
	return func() uint32 {
		return atomic.AddUint32(&counter, 1)
	}
}
