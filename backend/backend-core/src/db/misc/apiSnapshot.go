package misc

import (
	"os"
	"path/filepath"

	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"github.com/vektah/gqlparser/v2"
	"github.com/vektah/gqlparser/v2/ast"
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

func graphQLSchemaToSource() (*ast.Source, error) {
	binaryPath, err := os.Executable()
	if err != nil {
		return nil, err
	}
	graphQLSchemaFilePath := filepath.Join(filepath.Dir(binaryPath), "schema.graphqls")
	gqlSchemaFileBytes, err := os.ReadFile(graphQLSchemaFilePath)
	if err != nil {
		return nil, err
	}
	return &ast.Source{
		Name:  graphQLSchemaFilePath,
		Input: string(gqlSchemaFileBytes),
	}, nil
}

func createGraphQLAPISnapshotFromSource(source *ast.Source) sharedUtils.Result[[]GraphQLOperation] {
	schema, err := gqlparser.LoadSchema(source)
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

func CreateGraphQLAPISnapshot() sharedUtils.Result[[]GraphQLOperation] {
	graphQLSchemaSource, err := graphQLSchemaToSource()
	if err != nil {
		return sharedUtils.NewFailureResult[[]GraphQLOperation](err)
	}
	return createGraphQLAPISnapshotFromSource(graphQLSchemaSource)
}
