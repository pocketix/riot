package sharedUtils

import (
	"log"
	"runtime"
	"time"
)

func StartLoggingProfilingInformationPeriodically(period time.Duration) {
	go func() {
		ticker := time.NewTicker(period)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				memStats := new(runtime.MemStats)
				runtime.ReadMemStats(memStats)
				log.Println("----- Profiling information -----")
				log.Printf("Currently allocated memory: %d bytes\n", memStats.Alloc)
				log.Printf("Total allocated memory: %d bytes\n", memStats.TotalAlloc)
				log.Printf("Total system memory obtained: %d bytes\n", memStats.Sys)
				log.Printf("Number of goroutines running: %d\n", runtime.NumGoroutine())
				// Uncomment to print the stack traces of the running goroutines
				// buffer := make([]byte, 262144)
				// stackLength := runtime.Stack(buffer, true)
				// log.Printf("Stack traces of the running goroutines:\n%s\n", buffer[:stackLength])
				log.Println("-----")
			}
		}
	}()
}
