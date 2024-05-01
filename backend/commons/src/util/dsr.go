package util

import (
	"fmt"
	"net"
	"strings"
	"sync"
	"time"
)

func WaitForDSs(timeout time.Duration, dsIdentifierPortNumberPairs ...Pair[string, int]) error {
	inaccessibleDSIdentifiers := make([]string, 0)
	var inaccessibleDSIdentifiersMutex sync.Mutex
	var wg sync.WaitGroup
	wg.Add(len(dsIdentifierPortNumberPairs))
	for _, dsIdentifierPortNumberPair := range dsIdentifierPortNumberPairs {
		go func(dsIdentifierPortNumberPair Pair[string, int]) {
			defer wg.Done()
			dsIdentifier := dsIdentifierPortNumberPair.getFirst()
			if !isDSReady(dsIdentifier, dsIdentifierPortNumberPair.getSecond(), timeout) {
				inaccessibleDSIdentifiersMutex.Lock()
				inaccessibleDSIdentifiers = append(inaccessibleDSIdentifiers, dsIdentifier)
				inaccessibleDSIdentifiersMutex.Unlock()
			}
		}(dsIdentifierPortNumberPair)
	}
	wg.Wait()
	return Ternary(len(inaccessibleDSIdentifiers) == 0, nil, fmt.Errorf("the following DSs are inaccessible: %s", strings.Join(inaccessibleDSIdentifiers, ", ")))
}

func isDSReady(dsIdentifier string, portNumber int, timeout time.Duration) bool {
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
