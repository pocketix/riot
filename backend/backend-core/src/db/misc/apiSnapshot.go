package misc

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"github.com/vektah/gqlparser/v2"
	"github.com/vektah/gqlparser/v2/ast"
	"os"
	"path/filepath"
)

type graphQLOperationType string

const (
	graphQLOperationTypeQuery        graphQLOperationType = "query"
	graphQLOperationTypeMutation     graphQLOperationType = "mutation"
	graphQLOperationTypeSubscription graphQLOperationType = "subscription"
)

type GraphQLOperation struct {
	Identifier string
	OpType     graphQLOperationType
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
	procesTLDefinition := func(definition *ast.Definition, opType graphQLOperationType) {
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
	procesTLDefinition(schema.Query, graphQLOperationTypeQuery)
	procesTLDefinition(schema.Mutation, graphQLOperationTypeMutation)
	procesTLDefinition(schema.Subscription, graphQLOperationTypeSubscription)
	return sharedUtils.NewSuccessResult(graphQLOperations)
}
