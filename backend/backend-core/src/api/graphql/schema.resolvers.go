package graphql

import (
	"context"
	"fmt"
	"log"
	"strconv"

	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/api/graphql/gsc"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/domainLogicLayer"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
)

func (r *mutationResolver) CreateSDType(ctx context.Context, input graphQLModel.SDTypeInput) (graphQLModel.SDType, error) {
	createSDTypeResult := domainLogicLayer.CreateSDType(input)
	if createSDTypeResult.IsFailure() {
		log.Printf("Error occurred (create SD type): %s\n", createSDTypeResult.GetError().Error())
	}
	return createSDTypeResult.Unwrap()
}

func (r *mutationResolver) DeleteSDType(ctx context.Context, id uint32) (bool, error) {
	if err := domainLogicLayer.DeleteSDType(id); err != nil {
		log.Printf("Error occurred (delete SD type): %s\n", err.Error())
		return false, err
	}
	return true, nil
}

func (r *mutationResolver) UpdateSDType(ctx context.Context, id uint32, input graphQLModel.SDTypeInput) (graphQLModel.SDType, error) {
	updateSDTypeResult := domainLogicLayer.UpdateSDType(id, input)
	if updateSDTypeResult.IsFailure() {
		log.Printf("Error occurred (update SD type): %s\n", updateSDTypeResult.GetError().Error())
	}
	return updateSDTypeResult.Unwrap()
}

func (r *mutationResolver) UpdateSDInstance(ctx context.Context, id uint32, input graphQLModel.SDInstanceUpdateInput) (graphQLModel.SDInstance, error) {
	updateSDInstanceResult := domainLogicLayer.UpdateSDInstance(id, input)
	if updateSDInstanceResult.IsFailure() {
		log.Printf("Error occurred (update SD instance): %s\n", updateSDInstanceResult.GetError().Error())
	}
	return updateSDInstanceResult.Unwrap()
}

func (r *mutationResolver) CreateKPIDefinition(ctx context.Context, input graphQLModel.KPIDefinitionInput) (graphQLModel.KPIDefinition, error) {
	createKPIDefinitionResult := domainLogicLayer.CreateKPIDefinition(input)
	if createKPIDefinitionResult.IsFailure() {
		log.Printf("Error occurred (create KPI definition): %s\n", createKPIDefinitionResult.GetError().Error())
	}
	return createKPIDefinitionResult.Unwrap()
}

func (r *mutationResolver) UpdateKPIDefinition(ctx context.Context, id uint32, input graphQLModel.KPIDefinitionInput) (graphQLModel.KPIDefinition, error) {
	updateKPIDefinitionResult := domainLogicLayer.UpdateKPIDefinition(id, input)
	if updateKPIDefinitionResult.IsFailure() {
		log.Printf("Error occurred (update KPI definition): %s\n", updateKPIDefinitionResult.GetError().Error())
	}
	return updateKPIDefinitionResult.Unwrap()
}

func (r *mutationResolver) DeleteKPIDefinition(ctx context.Context, id uint32) (bool, error) {
	if err := domainLogicLayer.DeleteKPIDefinition(id); err != nil {
		log.Printf("Error occurred (delete KPI definition): %s\n", err.Error())
		return false, err
	}
	return true, nil
}

func (r *mutationResolver) CreateSDInstanceGroup(ctx context.Context, input graphQLModel.SDInstanceGroupInput) (graphQLModel.SDInstanceGroup, error) {
	createSDInstanceGroupResult := domainLogicLayer.CreateSDInstanceGroup(input)
	if createSDInstanceGroupResult.IsFailure() {
		log.Printf("Error occurred (create SD instance group): %s\n", createSDInstanceGroupResult.GetError().Error())
	}
	return createSDInstanceGroupResult.Unwrap()
}

func (r *mutationResolver) UpdateSDInstanceGroup(ctx context.Context, id uint32, input graphQLModel.SDInstanceGroupInput) (graphQLModel.SDInstanceGroup, error) {
	updateSDInstanceGroupResult := domainLogicLayer.UpdateSDInstanceGroup(id, input)
	if updateSDInstanceGroupResult.IsFailure() {
		log.Printf("Error occurred (update SD instance group): %s\n", updateSDInstanceGroupResult.GetError().Error())
	}
	return updateSDInstanceGroupResult.Unwrap()
}

func (r *mutationResolver) DeleteSDInstanceGroup(ctx context.Context, id uint32) (bool, error) {
	if err := domainLogicLayer.DeleteSDInstanceGroup(id); err != nil {
		log.Printf("Error occurred (delete SD instance group): %s\n", err.Error())
		return false, err
	}
	return true, nil
}

