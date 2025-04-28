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
	// Get all programs linked to this procedure
	programsResult := dbClient.GetRelationalDatabaseClientInstance().GetProgramsForProcedure(id)
	if programsResult.IsFailure() {
		log.Printf("Warning: Failed to get programs for procedure %d: %s", id, programsResult.GetError())
	} else {
		// Unlink all programs from this procedure
		for _, program := range programsResult.GetPayload() {
			err := dbClient.GetRelationalDatabaseClientInstance().UnlinkProgramFromProcedure(program.ID, id)
			if err != nil {
				log.Printf("Warning: Failed to unlink program %d from procedure %d: %s", program.ID, id, err)
			}
		}
	}

	// Delete the procedure
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

	// Get the program ID if it exists
	var programID uint32
	if id, exists := programJSON["id"]; exists {
		if idFloat, ok := id.(float64); ok {
			programID = uint32(idFloat)
		}
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

	// Get all existing procedures
	existingProcedures := dbClient.GetRelationalDatabaseClientInstance().LoadVPLProcedures()
	if existingProcedures.IsFailure() {
		log.Printf("Failed to load existing procedures: %s", existingProcedures.GetError())
		return existingProcedures.GetError()
	}

	// Track saved procedure IDs to link to the program
	var savedProcedureIDs []uint32

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
			savedProcedureIDs = append(savedProcedureIDs, result.GetPayload().ID)
		}
	}

	// If we have a program ID and saved procedures, link them
	if programID > 0 && len(savedProcedureIDs) > 0 {
		// First, get all existing procedure links for this program
		existingLinks := dbClient.GetRelationalDatabaseClientInstance().GetProceduresForProgram(programID)
		if existingLinks.IsFailure() {
			log.Printf("Failed to get existing procedure links: %s", existingLinks.GetError())
		} else {
			// Create a map of existing procedure IDs
			existingLinkMap := make(map[uint32]bool)
			for _, proc := range existingLinks.GetPayload() {
				existingLinkMap[proc.ID] = true
			}

			// Link each saved procedure to the program if not already linked
			for _, procID := range savedProcedureIDs {
				if !existingLinkMap[procID] {
					err := dbClient.GetRelationalDatabaseClientInstance().LinkProgramToProcedure(programID, procID)
					if err != nil {
						log.Printf("Failed to link procedure %d to program %d: %s", procID, programID, err)
					} else {
						log.Printf("Linked procedure %d to program %d", procID, programID)
					}
				}
			}
		}
	}

	return nil
}

// GetProceduresForProgram gets all procedures linked to a program
func GetProceduresForProgram(programID uint32) sharedUtils.Result[[]graphQLModel.VPLProcedure] {
	proceduresResult := dbClient.GetRelationalDatabaseClientInstance().GetProceduresForProgram(programID)
	if proceduresResult.IsFailure() {
		return sharedUtils.NewFailureResult[[]graphQLModel.VPLProcedure](proceduresResult.GetError())
	}
	return sharedUtils.NewSuccessResult(sharedUtils.Map(proceduresResult.GetPayload(), dll2gql.ToGraphQLModelVPLProcedure))
}

// GetProgramsForProcedure gets all programs linked to a procedure
func GetProgramsForProcedure(procedureID uint32) sharedUtils.Result[[]graphQLModel.VPLProgram] {
	programsResult := dbClient.GetRelationalDatabaseClientInstance().GetProgramsForProcedure(procedureID)
	if programsResult.IsFailure() {
		return sharedUtils.NewFailureResult[[]graphQLModel.VPLProgram](programsResult.GetError())
	}
	return sharedUtils.NewSuccessResult(sharedUtils.Map(programsResult.GetPayload(), dll2gql.ToGraphQLModelVPLProgram))
}

// LinkProgramToProcedure links a program to a procedure
func LinkProgramToProcedure(programID uint32, procedureID uint32) error {
	return dbClient.GetRelationalDatabaseClientInstance().LinkProgramToProcedure(programID, procedureID)
}

// UnlinkProgramFromProcedure unlinks a program from a procedure
func UnlinkProgramFromProcedure(programID uint32, procedureID uint32) error {
	return dbClient.GetRelationalDatabaseClientInstance().UnlinkProgramFromProcedure(programID, procedureID)
}
