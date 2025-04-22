package dllModel

import (
	"time"

	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

type SDParameterSnapshot struct {
	SDInstance  uint32
	SDParameter uint32
	String      sharedUtils.Optional[string]
	Number      sharedUtils.Optional[float64]
	Boolean     sharedUtils.Optional[bool]
	UpdatedAt   time.Time
	VPLPrograms []VPLProgramSDSnapshotLink
}
