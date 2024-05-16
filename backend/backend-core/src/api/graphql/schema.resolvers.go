package graphql

import (
	"context"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/domainLogicLayer"

	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/api/graphql/gsc"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/model/graphQLModel"
)

func (r *mutationResolver) CreateSDType(ctx context.Context, input graphQLModel.SDTypeInput) (graphQLModel.SDType, error) {
	return domainLogicLayer.CreateSDType(input).Unwrap()
}

func (r *mutationResolver) DeleteSDType(ctx context.Context, id uint32) (bool, error) {
	err := domainLogicLayer.DeleteSDType(id)
	return err == nil, err
}

func (r *mutationResolver) UpdateSDInstance(ctx context.Context, id uint32, input graphQLModel.SDInstanceUpdateInput) (graphQLModel.SDInstance, error) {
	return domainLogicLayer.UpdateSDInstance(id, input).Unwrap()
}

func (r *mutationResolver) CreateKPIDefinition(ctx context.Context, input graphQLModel.KPIDefinitionInput) (graphQLModel.KPIDefinition, error) {
	return domainLogicLayer.CreateKPIDefinition(input).Unwrap()
}

func (r *mutationResolver) UpdateKPIDefinition(ctx context.Context, id uint32, input graphQLModel.KPIDefinitionInput) (graphQLModel.KPIDefinition, error) {
	return domainLogicLayer.UpdateKPIDefinition(id, input).Unwrap()
}

func (r *mutationResolver) DeleteKPIDefinition(ctx context.Context, id uint32) (bool, error) {
	err := domainLogicLayer.DeleteKPIDefinition(id)
	return err == nil, err
}

func (r *mutationResolver) CreateSDInstanceGroup(ctx context.Context, input graphQLModel.SDInstanceGroupInput) (graphQLModel.SDInstanceGroup, error) {
	return domainLogicLayer.CreateSDInstanceGroup(input).Unwrap()
}

func (r *mutationResolver) UpdateSDInstanceGroup(ctx context.Context, id uint32, input graphQLModel.SDInstanceGroupInput) (graphQLModel.SDInstanceGroup, error) {
	return domainLogicLayer.UpdateSDInstanceGroup(id, input).Unwrap()
}

func (r *mutationResolver) DeleteSDInstanceGroup(ctx context.Context, id uint32) (bool, error) {
	err := domainLogicLayer.DeleteSDInstanceGroup(id)
	return err == nil, err
}

func (r *queryResolver) SdType(ctx context.Context, id uint32) (graphQLModel.SDType, error) {
	return domainLogicLayer.GetSDType(id).Unwrap()
}

func (r *queryResolver) SdTypes(ctx context.Context) ([]graphQLModel.SDType, error) {
	return domainLogicLayer.GetSDTypes().Unwrap()
}

func (r *queryResolver) SdInstances(ctx context.Context) ([]graphQLModel.SDInstance, error) {
	return domainLogicLayer.GetSDInstances().Unwrap()
}

func (r *queryResolver) KpiDefinition(ctx context.Context, id uint32) (graphQLModel.KPIDefinition, error) {
	return domainLogicLayer.GetKPIDefinition(id).Unwrap()
}

func (r *queryResolver) KpiDefinitions(ctx context.Context) ([]graphQLModel.KPIDefinition, error) {
	return domainLogicLayer.GetKPIDefinitions().Unwrap()
}

func (r *queryResolver) KpiFulfillmentCheckResults(ctx context.Context) ([]graphQLModel.KPIFulfillmentCheckResult, error) {
	return domainLogicLayer.GetKPIFulfillmentCheckResults().Unwrap()
}

func (r *queryResolver) SdInstanceGroup(ctx context.Context, id uint32) (graphQLModel.SDInstanceGroup, error) {
	return domainLogicLayer.GetSDInstanceGroup(id).Unwrap()
}

func (r *queryResolver) SdInstanceGroups(ctx context.Context) ([]graphQLModel.SDInstanceGroup, error) {
	return domainLogicLayer.GetSDInstanceGroups().Unwrap()
}

func (r *subscriptionResolver) OnSDInstanceRegistered(ctx context.Context) (<-chan graphQLModel.SDInstance, error) {
	return SDInstanceChannel, nil
}

func (r *subscriptionResolver) OnKPIFulfillmentChecked(ctx context.Context) (<-chan graphQLModel.KPIFulfillmentCheckResult, error) {
	return KPIFulfillmentCheckResultChannel, nil
}

func (r *Resolver) Mutation() gsc.MutationResolver { return &mutationResolver{r} }

func (r *Resolver) Query() gsc.QueryResolver { return &queryResolver{r} }

func (r *Resolver) Subscription() gsc.SubscriptionResolver { return &subscriptionResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
type subscriptionResolver struct{ *Resolver }
