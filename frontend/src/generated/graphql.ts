export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type AtomKpiNode = {
  id: Scalars['ID']['output'];
  nodeType: KpiNodeType;
  parentNodeID?: Maybe<Scalars['ID']['output']>;
  sdParameterSpecification: Scalars['String']['output'];
};

export type BooleanEqAtomKpiNode = AtomKpiNode & KpiNode & {
  __typename?: 'BooleanEQAtomKPINode';
  booleanReferenceValue: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  nodeType: KpiNodeType;
  parentNodeID?: Maybe<Scalars['ID']['output']>;
  sdParameterSpecification: Scalars['String']['output'];
};

export type KpiDefinition = {
  __typename?: 'KPIDefinition';
  id: Scalars['ID']['output'];
  nodes: Array<KpiNode>;
  sdTypeSpecification: Scalars['String']['output'];
  userIdentifier: Scalars['String']['output'];
};

export type KpiDefinitionInput = {
  nodes: Array<KpiNodeInput>;
  sdTypeSpecification: Scalars['String']['input'];
  userIdentifier: Scalars['String']['input'];
};

export type KpiFulfillmentCheckResult = {
  __typename?: 'KPIFulfillmentCheckResult';
  fulfilled: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  kpiDefinition: KpiDefinition;
  sdInstance: SdInstance;
};

export type KpiNode = {
  id: Scalars['ID']['output'];
  nodeType: KpiNodeType;
  parentNodeID?: Maybe<Scalars['ID']['output']>;
};

export type KpiNodeInput = {
  booleanReferenceValue?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['ID']['input'];
  logicalOperationType?: InputMaybe<LogicalOperationType>;
  numericReferenceValue?: InputMaybe<Scalars['Float']['input']>;
  parentNodeID?: InputMaybe<Scalars['ID']['input']>;
  sdParameterSpecification?: InputMaybe<Scalars['String']['input']>;
  stringReferenceValue?: InputMaybe<Scalars['String']['input']>;
  type: KpiNodeType;
};

export enum KpiNodeType {
  BooleanEqAtom = 'BooleanEQAtom',
  LogicalOperation = 'LogicalOperation',
  NumericEqAtom = 'NumericEQAtom',
  NumericGeqAtom = 'NumericGEQAtom',
  NumericGtAtom = 'NumericGTAtom',
  NumericLeqAtom = 'NumericLEQAtom',
  NumericLtAtom = 'NumericLTAtom',
  StringEqAtom = 'StringEQAtom'
}

export type LogicalOperationKpiNode = KpiNode & {
  __typename?: 'LogicalOperationKPINode';
  id: Scalars['ID']['output'];
  nodeType: KpiNodeType;
  parentNodeID?: Maybe<Scalars['ID']['output']>;
  type: LogicalOperationType;
};

export enum LogicalOperationType {
  And = 'AND',
  Nor = 'NOR',
  Or = 'OR'
}

export type Mutation = {
  __typename?: 'Mutation';
  createKPIDefinition: KpiDefinition;
  createSDType: SdType;
  deleteSDType: Scalars['Boolean']['output'];
  updateKPIDefinition: KpiDefinition;
  updateSDInstance: SdInstance;
};


export type MutationCreateKpiDefinitionArgs = {
  input: KpiDefinitionInput;
};


export type MutationCreateSdTypeArgs = {
  input: SdTypeInput;
};


export type MutationDeleteSdTypeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateKpiDefinitionArgs = {
  id: Scalars['ID']['input'];
  input: KpiDefinitionInput;
};


export type MutationUpdateSdInstanceArgs = {
  id: Scalars['ID']['input'];
  input: SdInstanceUpdateInput;
};

export type NumericEqAtomKpiNode = AtomKpiNode & KpiNode & {
  __typename?: 'NumericEQAtomKPINode';
  id: Scalars['ID']['output'];
  nodeType: KpiNodeType;
  numericReferenceValue: Scalars['Float']['output'];
  parentNodeID?: Maybe<Scalars['ID']['output']>;
  sdParameterSpecification: Scalars['String']['output'];
};

export type NumericGeqAtomKpiNode = AtomKpiNode & KpiNode & {
  __typename?: 'NumericGEQAtomKPINode';
  id: Scalars['ID']['output'];
  nodeType: KpiNodeType;
  numericReferenceValue: Scalars['Float']['output'];
  parentNodeID?: Maybe<Scalars['ID']['output']>;
  sdParameterSpecification: Scalars['String']['output'];
};

