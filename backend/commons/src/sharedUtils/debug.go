package sharedUtils

import (
	"bytes"
	"github.com/davecgh/go-spew/spew"
	"log"
)

func Dump(a ...any) {
	buffer := new(bytes.Buffer)
	spew.Fdump(buffer, a)
	log.Println(buffer.String())
}
