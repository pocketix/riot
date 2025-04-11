package domainLogicLayer

import (
	"errors"
	"log"

	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/modelMapping/dll2gql"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/rabbitmq"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedConstants"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	amqp "github.com/rabbitmq/amqp091-go"
)

func CreateVPLProgram(name string, data string) sharedUtils.Result[graphQLModel.VPLProgram] {
	result, err := performVPLValidityCheckRequest(data)
	if err != nil {
		log.Printf("Save program failed: %s", err)
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgram](err)
	}
	result.Name = name

	dbResult := dbClient.GetRelationalDatabaseClientInstance().PersistVPLProgram(result)
	if dbResult.IsFailure() {
		log.Printf("Save program failed: %s", dbResult.GetError())
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgram](dbResult.GetError())
	}

	return sharedUtils.NewSuccessResult[graphQLModel.VPLProgram](dll2gql.ToGraphQLModelVPLProgram(result))
}

func UpdateVPLProgram(id uint32, name string, data string) sharedUtils.Result[graphQLModel.VPLProgram] {
	result, err := performVPLValidityCheckRequest(data)
	if err != nil {
		log.Printf("Save program failed: %s", err)
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgram](err)
	}

	result.ID = id
	result.Name = name

	dbResult := dbClient.GetRelationalDatabaseClientInstance().PersistVPLProgram(result)
	if dbResult.IsFailure() {
		log.Printf("Save program failed: %s", dbResult.GetError())
		return sharedUtils.NewFailureResult[graphQLModel.VPLProgram](dbResult.GetError())
	}

	return sharedUtils.NewSuccessResult[graphQLModel.VPLProgram](dll2gql.ToGraphQLModelVPLProgram(result))
}

func performVPLValidityCheckRequest(input string) (dllModel.VPLProgram, error) {
	rabbitMQClient := getDLLRabbitMQClient()
	correlationId := randomString(32)
	outputChannel := make(chan sharedUtils.Result[sharedModel.VPLProgram])

	go func() {
		client := rabbitmq.NewClient()
		defer client.Dispose()

		err := rabbitmq.ConsumeJSONMessagesWithAccessToDelivery[sharedModel.VPLInterpretSaveResultOrError](
			client,
			sharedConstants.VPLInterpretSaveProgramResponseQueueName,
			correlationId,
			func(vplInterpretSaveResult sharedModel.VPLInterpretSaveResultOrError, delivery amqp.Delivery) error {
				if vplInterpretSaveResult.Error != "" {
					outputChannel <- sharedUtils.NewFailureResult[sharedModel.VPLProgram](errors.New(vplInterpretSaveResult.Error))
				} else {
					outputChannel <- sharedUtils.NewSuccessResult[sharedModel.VPLProgram](vplInterpretSaveResult.Program)
				}

				close(outputChannel)
				return nil
			},
		)

		if err != nil {
			log.Printf("Save program failed: %s", err)
			outputChannel <- sharedUtils.NewFailureResult[sharedModel.VPLProgram](err)
			close(outputChannel)
		}
	}()

	err := rabbitMQClient.PublishJSONMessageRPC(
		sharedUtils.NewEmptyOptional[string](),
		sharedUtils.NewOptionalOf(sharedConstants.VPLInterpretSaveProgramRequestQueueName),
		[]byte(input),
		correlationId,
		sharedUtils.NewOptionalOf(sharedConstants.VPLInterpretSaveProgramResponseQueueName),
	)

	if err != nil {
		log.Printf("Save program failed: %s", err)
		return dllModel.VPLProgram{}, err
	}

	result := <-outputChannel

	if result.IsFailure() {
		log.Printf("Save program failed: %s", result.GetError())
		return dllModel.VPLProgram{}, result.GetError()
	}

	return ConvertSharedModelVPLProgramToDLLModel(result.GetPayload())
}

func ConvertSharedModelVPLProgramToDLLModel(program sharedModel.VPLProgram) (dllModel.VPLProgram, error) {
	var SDParameterSnapshotList []dllModel.SDParameterSnapshot

	databaseClient := dbClient.GetRelationalDatabaseClientInstance()

	for key, referencedValue := range program.ReferencedValues {
		sdType := databaseClient.LoadSDTypeBasedOnDenotation(key)
		if sdType.IsFailure() {
			log.Printf("Failed to load SDType based on denotation: %s", sdType.GetError())
			return dllModel.VPLProgram{}, sdType.GetError()
		}

		sdTypePayload := sdType.GetPayload()

		result := sharedUtils.Filter(sdTypePayload.Parameters, func(parameter dllModel.SDParameter) bool {
			return parameter.Denotation == referencedValue
		})

		SDParameterSnapshotList = append(SDParameterSnapshotList, dllModel.SDParameterSnapshot{
			SDInstance:  sdTypePayload.ID.GetPayload(),
			SDParameter: result[0].ID.GetPayload(),
		})
	}

	return dllModel.VPLProgram{
		ID:                   program.ID,
		Name:                 program.Name,
		Data:                 program.Data,
		SDParameterSnapshots: SDParameterSnapshotList,
	}, nil
}

// func UpdateVPLProgram(id uint32, name string, data string) sharedUtils.Result[graphQLModel.VPLProgram] {

// program := dllModel.VPLProgram{
// 	ID:   id,
// 	Name: name,
// 	Data: data,
// }

// updateVPLProgramResult := dbClient.GetRelationalDatabaseClientInstance().PersistVPLProgram(program)
// if updateVPLProgramResult.IsFailure() {
// 	return sharedUtils.NewFailureResult[graphQLModel.VPLProgram](updateVPLProgramResult.GetError())
// }
// return sharedUtils.NewSuccessResult(dll2gql.ToGraphQLModelVPLProgram(program))
// }

func DeleteVPLProgram(id uint32) error {
	return dbClient.GetRelationalDatabaseClientInstance().DeleteVPLProgram(id)
}

// func GetVPLProgram(id uint32) sharedUtils.Result[graphQLModel.VPLProgram] {
// 	loadProgramResult := dbClient.GetRelationalDatabaseClientInstance().LoadVPLProgram(id)
// 	if loadProgramResult.IsFailure() {
// 		return sharedUtils.NewFailureResult[graphQLModel.VPLProgram](loadProgramResult.GetError())
// 	}
// 	return sharedUtils.NewSuccessResult(dll2gql.ToGraphQLModelVPLProgram(loadProgramResult.GetPayload()))
// }
