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

export type BooleanEqkpiAtomNode = {
  __typename?: 'BooleanEQKPIAtomNode';
  referenceValue: Scalars['Boolean']['output'];
  sdParameterSpecification: Scalars['String']['output'];
};

export type KpiDefinition = {
  __typename?: 'KPIDefinition';
  rootNode?: Maybe<KpiNode>;
  sdTypeSpecification: Scalars['String']['output'];
  userIdentifier: Scalars['String']['output'];
};

export type KpiNode = BooleanEqkpiAtomNode | LogicalOperationKpiNode | NumericEqkpiAtomNode | NumericGeqkpiAtomNode | NumericGtkpiAtomNode | NumericLeqkpiAtomNode | NumericLtkpiAtomNode | StringEqkpiAtomNode;

export type LogicalOperationKpiNode = {
  __typename?: 'LogicalOperationKPINode';
  childNodes: Array<KpiNode>;
  type: LogicalOperationKpiNodeType;
};

export enum LogicalOperationKpiNodeType {
  And = 'AND',
  Nor = 'NOR',
  Or = 'OR'
}

export type Mutation = {
  __typename?: 'Mutation';
  createSDType: SdType;
  deleteSDType: Scalars['Boolean']['output'];
  updateSDInstance: SdInstance;
};


export type MutationCreateSdTypeArgs = {
  input: SdTypeInput;
};


export type MutationDeleteSdTypeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateSdInstanceArgs = {
  id: Scalars['ID']['input'];
  input: SdInstanceUpdateInput;
};

export type NumericEqkpiAtomNode = {
  __typename?: 'NumericEQKPIAtomNode';
  referenceValue: Scalars['Float']['output'];
  sdParameterSpecification: Scalars['String']['output'];
};

export type NumericGeqkpiAtomNode = {
  __typename?: 'NumericGEQKPIAtomNode';
  referenceValue: Scalars['Float']['output'];
  sdParameterSpecification: Scalars['String']['output'];
};

export type NumericGtkpiAtomNode = {
  __typename?: 'NumericGTKPIAtomNode';
  referenceValue: Scalars['Float']['output'];
  sdParameterSpecification: Scalars['String']['output'];
};

export type NumericLeqkpiAtomNode = {
  __typename?: 'NumericLEQKPIAtomNode';
  referenceValue: Scalars['Float']['output'];
  sdParameterSpecification: Scalars['String']['output'];
};

export type NumericLtkpiAtomNode = {
  __typename?: 'NumericLTKPIAtomNode';
  referenceValue: Scalars['Float']['output'];
  sdParameterSpecification: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  sdInstances: Array<SdInstance>;
  sdType: SdType;
  sdTypes: Array<SdType>;
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

export type StringEqkpiAtomNode = {
  __typename?: 'StringEQKPIAtomNode';
  referenceValue: Scalars['String']['output'];
  sdParameterSpecification: Scalars['String']['output'];
};

export type CreateSdTypeMutationVariables = Exact<{
  input: SdTypeInput;
}>;


export type CreateSdTypeMutation = { __typename?: 'Mutation', createSDType: { __typename?: 'SDType', id: string, denotation: string, parameters: Array<{ __typename?: 'SDParameter', id: string, denotation: string, type: SdParameterType }> } };

export type DeleteSdTypeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteSdTypeMutation = { __typename?: 'Mutation', deleteSDType: boolean };

export type UpdateUserIdentifierOfSdInstanceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  newUserIdentifier: Scalars['String']['input'];
}>;


export type UpdateUserIdentifierOfSdInstanceMutation = { __typename?: 'Mutation', updateSDInstance: { __typename?: 'SDInstance', id: string, uid: string, confirmedByUser: boolean, userIdentifier: string, type: { __typename?: 'SDType', id: string, denotation: string, parameters: Array<{ __typename?: 'SDParameter', id: string, denotation: string, type: SdParameterType }> } } };

export type SdInstancesQueryVariables = Exact<{ [key: string]: never; }>;


export type SdInstancesQuery = { __typename?: 'Query', sdInstances: Array<{ __typename?: 'SDInstance', id: string, uid: string, userIdentifier: string, type: { __typename?: 'SDType', id: string, denotation: string } }> };

export type SdTypesQueryVariables = Exact<{ [key: string]: never; }>;


export type SdTypesQuery = { __typename?: 'Query', sdTypes: Array<{ __typename?: 'SDType', id: string, denotation: string, parameters: Array<{ __typename?: 'SDParameter', id: string, denotation: string, type: SdParameterType }> }>, sdInstances: Array<{ __typename?: 'SDInstance', type: { __typename?: 'SDType', id: string } }> };
