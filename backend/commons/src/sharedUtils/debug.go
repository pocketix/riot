package sharedUtils

import (
	"log"
	"testing"

	"github.com/sanity-io/litter"
)

func Dump(a ...any) {
	log.Println(litter.Sdump(a...))
}

func TDump(t *testing.T, a ...any) {
	t.Helper()
	t.Log(litter.Sdump(a...))
}