export type NumericGtAtomKpiNode = AtomKpiNode & KpiNode & {
  __typename?: 'NumericGTAtomKPINode';
  id: Scalars['ID']['output'];
  nodeType: KpiNodeType;
  numericReferenceValue: Scalars['Float']['output'];
  parentNodeID?: Maybe<Scalars['ID']['output']>;
  sdParameterSpecification: Scalars['String']['output'];
};

export type NumericLeqAtomKpiNode = AtomKpiNode & KpiNode & {
  __typename?: 'NumericLEQAtomKPINode';
  id: Scalars['ID']['output'];
  nodeType: KpiNodeType;
  numericReferenceValue: Scalars['Float']['output'];
  parentNodeID?: Maybe<Scalars['ID']['output']>;
  sdParameterSpecification: Scalars['String']['output'];
};

export type NumericLtAtomKpiNode = AtomKpiNode & KpiNode & {
  __typename?: 'NumericLTAtomKPINode';
  id: Scalars['ID']['output'];
  nodeType: KpiNodeType;
  numericReferenceValue: Scalars['Float']['output'];
  parentNodeID?: Maybe<Scalars['ID']['output']>;
  sdParameterSpecification: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  kpiDefinition: KpiDefinition;
  kpiDefinitions: Array<KpiDefinition>;
  kpiFulfillmentCheckResults: Array<KpiFulfillmentCheckResult>;
  sdInstances: Array<SdInstance>;
  sdType: SdType;
  sdTypes: Array<SdType>;
};


export type QueryKpiDefinitionArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySdTypeArgs = {
  id: Scalars['ID']['input'];
};

export type SdInstance = {
  __typename?: 'SDInstance';
  confirmedByUser: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  type: SdType;
  uid: Scalars['String']['output'];
  userIdentifier: Scalars['String']['output'];
};

export type SdInstanceUpdateInput = {
  confirmedByUser?: InputMaybe<Scalars['Boolean']['input']>;
  userIdentifier?: InputMaybe<Scalars['String']['input']>;
};

export type SdParameter = {
  __typename?: 'SDParameter';
  denotation: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  type: SdParameterType;
};

export type SdParameterInput = {
  denotation: Scalars['String']['input'];
  type: SdParameterType;
};

export enum SdParameterType {
  Boolean = 'BOOLEAN',
  Number = 'NUMBER',
  String = 'STRING'
}

export type SdType = {
  __typename?: 'SDType';
  denotation: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  parameters: Array<SdParameter>;
};

export type SdTypeInput = {
  denotation: Scalars['String']['input'];
  parameters: Array<SdParameterInput>;
};

export type StringEqAtomKpiNode = AtomKpiNode & KpiNode & {
  __typename?: 'StringEQAtomKPINode';
  id: Scalars['ID']['output'];
  nodeType: KpiNodeType;
  parentNodeID?: Maybe<Scalars['ID']['output']>;
  sdParameterSpecification: Scalars['String']['output'];
  stringReferenceValue: Scalars['String']['output'];
};

export type ConfirmSdInstanceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ConfirmSdInstanceMutation = { __typename?: 'Mutation', updateSDInstance: { __typename?: 'SDInstance', id: string, uid: string, confirmedByUser: boolean, userIdentifier: string, type: { __typename?: 'SDType', id: string, denotation: string, parameters: Array<{ __typename?: 'SDParameter', id: string, denotation: string, type: SdParameterType }> } } };

export type CreateKpiDefinitionMutationVariables = Exact<{
  input: KpiDefinitionInput;
}>;


export type CreateKpiDefinitionMutation = { __typename?: 'Mutation', createKPIDefinition: { __typename?: 'KPIDefinition', id: string } };

export type CreateSdTypeMutationVariables = Exact<{
  input: SdTypeInput;
}>;


export type CreateSdTypeMutation = { __typename?: 'Mutation', createSDType: { __typename?: 'SDType', id: string, denotation: string, parameters: Array<{ __typename?: 'SDParameter', id: string, denotation: string, type: SdParameterType }> } };

export type DeleteSdTypeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteSdTypeMutation = { __typename?: 'Mutation', deleteSDType: boolean };

export type UpdateKpiDefinitionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: KpiDefinitionInput;
}>;


