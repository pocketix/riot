package sharedUtils

import (
	"log"
	"sync"
)

type WorkerPoolTaskRunnerFunction[T any] func(task T) error

type WorkerPool[T any] struct {
	taskQueue       chan T
	numberOfWorkers int
	wg              sync.WaitGroup
}

func NewWorkerPool[T any](numberOfWorkers int) *WorkerPool[T] {
	return &WorkerPool[T]{
		taskQueue:       make(chan T),
		numberOfWorkers: numberOfWorkers,
	}
}

func (w *WorkerPool[T]) Start(taskRunner WorkerPoolTaskRunnerFunction[T]) {
	for i := 0; i < w.numberOfWorkers; i++ {
		w.wg.Add(1)
		go w.worker(taskRunner)
	}
}

func (w *WorkerPool[T]) worker(taskRunner WorkerPoolTaskRunnerFunction[T]) {
	defer w.wg.Done()
	for task := range w.taskQueue {
		if err := taskRunner(task); err != nil {
			log.Printf("Worker pool error ocurred, terminating worker: %s", err.Error())
			return
		}
	}
}

func (w *WorkerPool[T]) SubmitTask(task T) {
	w.taskQueue <- task
}

func (w *WorkerPool[T]) Stop() {
	close(w.taskQueue)
	w.wg.Wait()
}
