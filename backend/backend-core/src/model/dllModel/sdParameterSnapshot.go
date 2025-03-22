package dllModel

import (
	"time"
)

type SDParameterSnapshot struct {
	SDInstance  string
	SDParameter string
	String      *string
	Number      *float64
	Boolean     *bool
	UpdatedAt   time.Time
}
