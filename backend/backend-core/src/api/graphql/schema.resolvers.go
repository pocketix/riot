package graphql

import (
	"context"
	"log"

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

func (r *subscriptionResolver) OnSDInstanceRegistered(ctx context.Context) (<-chan graphQLModel.SDInstance, error) {
	return SDInstanceGraphQLSubscriptionChannel, nil
}

func (r *subscriptionResolver) OnKPIFulfillmentChecked(ctx context.Context) (<-chan graphQLModel.KPIFulfillmentCheckResultTuple, error) {
	return KPIFulfillmentCheckResulTupleGraphQLSubscriptionChannel, nil
}

func (r *Resolver) Mutation() gsc.MutationResolver { return &mutationResolver{r} }

func (r *Resolver) Query() gsc.QueryResolver { return &queryResolver{r} }

func (r *Resolver) Subscription() gsc.SubscriptionResolver { return &subscriptionResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
type subscriptionResolver struct{ *Resolver }
