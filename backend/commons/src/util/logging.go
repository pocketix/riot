package util

import "log"

// TerminateOnError is a helper function that logs the supplied error message along some other information and then terminates the program in case of error.
func TerminateOnError(err error, errorMessage string) {
	if err != nil {
		log.Panicf("%s: %s", errorMessage, err)
	}
}

// LogPossibleErrorThenProceed is a helper function that logs the supplied error message along some other information in case of error. It does not terminate the program.
func LogPossibleErrorThenProceed(err error, errorMessage string) {
	if err != nil {
		log.Printf("%s: %s", errorMessage, err)
	}
}

func TerminateIfFalse(cond bool, errorMessage string) {
	if !cond {
		log.Panicf(errorMessage)
	}
}
