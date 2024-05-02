package util

import (
	"github.com/davecgh/go-spew/spew"
	"log"
)

func Dump(a ...any) {
	spew.Dump(a)
}

func DumpWithAnnotation(annotation string, a ...any) {
	log.Println(annotation)
	spew.Dump(a)
}
