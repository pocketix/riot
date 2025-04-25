package domainLogicLayer

import (
	"encoding/json"
	"log"

	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/modelMapping/dll2gql"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

// CreateVPLProcedure creates a new VPL procedure
func CreateVPLProcedure(input graphQLModel.VPLProcedureInput) sharedUtils.Result[graphQLModel.VPLProcedure] {
	procedure := dllModel.VPLProcedure{
		Name: input.Name,
		Data: input.Data,
	}

	dbResult := dbClient.GetRelationalDatabaseClientInstance().PersistVPLProcedure(procedure)
	if dbResult.IsFailure() {
		log.Printf("Save procedure failed: %s", dbResult.GetError())
		return sharedUtils.NewFailureResult[graphQLModel.VPLProcedure](dbResult.GetError())
	}

	return sharedUtils.NewSuccessResult[graphQLModel.VPLProcedure](dll2gql.ToGraphQLModelVPLProcedure(dbResult.GetPayload()))
}

// UpdateVPLProcedure updates an existing VPL procedure
func UpdateVPLProcedure(id uint32, input graphQLModel.VPLProcedureInput) sharedUtils.Result[graphQLModel.VPLProcedure] {
	procedure := dllModel.VPLProcedure{
		ID:   id,
		Name: input.Name,
		Data: input.Data,
	}

	dbResult := dbClient.GetRelationalDatabaseClientInstance().PersistVPLProcedure(procedure)
	if dbResult.IsFailure() {
		log.Printf("Update procedure failed: %s", dbResult.GetError())
		return sharedUtils.NewFailureResult[graphQLModel.VPLProcedure](dbResult.GetError())
	}

	return sharedUtils.NewSuccessResult[graphQLModel.VPLProcedure](dll2gql.ToGraphQLModelVPLProcedure(dbResult.GetPayload()))
}

// GetVPLProcedure gets a VPL procedure by ID
func GetVPLProcedure(id uint32) sharedUtils.Result[graphQLModel.VPLProcedure] {
	loadProcedureResult := dbClient.GetRelationalDatabaseClientInstance().LoadVPLProcedure(id)
	if loadProcedureResult.IsFailure() {
		return sharedUtils.NewFailureResult[graphQLModel.VPLProcedure](loadProcedureResult.GetError())
	}
	return sharedUtils.NewSuccessResult(dll2gql.ToGraphQLModelVPLProcedure(loadProcedureResult.GetPayload()))
}

// GetVPLProcedures gets all VPL procedures
func GetVPLProcedures() sharedUtils.Result[[]graphQLModel.VPLProcedure] {
	loadProceduresResult := dbClient.GetRelationalDatabaseClientInstance().LoadVPLProcedures()
	if loadProceduresResult.IsFailure() {
		return sharedUtils.NewFailureResult[[]graphQLModel.VPLProcedure](loadProceduresResult.GetError())
	}
	return sharedUtils.NewSuccessResult(sharedUtils.Map(loadProceduresResult.GetPayload(), dll2gql.ToGraphQLModelVPLProcedure))
}

// DeleteVPLProcedure deletes a VPL procedure by ID
func DeleteVPLProcedure(id uint32) error {
	return dbClient.GetRelationalDatabaseClientInstance().DeleteVPLProcedure(id)
}

// ExtractAndSaveUserProcedures extracts user procedures from a VPL program's data and saves them
func ExtractAndSaveUserProcedures(programData string) error {
	// Parse the program data to extract userProcedures
	var programJSON map[string]interface{}
	if err := json.Unmarshal([]byte(programData), &programJSON); err != nil {
		log.Printf("Failed to parse program data: %s", err)
		return err
	}

	// Check if userProcedures exists in the program data
	userProcedures, exists := programJSON["userProcedures"]
	if !exists {
		// No user procedures to save
		return nil
	}

	// Convert userProcedures to a map
	proceduresMap, ok := userProcedures.(map[string]interface{})
	if !ok {
		log.Printf("userProcedures is not a map: %T", userProcedures)
		return nil
	}

	// Iterate through each procedure and save it
	for name, procedureData := range proceduresMap {
		// Convert procedure data to JSON string
		procedureJSON, err := json.Marshal(procedureData)
		if err != nil {
			log.Printf("Failed to marshal procedure data: %s", err)
			continue
		}

		// Create a new procedure
		procedure := dllModel.VPLProcedure{
			Name: name,
			Data: string(procedureJSON),
		}

		// Check if a procedure with this name already exists
		existingProcedures := dbClient.GetRelationalDatabaseClientInstance().LoadVPLProcedures()
		if existingProcedures.IsFailure() {
			log.Printf("Failed to load existing procedures: %s", existingProcedures.GetError())
			continue
		}

		// Look for a procedure with the same name
		var existingProcedure *dllModel.VPLProcedure
		for _, p := range existingProcedures.GetPayload() {
			if p.Name == name {
				existingProcedure = &p
				break
			}
		}

		// If the procedure exists, update it; otherwise, create a new one
		if existingProcedure != nil {
			procedure.ID = existingProcedure.ID
		}

		// Save the procedure
		result := dbClient.GetRelationalDatabaseClientInstance().PersistVPLProcedure(procedure)
		if result.IsFailure() {
			log.Printf("Failed to save procedure '%s': %s", name, result.GetError())
		} else {
			log.Printf("Saved procedure '%s'", name)
		}
	}

	return nil
}