export type UpdateKpiDefinitionMutation = { __typename?: 'Mutation', updateKPIDefinition: { __typename?: 'KPIDefinition', id: string } };

export type UpdateUserIdentifierOfSdInstanceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  newUserIdentifier: Scalars['String']['input'];
}>;


export type UpdateUserIdentifierOfSdInstanceMutation = { __typename?: 'Mutation', updateSDInstance: { __typename?: 'SDInstance', id: string, uid: string, confirmedByUser: boolean, userIdentifier: string, type: { __typename?: 'SDType', id: string, denotation: string, parameters: Array<{ __typename?: 'SDParameter', id: string, denotation: string, type: SdParameterType }> } } };

export type KpiDefinitionDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type KpiDefinitionDetailQuery = { __typename?: 'Query', kpiDefinition: { __typename?: 'KPIDefinition', id: string, userIdentifier: string, sdTypeSpecification: string, nodes: Array<{ __typename?: 'BooleanEQAtomKPINode', id: string, parentNodeID?: string | null, nodeType: KpiNodeType, sdParameterSpecification: string, booleanReferenceValue: boolean } | { __typename?: 'LogicalOperationKPINode', id: string, parentNodeID?: string | null, nodeType: KpiNodeType, type: LogicalOperationType } | { __typename?: 'NumericEQAtomKPINode', id: string, parentNodeID?: string | null, nodeType: KpiNodeType, sdParameterSpecification: string, numericReferenceValue: number } | { __typename?: 'NumericGEQAtomKPINode', id: string, parentNodeID?: string | null, nodeType: KpiNodeType, sdParameterSpecification: string, numericReferenceValue: number } | { __typename?: 'NumericGTAtomKPINode', id: string, parentNodeID?: string | null, nodeType: KpiNodeType, sdParameterSpecification: string, numericReferenceValue: number } | { __typename?: 'NumericLEQAtomKPINode', id: string, parentNodeID?: string | null, nodeType: KpiNodeType, sdParameterSpecification: string, numericReferenceValue: number } | { __typename?: 'NumericLTAtomKPINode', id: string, parentNodeID?: string | null, nodeType: KpiNodeType, sdParameterSpecification: string, numericReferenceValue: number } | { __typename?: 'StringEQAtomKPINode', id: string, parentNodeID?: string | null, nodeType: KpiNodeType, sdParameterSpecification: string, stringReferenceValue: string }> } };

export type KpiDefinitionsQueryVariables = Exact<{ [key: string]: never; }>;


export type KpiDefinitionsQuery = { __typename?: 'Query', kpiDefinitions: Array<{ __typename?: 'KPIDefinition', id: string, userIdentifier: string, sdTypeSpecification: string }> };

export type KpiFulfillmentCheckResultsQueryVariables = Exact<{ [key: string]: never; }>;


export type KpiFulfillmentCheckResultsQuery = { __typename?: 'Query', kpiFulfillmentCheckResults: Array<{ __typename?: 'KPIFulfillmentCheckResult', id: string, fulfilled: boolean, kpiDefinition: { __typename?: 'KPIDefinition', id: string, userIdentifier: string }, sdInstance: { __typename?: 'SDInstance', id: string } }> };

export type SdInstancesPageDataQueryVariables = Exact<{ [key: string]: never; }>;


export type SdInstancesPageDataQuery = { __typename?: 'Query', sdInstances: Array<{ __typename?: 'SDInstance', id: string, uid: string, confirmedByUser: boolean, userIdentifier: string, type: { __typename?: 'SDType', id: string, denotation: string } }>, kpiFulfillmentCheckResults: Array<{ __typename?: 'KPIFulfillmentCheckResult', id: string, fulfilled: boolean, kpiDefinition: { __typename?: 'KPIDefinition', id: string }, sdInstance: { __typename?: 'SDInstance', id: string } }>, kpiDefinitions: Array<{ __typename?: 'KPIDefinition', id: string, userIdentifier: string, sdTypeSpecification: string }> };

export type SdTypesQueryVariables = Exact<{ [key: string]: never; }>;


export type SdTypesQuery = { __typename?: 'Query', sdTypes: Array<{ __typename?: 'SDType', id: string, denotation: string, parameters: Array<{ __typename?: 'SDParameter', id: string, denotation: string, type: SdParameterType }> }> };
