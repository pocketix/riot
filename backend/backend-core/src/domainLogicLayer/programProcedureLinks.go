package domainLogicLayer

import (
	"log"

	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/modelMapping/dll2gql"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

// LinkProgramToProcedure links a program to a procedure
func LinkProgramToProcedure(programID uint32, procedureID uint32) error {
	err := dbClient.GetRelationalDatabaseClientInstance().LinkProgramToProcedure(programID, procedureID)
	if err != nil {
		log.Printf("Error linking program to procedure: %s", err)
		return err
	}
	return nil
}

// UnlinkProgramFromProcedure unlinks a program from a procedure
func UnlinkProgramFromProcedure(programID uint32, procedureID uint32) error {
	err := dbClient.GetRelationalDatabaseClientInstance().UnlinkProgramFromProcedure(programID, procedureID)
	if err != nil {
		log.Printf("Error unlinking program from procedure: %s", err)
		return err
	}
	return nil
}

// GetProceduresForProgram gets all procedures linked to a program
func GetProceduresForProgram(programID uint32) sharedUtils.Result[[]graphQLModel.VPLProcedure] {
	proceduresResult := dbClient.GetRelationalDatabaseClientInstance().GetProceduresForProgram(programID)
	if proceduresResult.IsFailure() {
		log.Printf("Error getting procedures for program: %s", proceduresResult.GetError())
		return sharedUtils.NewFailureResult[[]graphQLModel.VPLProcedure](proceduresResult.GetError())
	}
	return sharedUtils.NewSuccessResult(sharedUtils.Map(proceduresResult.GetPayload(), dll2gql.ToGraphQLModelVPLProcedure))
}

// GetProgramsForProcedure gets all programs linked to a procedure
func GetProgramsForProcedure(procedureID uint32) sharedUtils.Result[[]graphQLModel.VPLProgram] {
	programsResult := dbClient.GetRelationalDatabaseClientInstance().GetProgramsForProcedure(procedureID)
	if programsResult.IsFailure() {
		log.Printf("Error getting programs for procedure: %s", programsResult.GetError())
		return sharedUtils.NewFailureResult[[]graphQLModel.VPLProgram](programsResult.GetError())
	}
	return sharedUtils.NewSuccessResult(sharedUtils.Map(programsResult.GetPayload(), dll2gql.ToGraphQLModelVPLProgram))
}
