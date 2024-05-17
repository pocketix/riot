package sharedUtils

import "sync"

func WaitForAll(functions ...func()) {
	wg := new(sync.WaitGroup)
	wg.Add(len(functions))
	for _, function := range functions {
		go func(function func()) {
			defer wg.Done()
			function()
		}(function)
	}
	wg.Wait()
}
