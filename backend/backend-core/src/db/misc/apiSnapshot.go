package misc

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"github.com/vektah/gqlparser/v2"
	"github.com/vektah/gqlparser/v2/ast"
	"os"
	"path/filepath"
)

type GraphQLOperationType string

const (
	GraphQLOperationTypeQuery        GraphQLOperationType = "query"
	GraphQLOperationTypeMutation     GraphQLOperationType = "mutation"
	GraphQLOperationTypeSubscription GraphQLOperationType = "subscription"
)

type GraphQLOperation struct { // TODO: Consider moving this elsewhere
	Identifier string
	OpType     GraphQLOperationType
}

func CreateGraphQLAPISnapshot() sharedUtils.Result[[]GraphQLOperation] {
	binaryPath, err := os.Executable()
	if err != nil {
		return sharedUtils.NewFailureResult[[]GraphQLOperation](err)
	}
	graphQLSchemaFilePath := filepath.Join(filepath.Dir(binaryPath), "schema.graphqls")
	gqlSchemaFileBytes, err := os.ReadFile(graphQLSchemaFilePath)
	if err != nil {
		return sharedUtils.NewFailureResult[[]GraphQLOperation](err)
	}
	schema, err := gqlparser.LoadSchema(&ast.Source{
		Name:  graphQLSchemaFilePath,
		Input: string(gqlSchemaFileBytes),
	})
	if err != nil {
		return sharedUtils.NewFailureResult[[]GraphQLOperation](err)
	}
	graphQLOperations := make([]GraphQLOperation, 0)
	procesTLDefinition := func(definition *ast.Definition, opType GraphQLOperationType) {
		if definition == nil {
			return
		}
		sharedUtils.ForEach(definition.Fields, func(fieldDefinition *ast.FieldDefinition) {
			graphQLOperations = append(graphQLOperations, GraphQLOperation{
				Identifier: fieldDefinition.Name,
				OpType:     opType,
			})
		})
	}
	procesTLDefinition(schema.Query, GraphQLOperationTypeQuery)
	procesTLDefinition(schema.Mutation, GraphQLOperationTypeMutation)
	procesTLDefinition(schema.Subscription, GraphQLOperationTypeSubscription)
	return sharedUtils.NewSuccessResult(graphQLOperations)
}