func (r *mutationResolver) StatisticsMutate(ctx context.Context, inputData graphQLModel.InputData) (bool, error) {
	return domainLogicLayer.Save(inputData).Unwrap()
}

func (r *mutationResolver) UpdateUserConfig(ctx context.Context, userID uint32, input graphQLModel.UserConfigInput) (graphQLModel.UserConfig, error) {
	updateUserConfigResult := domainLogicLayer.UpdateUserConfig(userID, input)
	if updateUserConfigResult.IsFailure() {
		log.Printf("Error occurred (update SD instance group): %s\n", updateUserConfigResult.GetError().Error())
	}
	return updateUserConfigResult.Unwrap()
}

func (r *mutationResolver) DeleteUserConfig(ctx context.Context, userID uint32) (bool, error) {
	if err := domainLogicLayer.DeleteUserConfig(userID); err != nil {
		log.Printf("Error occurred (delete user configuration): %s\n", err.Error())
		return false, err
	}
	return true, nil
}

func (r *mutationResolver) CreateSDCommand(ctx context.Context, input graphQLModel.SDCommandInput) (graphQLModel.SDCommand, error) {
	createSDCommandResult := domainLogicLayer.CreateSDCommand(input)
	if createSDCommandResult.IsFailure() {
		log.Printf("Error occurred (create SD command): %s\n", createSDCommandResult.GetError().Error())
		return graphQLModel.SDCommand{}, createSDCommandResult.GetError()
	}
	return createSDCommandResult.Unwrap()
}

func (r *mutationResolver) UpdateSDCommand(ctx context.Context, id uint32, name *string, description *string) (graphQLModel.SDCommand, error) {
	updateSDCommandResult := domainLogicLayer.UpdateSDCommand(id, name, description)
	if updateSDCommandResult.IsFailure() {
		log.Printf("Error occurred (update SD command): %s\n", updateSDCommandResult.GetError().Error())
		return graphQLModel.SDCommand{}, updateSDCommandResult.GetError()
	}
	return updateSDCommandResult.Unwrap()
}

func (r *mutationResolver) DeleteSDCommand(ctx context.Context, id uint32) (bool, error) {
	if err := domainLogicLayer.DeleteSDCommand(id); err != nil {
		log.Printf("Error occurred (delete SD command): %s\n", err.Error())
		return false, err
	}
	return true, nil
}

func (r *mutationResolver) CreateSDCommandInvocation(ctx context.Context, input graphQLModel.SDCommandInvocationInput) (graphQLModel.SDCommandInvocation, error) {
	createSDCommandInvocationResult := domainLogicLayer.CreateSDCommandInvocation(input)
	if createSDCommandInvocationResult.IsFailure() {
		log.Printf("Error occurred (create SD command invocation): %s\n", createSDCommandInvocationResult.GetError().Error())
		return graphQLModel.SDCommandInvocation{}, createSDCommandInvocationResult.GetError()
	}
	return createSDCommandInvocationResult.Unwrap()
}

func (r *mutationResolver) InvokeSDCommand(ctx context.Context, id uint32) (bool, error) {
	invokeSDCommandResult := domainLogicLayer.InvokeSDCommand(id)
	if invokeSDCommandResult.IsFailure() {
		log.Printf("Error occurred (invoke SD command): %s\n", invokeSDCommandResult.GetError().Error())
		return false, invokeSDCommandResult.GetError()
	}
	return true, nil
}

func (r *mutationResolver) CreateVPLProgram(ctx context.Context, name string, data string) (graphQLModel.VPLProgram, error) {
	createVPLProgramResult := domainLogicLayer.CreateVPLProgram(name, data)
	if createVPLProgramResult.IsFailure() {
		log.Printf("Error occurred (create VPL program): %s\n", createVPLProgramResult.GetError().Error())
		return graphQLModel.VPLProgram{}, createVPLProgramResult.GetError()
	}

	return createVPLProgramResult.Unwrap()
}

func (r *mutationResolver) UpdateVPLProgram(ctx context.Context, id uint32, name string, data string) (graphQLModel.VPLProgram, error) {
	updateVPLProgramResult := domainLogicLayer.UpdateVPLProgram(id, name, data)
	if updateVPLProgramResult.IsFailure() {
		log.Printf("Error occurred (update VPL program): %s\n", updateVPLProgramResult.GetError().Error())
		return graphQLModel.VPLProgram{}, updateVPLProgramResult.GetError()
	}

	return updateVPLProgramResult.Unwrap()
}

func (r *mutationResolver) DeleteVPLProgram(ctx context.Context, id uint32) (bool, error) {
	if err := domainLogicLayer.DeleteVPLProgram(id); err != nil {
		log.Printf("Error occurred (delete VPL program): %s\n", err.Error())
		return false, err
	}
	return true, nil
}

