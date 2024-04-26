package util

import (
	"fmt"
	"net"
	"time"
)

func IsDSReady(dsIdentifier string, portNumber int, timeout time.Duration) bool {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		conn, err := net.Dial("tcp", fmt.Sprintf("%s:%d", dsIdentifier, portNumber))
		if err == nil {
			_ = conn.Close()
			return true
		}
		time.Sleep(time.Second)
	}
	return false
}
