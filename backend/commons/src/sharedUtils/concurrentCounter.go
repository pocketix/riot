package sharedUtils

import "sync"

type ConcurrentCounter struct {
	mu    sync.Mutex
	count uint32
}

func (c *ConcurrentCounter) Increment() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.count++
}

func (c *ConcurrentCounter) Decrement() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.count--
}

func (c *ConcurrentCounter) GetCount() uint32 {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.count
}