func (r *mutationResolver) ExecuteVPLProgram(ctx context.Context, id uint32) (bool, error) {
	panic(fmt.Errorf("not implemented: ExecuteVPLProgram - executeVPLProgram"))
}

func (r *queryResolver) SdType(ctx context.Context, id uint32) (graphQLModel.SDType, error) {
	getSDTypeResult := domainLogicLayer.GetSDType(id)
	if getSDTypeResult.IsFailure() {
		log.Printf("Error occurred (get SD type): %s\n", getSDTypeResult.GetError().Error())
	}
	return getSDTypeResult.Unwrap()
}

func (r *queryResolver) SdTypes(ctx context.Context) ([]graphQLModel.SDType, error) {
	getSDTypesResult := domainLogicLayer.GetSDTypes()
	if getSDTypesResult.IsFailure() {
		log.Printf("Error occurred (get SD types): %s\n", getSDTypesResult.GetError().Error())
	}
	return getSDTypesResult.Unwrap()
}

func (r *queryResolver) SdInstances(ctx context.Context) ([]graphQLModel.SDInstance, error) {
	getSDInstancesResult := domainLogicLayer.GetSDInstances()
	if getSDInstancesResult.IsFailure() {
		log.Printf("Error occurred (get SD instances): %s\n", getSDInstancesResult.GetError().Error())
	}
	return getSDInstancesResult.Unwrap()
}

func (r *queryResolver) KpiDefinition(ctx context.Context, id uint32) (graphQLModel.KPIDefinition, error) {
	getKPIDefinitionResult := domainLogicLayer.GetKPIDefinition(id)
	if getKPIDefinitionResult.IsFailure() {
		log.Printf("Error occurred (get KPI definition): %s\n", getKPIDefinitionResult.GetError().Error())
	}
	return getKPIDefinitionResult.Unwrap()
}

func (r *queryResolver) KpiDefinitions(ctx context.Context) ([]graphQLModel.KPIDefinition, error) {
	getKPIDefinitionsResult := domainLogicLayer.GetKPIDefinitions()
	if getKPIDefinitionsResult.IsFailure() {
		log.Printf("Error occurred (get KPI definitions): %s\n", getKPIDefinitionsResult.GetError().Error())
	}
	return getKPIDefinitionsResult.Unwrap()
}

func (r *queryResolver) KpiFulfillmentCheckResults(ctx context.Context) ([]graphQLModel.KPIFulfillmentCheckResult, error) {
	getKPIFulfillmentCheckResultsResult := domainLogicLayer.GetKPIFulfillmentCheckResults()
	if getKPIFulfillmentCheckResultsResult.IsFailure() {
		log.Printf("Error occurred (get KPI fulfillment check results): %s\n", getKPIFulfillmentCheckResultsResult.GetError().Error())
	}
	return getKPIFulfillmentCheckResultsResult.Unwrap()
}

func (r *queryResolver) SdInstanceGroup(ctx context.Context, id uint32) (graphQLModel.SDInstanceGroup, error) {
	getSDInstanceGroupResult := domainLogicLayer.GetSDInstanceGroup(id)
	if getSDInstanceGroupResult.IsFailure() {
		log.Printf("Error occurred (get SD instance group): %s\n", getSDInstanceGroupResult.GetError().Error())
	}
	return getSDInstanceGroupResult.Unwrap()
}

func (r *queryResolver) SdInstanceGroups(ctx context.Context) ([]graphQLModel.SDInstanceGroup, error) {
	getSDInstanceGroupsResult := domainLogicLayer.GetSDInstanceGroups()
	if getSDInstanceGroupsResult.IsFailure() {
		log.Printf("Error occurred (get SD instance groups): %s\n", getSDInstanceGroupsResult.GetError().Error())
	}
	return getSDInstanceGroupsResult.Unwrap()
}

func (r *queryResolver) StatisticsQuerySimpleSensors(ctx context.Context, request *graphQLModel.StatisticsInput, sensors graphQLModel.SimpleSensors) ([]graphQLModel.OutputData, error) {
	convertedRequest, _ := domainLogicLayer.MapStatisticsInputToReadRequestBody(request, &sensors, nil)
	data := domainLogicLayer.Query(*convertedRequest)
	return data.Unwrap()
}

func (r *queryResolver) StatisticsQuerySensorsWithFields(ctx context.Context, request *graphQLModel.StatisticsInput, sensors graphQLModel.SensorsWithFields) ([]graphQLModel.OutputData, error) {
	convertedRequest, _ := domainLogicLayer.MapStatisticsInputToReadRequestBody(request, nil, &sensors)
	data := domainLogicLayer.Query(*convertedRequest)
	return data.Unwrap()
}

