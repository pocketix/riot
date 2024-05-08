package util

import (
	"github.com/davecgh/go-spew/spew"
)

func Dump(a ...any) {
	spew.Dump(a)
}
