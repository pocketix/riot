package sharedUtils

import (
	"fmt"
	"net"
	"strings"
	"sync"
	"time"
)

func WaitForDSs(timeout time.Duration, dsIdentifierPortPairs ...Pair[string, string]) error {
	inaccessibleDSIdentifiers := make([]string, 0)
	var inaccessibleDSIdentifiersMutex sync.Mutex
	wg := new(sync.WaitGroup)
	wg.Add(len(dsIdentifierPortPairs))
	for _, dsIdentifierPortPair := range dsIdentifierPortPairs {
		go func(dsIdentifierPortPair Pair[string, string]) {
			defer wg.Done()
			dsIdentifier := dsIdentifierPortPair.GetFirst()
			if !isDSReady(dsIdentifier, dsIdentifierPortPair.GetSecond(), timeout) {
				inaccessibleDSIdentifiersMutex.Lock()
				inaccessibleDSIdentifiers = append(inaccessibleDSIdentifiers, dsIdentifier)
				inaccessibleDSIdentifiersMutex.Unlock()
			}
		}(dsIdentifierPortPair)
	}
	wg.Wait()
	return Ternary(len(inaccessibleDSIdentifiers) == 0, nil, fmt.Errorf("the following DSs are inaccessible: %s", strings.Join(inaccessibleDSIdentifiers, ", ")))
}

func isDSReady(dsIdentifier string, port string, timeout time.Duration) bool {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		conn, err := net.Dial("tcp", fmt.Sprintf("%s:%s", dsIdentifier, port))
		if err == nil {
			_ = conn.Close()
			return true
		}
		time.Sleep(time.Second)
	}
	return false
}