func (r *queryResolver) UserConfig(ctx context.Context, id uint32) (graphQLModel.UserConfig, error) {
	getUserConfigResult := domainLogicLayer.GetUserConfig(id)
	if getUserConfigResult.IsFailure() {
		log.Printf("Error occurred (get user config results): %s\n", getUserConfigResult.GetError().Error())
	}
	return getUserConfigResult.Unwrap()
}

func (r *queryResolver) MyUserConfig(ctx context.Context) (graphQLModel.UserConfig, error) {
	userIdString, ok := ctx.Value("userId").(string)
	if !ok {
		return graphQLModel.UserConfig{}, fmt.Errorf("user config id not set")
	}
	userId, err := strconv.ParseUint(userIdString, 10, 32)
	if err != nil {
		return graphQLModel.UserConfig{}, err
	}

	return domainLogicLayer.GetUserConfig(uint32(userId)).Unwrap()
}

func (r *queryResolver) SdCommand(ctx context.Context, id uint32) (graphQLModel.SDCommand, error) {
	getSDCommandResult := domainLogicLayer.GetSDCommand(id)
	if getSDCommandResult.IsFailure() {
		log.Printf("Error occurred (get SD command): %s\n", getSDCommandResult.GetError().Error())
		return graphQLModel.SDCommand{}, getSDCommandResult.GetError()
	}
	return getSDCommandResult.Unwrap()
}

func (r *queryResolver) SdCommands(ctx context.Context) ([]graphQLModel.SDCommand, error) {
	getSDCommandsResult := domainLogicLayer.GetSDCommands()
	if getSDCommandsResult.IsFailure() {
		log.Printf("Error occurred (get SD commands): %s\n", getSDCommandsResult.GetError().Error())
		return nil, getSDCommandsResult.GetError()
	}
	return getSDCommandsResult.Unwrap()
}

func (r *queryResolver) SdCommandInvocation(ctx context.Context, id uint32) (graphQLModel.SDCommandInvocation, error) {
	getSDCommandInvocationResult := domainLogicLayer.GetSDCommandInvocation(id)
	if getSDCommandInvocationResult.IsFailure() {
		log.Printf("Error occurred (get SD command invocation): %s\n", getSDCommandInvocationResult.GetError().Error())
		return graphQLModel.SDCommandInvocation{}, getSDCommandInvocationResult.GetError()
	}
	return getSDCommandInvocationResult.Unwrap()
}

func (r *queryResolver) SdCommandInvocations(ctx context.Context) ([]graphQLModel.SDCommandInvocation, error) {
	getSDCommandInvocationsResult := domainLogicLayer.GetSDCommandInvocations()
	if getSDCommandInvocationsResult.IsFailure() {
		log.Printf("Error occurred (get SD command invocations): %s\n", getSDCommandInvocationsResult.GetError().Error())
	}
	return getSDCommandInvocationsResult.Unwrap()
}

func (r *queryResolver) VplProgram(ctx context.Context, id uint32) (graphQLModel.VPLProgram, error) {
	panic(fmt.Errorf("not implemented: VplProgram - vplProgram"))
	// getVPLProgramResult := domainLogicLayer.GetVPLProgram(id)
	// if getVPLProgramResult.IsFailure() {
	// 	log.Printf("Error occurred (get VPL program): %s\n", getVPLProgramResult.GetError().Error())
	// 	return graphQLModel.VPLProgram{}, getVPLProgramResult.GetError()
	// }
	// return getVPLProgramResult.Unwrap()
}

func (r *subscriptionResolver) OnSDInstanceRegistered(ctx context.Context) (<-chan graphQLModel.SDInstance, error) {
	return SDInstanceGraphQLSubscriptionChannel, nil
}

func (r *subscriptionResolver) OnKPIFulfillmentChecked(ctx context.Context) (<-chan graphQLModel.KPIFulfillmentCheckResultTuple, error) {
	return KPIFulfillmentCheckResulTupleGraphQLSubscriptionChannel, nil
}

func (r *subscriptionResolver) OnSDParameterSnapshotUpdate(ctx context.Context) (<-chan graphQLModel.SDParameterSnapshot, error) {
	return SDParameterSnapshotUpdateSubscriptionChannel, nil
}

func (r *subscriptionResolver) CommandInvocationStateChanged(ctx context.Context) (<-chan graphQLModel.SDCommandInvocation, error) {
	panic(fmt.Errorf("not implemented: CommandInvocationStateChanged - commandInvocationStateChanged"))
}

func (r *Resolver) Mutation() gsc.MutationResolver { return &mutationResolver{r} }

func (r *Resolver) Query() gsc.QueryResolver { return &queryResolver{r} }

func (r *Resolver) Subscription() gsc.SubscriptionResolver { return &subscriptionResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
type subscriptionResolver struct{ *Resolver }
