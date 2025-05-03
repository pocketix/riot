package dll2gql

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func ToGraphQLModelVPLProgram(vplProgram dllModel.VPLProgram) graphQLModel.VPLProgram {
	return graphQLModel.VPLProgram{
		ID:   vplProgram.ID,
		Name: vplProgram.Name,
		Data: vplProgram.Data,
		LastRun: func() *string {
			if vplProgram.LastRun != nil {
				lastRunStr := vplProgram.LastRun.String()
				return &lastRunStr
			}
			return nil
		}(),
		Enabled: vplProgram.Enabled,
		SdParameterSnapshots: sharedUtils.Map(vplProgram.SDParameterSnapshots, func(link dllModel.VPLProgramSDSnapshotLink) graphQLModel.SDParameterSnapshot {
			return graphQLModel.SDParameterSnapshot{
				InstanceID:  link.InstanceID,
				ParameterID: link.ParameterID,
				VplPrograms: sharedUtils.Map(vplProgram.SDParameterSnapshots, func(link dllModel.VPLProgramSDSnapshotLink) uint32 {
					return link.ProgramID
				}),
			}
		}),
	}
}

func ToGraphQLModelPLProgramExecutionResult(program dllModel.VPLProgramExecutionResult) graphQLModel.VPLProgramExecutionResult {
	return graphQLModel.VPLProgramExecutionResult{
		Program: ToGraphQLModelVPLProgram(program.Program),
		SdParameterSnapshotsToUpdate: sharedUtils.Map(program.SDParameterSnapshotList, func(snapshot dllModel.SDParameterSnapshot) graphQLModel.SDParameterSnapshot {
			return ToGraphQLModelSdParameterSnapshot(snapshot)
		}),
		SdCommandInvocations: sharedUtils.Map(program.SDCommandInvocationList, func(invocation dllModel.SDCommandInvocation) graphQLModel.SDCommandInvocation {
			return ToGraphQLModelSDCommandInvocation(invocation)
		}),
		ExecutionTime:   program.ExecutionTime,
		Enabled:         program.Enabled,
		Success:         program.Success,
		Error:           program.Error,
		ExecutionReason: program.ExecutionReasion,
	}
}
