package domainLogicLayer

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/modelMapping/dll2gql"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func CreateVPLProgram(name string, data string) sharedUtils.Result[graphQLModel.VPLProgram] {
	program := dllModel.VPLProgram{
		Name: name,
		Data: data,
	}

	createVPLProgramResult := dbClient.GetRelationalDatabaseClientInstance().PersistVPLProgram(program)
	if createVPLProgramResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgram](createVPLProgramResult.GetError())
	}
	return sharedUtils.NewSuccessResult(dll2gql.ToGraphQLModelVPLProgram(program))
}

func UpdateVPLProgram(id uint32, name string, data string) sharedUtils.Result[graphQLModel.VPLProgram] {
	program := dllModel.VPLProgram{
		ID:   id,
		Name: name,
		Data: data,
	}

	updateVPLProgramResult := dbClient.GetRelationalDatabaseClientInstance().PersistVPLProgram(program)
	if updateVPLProgramResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgram](updateVPLProgramResult.GetError())
	}
	return sharedUtils.NewSuccessResult(dll2gql.ToGraphQLModelVPLProgram(program))
}

func DeleteVPLProgram(id uint32) error {
	return dbClient.GetRelationalDatabaseClientInstance().DeleteVPLProgram(id)
}

func GetVPLProgram(id uint32) sharedUtils.Result[graphQLModel.VPLProgram] {
	loadProgramResult := dbClient.GetRelationalDatabaseClientInstance().LoadVPLProgram(id)
	if loadProgramResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgram](loadProgramResult.GetError())
	}
	return sharedUtils.NewSuccessResult(dll2gql.ToGraphQLModelVPLProgram(loadProgramResult.GetPayload()))
}
