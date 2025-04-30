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

type graphQLOperation struct {
	name   string
	opType graphQLOperationType
}

func CreateGraphQLAPISnapshot() sharedUtils.Result[[]graphQLOperation] {
	binaryPath, err := os.Executable()
	if err != nil {
		return sharedUtils.NewFailureResult[[]graphQLOperation](err)
	}
	graphQLSchemaFilePath := filepath.Join(filepath.Dir(binaryPath), "schema.graphqls")
	gqlSchemaFileBytes, err := os.ReadFile(graphQLSchemaFilePath)
	if err != nil {
		return sharedUtils.NewFailureResult[[]graphQLOperation](err)
	}
	schema, err := gqlparser.LoadSchema(&ast.Source{
		Name:  graphQLSchemaFilePath,
		Input: string(gqlSchemaFileBytes),
	})
	if err != nil {
		return sharedUtils.NewFailureResult[[]graphQLOperation](err)
	}
	graphQLOperations := make([]graphQLOperation, 0)
	procesTLDefinition := func(definition *ast.Definition, opType graphQLOperationType) {
		if definition == nil {
			return
		}
		sharedUtils.ForEach(definition.Fields, func(fieldDefinition *ast.FieldDefinition) {
			graphQLOperations = append(graphQLOperations, graphQLOperation{
				name:   fieldDefinition.Name,
				opType: opType,
			})
		})
	}
	procesTLDefinition(schema.Query, graphQLOperationTypeQuery)
	procesTLDefinition(schema.Mutation, graphQLOperationTypeMutation)
	procesTLDefinition(schema.Subscription, graphQLOperationTypeSubscription)
	return sharedUtils.NewSuccessResult(graphQLOperations)
}
