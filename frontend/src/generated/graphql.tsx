import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: number; output: number; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
  JSON: { input: any; output: any; }
};

export type AtomKpiNode = {
  id: Scalars['ID']['output'];
  nodeType: KpiNodeType;
  parentNodeID?: Maybe<Scalars['ID']['output']>;
  sdParameterID: Scalars['ID']['output'];
  sdParameterSpecification: Scalars['String']['output'];
};

export type BooleanEqAtomKpiNode = AtomKpiNode & KpiNode & {
  __typename?: 'BooleanEQAtomKPINode';
  booleanReferenceValue: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  nodeType: KpiNodeType;
  parentNodeID?: Maybe<Scalars['ID']['output']>;
  sdParameterID: Scalars['ID']['output'];
  sdParameterSpecification: Scalars['String']['output'];
};

export type InputData = {
  data: Scalars['JSON']['input'];
  deviceId: Scalars['String']['input'];
  deviceType?: InputMaybe<Scalars['String']['input']>;
  time: Scalars['Date']['input'];
};

export type KpiDefinition = {
  __typename?: 'KPIDefinition';
  id: Scalars['ID']['output'];
  nodes: Array<KpiNode>;
  sdInstanceMode: SdInstanceMode;
  sdTypeID: Scalars['ID']['output'];
  sdTypeSpecification: Scalars['String']['output'];
  selectedSDInstanceUIDs: Array<Scalars['String']['output']>;
  userIdentifier: Scalars['String']['output'];
};

export type KpiDefinitionInput = {
  nodes: Array<KpiNodeInput>;
  sdInstanceMode: SdInstanceMode;
  sdTypeID: Scalars['ID']['input'];
  sdTypeSpecification: Scalars['String']['input'];
  selectedSDInstanceUIDs: Array<Scalars['String']['input']>;
  userIdentifier: Scalars['String']['input'];
};

export type KpiFulfillmentCheckResult = {
  __typename?: 'KPIFulfillmentCheckResult';
  fulfilled: Scalars['Boolean']['output'];
  kpiDefinitionID: Scalars['ID']['output'];
  sdInstanceID: Scalars['ID']['output'];
};

export type KpiFulfillmentCheckResultTuple = {
  __typename?: 'KPIFulfillmentCheckResultTuple';
  kpiFulfillmentCheckResults: Array<KpiFulfillmentCheckResult>;
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
  sdParameterID?: InputMaybe<Scalars['ID']['input']>;
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
  createSDInstanceGroup: SdInstanceGroup;
  createSDType: SdType;
  deleteKPIDefinition: Scalars['Boolean']['output'];
  deleteSDInstanceGroup: Scalars['Boolean']['output'];
  deleteSDType: Scalars['Boolean']['output'];
  deleteUserConfig: Scalars['Boolean']['output'];
  statisticsMutate: Scalars['Boolean']['output'];
  updateKPIDefinition: KpiDefinition;
  updateSDInstance: SdInstance;
  updateSDInstanceGroup: SdInstanceGroup;
  updateUserConfig: UserConfig;
};


export type MutationCreateKpiDefinitionArgs = {
  input: KpiDefinitionInput;
};


export type MutationCreateSdInstanceGroupArgs = {
  input: SdInstanceGroupInput;
};


export type MutationCreateSdTypeArgs = {
  input: SdTypeInput;
};


export type MutationDeleteKpiDefinitionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSdInstanceGroupArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSdTypeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUserConfigArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationStatisticsMutateArgs = {
  inputData: InputData;
};


export type MutationUpdateKpiDefinitionArgs = {
  id: Scalars['ID']['input'];
  input: KpiDefinitionInput;
};


export type MutationUpdateSdInstanceArgs = {
  id: Scalars['ID']['input'];
  input: SdInstanceUpdateInput;
};


export type MutationUpdateSdInstanceGroupArgs = {
  id: Scalars['ID']['input'];
  input: SdInstanceGroupInput;
};


export type MutationUpdateUserConfigArgs = {
  input: UserConfigInput;
  userId: Scalars['ID']['input'];
};

export type NumericEqAtomKpiNode = AtomKpiNode & KpiNode & {
  __typename?: 'NumericEQAtomKPINode';
  id: Scalars['ID']['output'];
  nodeType: KpiNodeType;
  numericReferenceValue: Scalars['Float']['output'];
  parentNodeID?: Maybe<Scalars['ID']['output']>;
  sdParameterID: Scalars['ID']['output'];
  sdParameterSpecification: Scalars['String']['output'];
};

export type NumericGeqAtomKpiNode = AtomKpiNode & KpiNode & {
  __typename?: 'NumericGEQAtomKPINode';
  id: Scalars['ID']['output'];
  nodeType: KpiNodeType;
  numericReferenceValue: Scalars['Float']['output'];
  parentNodeID?: Maybe<Scalars['ID']['output']>;
  sdParameterID: Scalars['ID']['output'];
  sdParameterSpecification: Scalars['String']['output'];
};

export type NumericGtAtomKpiNode = AtomKpiNode & KpiNode & {
  __typename?: 'NumericGTAtomKPINode';
  id: Scalars['ID']['output'];
  nodeType: KpiNodeType;
  numericReferenceValue: Scalars['Float']['output'];
  parentNodeID?: Maybe<Scalars['ID']['output']>;
  sdParameterID: Scalars['ID']['output'];
  sdParameterSpecification: Scalars['String']['output'];
};

export type NumericLeqAtomKpiNode = AtomKpiNode & KpiNode & {
  __typename?: 'NumericLEQAtomKPINode';
  id: Scalars['ID']['output'];
  nodeType: KpiNodeType;
  numericReferenceValue: Scalars['Float']['output'];
  parentNodeID?: Maybe<Scalars['ID']['output']>;
  sdParameterID: Scalars['ID']['output'];
  sdParameterSpecification: Scalars['String']['output'];
};

export type NumericLtAtomKpiNode = AtomKpiNode & KpiNode & {
  __typename?: 'NumericLTAtomKPINode';
  id: Scalars['ID']['output'];
  nodeType: KpiNodeType;
  numericReferenceValue: Scalars['Float']['output'];
  parentNodeID?: Maybe<Scalars['ID']['output']>;
  sdParameterID: Scalars['ID']['output'];
  sdParameterSpecification: Scalars['String']['output'];
};

export type OutputData = {
  __typename?: 'OutputData';
  data: Scalars['JSON']['output'];
  deviceId: Scalars['String']['output'];
  deviceType?: Maybe<Scalars['String']['output']>;
  time: Scalars['Date']['output'];
};

export type Query = {
  __typename?: 'Query';
  kpiDefinition: KpiDefinition;
  kpiDefinitions: Array<KpiDefinition>;
  kpiFulfillmentCheckResults: Array<KpiFulfillmentCheckResult>;
  sdInstanceGroup: SdInstanceGroup;
  sdInstanceGroups: Array<SdInstanceGroup>;
  sdInstances: Array<SdInstance>;
  sdType: SdType;
  sdTypes: Array<SdType>;
  statisticsQuerySensorsWithFields: Array<OutputData>;
  statisticsQuerySimpleSensors: Array<OutputData>;
  userConfig: UserConfig;
};


export type QueryKpiDefinitionArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySdInstanceGroupArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySdTypeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryStatisticsQuerySensorsWithFieldsArgs = {
  request?: InputMaybe<StatisticsInput>;
  sensors: SensorsWithFields;
};


export type QueryStatisticsQuerySimpleSensorsArgs = {
  request?: InputMaybe<StatisticsInput>;
  sensors: SimpleSensors;
};


export type QueryUserConfigArgs = {
  id: Scalars['ID']['input'];
};

export type SdCommandInvocation = {
  __typename?: 'SDCommandInvocation';
  commandId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  invocationTime: Scalars['String']['output'];
  payload: Scalars['String']['output'];
  sdInstanceId: Scalars['ID']['output'];
  userId: Scalars['ID']['output'];
};

export type SdInstance = {
  __typename?: 'SDInstance';
  commandInvocations: Array<SdCommandInvocation>;
  confirmedByUser: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  type: SdType;
  uid: Scalars['String']['output'];
  userIdentifier: Scalars['String']['output'];
};

export type SdInstanceGroup = {
  __typename?: 'SDInstanceGroup';
  id: Scalars['ID']['output'];
  sdInstanceIDs: Array<Scalars['ID']['output']>;
  userIdentifier: Scalars['String']['output'];
};

export type SdInstanceGroupInput = {
  sdInstanceIDs: Array<Scalars['ID']['input']>;
  userIdentifier: Scalars['String']['input'];
};

export enum SdInstanceMode {
  All = 'ALL',
  Selected = 'SELECTED'
}

export type SdInstanceUpdateInput = {
  confirmedByUser?: InputMaybe<Scalars['Boolean']['input']>;
  userIdentifier?: InputMaybe<Scalars['String']['input']>;
};

export type SdParameter = {
  __typename?: 'SDParameter';
  denotation: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  label?: Maybe<Scalars['String']['output']>;
  type: SdParameterType;
};

export type SdParameterInput = {
  denotation: Scalars['String']['input'];
  label?: InputMaybe<Scalars['String']['input']>;
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
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  label?: Maybe<Scalars['String']['output']>;
  parameters: Array<SdParameter>;
};

export type SdTypeInput = {
  denotation: Scalars['String']['input'];
  icon?: InputMaybe<Scalars['String']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  parameters: Array<SdParameterInput>;
};

export type SensorField = {
  key: Scalars['String']['input'];
  values: Array<Scalars['String']['input']>;
};

export type SensorsWithFields = {
  sensors: Array<SensorField>;
};

export type SimpleSensors = {
  sensors: Array<Scalars['String']['input']>;
};

/** Data used for querying the selected bucket */
export type StatisticsInput = {
  /**
   * Amount of minutes to aggregate by
   * For example if the queried range has 1 hour and aggregateMinutes is set to 10 the aggregation will result in 6 points
   */
  aggregateMinutes?: InputMaybe<Scalars['Int']['input']>;
  /** Start of the querying window */
  from?: InputMaybe<Scalars['Date']['input']>;
  /** Aggregation operator to use, if needed */
  operation?: InputMaybe<StatisticsOperation>;
  /**
   * Timezone override default UTC.
   * For more details why and how this affects queries see: https://www.influxdata.com/blog/time-zones-in-flux/.
   * In most cases you can ignore this and some edge aggregations can be influenced.
   * If you need a precise result or the aggregation uses high amount of minutes provide the target time zone.
   */
  timezone?: InputMaybe<Scalars['String']['input']>;
  /** End of the querying window */
  to?: InputMaybe<Scalars['Date']['input']>;
};

export enum StatisticsOperation {
  Count = 'count',
  First = 'first',
  Integral = 'integral',
  Last = 'last',
  Max = 'max',
  Mean = 'mean',
  Median = 'median',
  Min = 'min',
  Mode = 'mode',
  None = 'none',
  Quantile = 'quantile',
  Reduce = 'reduce',
  Skew = 'skew',
  Spread = 'spread',
  Stddev = 'stddev',
  Sum = 'sum',
  Timeweightedavg = 'timeweightedavg'
}

export type StringEqAtomKpiNode = AtomKpiNode & KpiNode & {
  __typename?: 'StringEQAtomKPINode';
  id: Scalars['ID']['output'];
  nodeType: KpiNodeType;
  parentNodeID?: Maybe<Scalars['ID']['output']>;
  sdParameterID: Scalars['ID']['output'];
  sdParameterSpecification: Scalars['String']['output'];
  stringReferenceValue: Scalars['String']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  onKPIFulfillmentChecked: KpiFulfillmentCheckResultTuple;
  onSDInstanceRegistered: SdInstance;
};

export type UserConfig = {
  __typename?: 'UserConfig';
  config: Scalars['JSON']['output'];
  userId: Scalars['ID']['output'];
};

export type UserConfigInput = {
  config: Scalars['JSON']['input'];
};

export type DeleteSdTypeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteSdTypeMutation = { __typename?: 'Mutation', deleteSDType: boolean };

export type CreateSdTypeMutationVariables = Exact<{
  input: SdTypeInput;
}>;


export type CreateSdTypeMutation = { __typename?: 'Mutation', createSDType: { __typename?: 'SDType', denotation: string, icon?: string | null, id: number, label?: string | null, parameters: Array<{ __typename?: 'SDParameter', denotation: string, id: number, label?: string | null, type: SdParameterType }> } };

export type CreateKpiDefinitionMutationVariables = Exact<{
  input: KpiDefinitionInput;
}>;


export type CreateKpiDefinitionMutation = { __typename?: 'Mutation', createKPIDefinition: { __typename?: 'KPIDefinition', id: number } };

export type UpdateKpiDefinitionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: KpiDefinitionInput;
}>;


export type UpdateKpiDefinitionMutation = { __typename?: 'Mutation', updateKPIDefinition: { __typename?: 'KPIDefinition', id: number } };

export type DeleteKpiDefinitionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteKpiDefinitionMutation = { __typename?: 'Mutation', deleteKPIDefinition: boolean };

export type SdInstancesQueryVariables = Exact<{ [key: string]: never; }>;


export type SdInstancesQuery = { __typename?: 'Query', sdInstances: Array<{ __typename?: 'SDInstance', id: number, uid: string, confirmedByUser: boolean, userIdentifier: string, type: { __typename?: 'SDType', id: number, denotation: string } }> };

export type SdTypeQueryVariables = Exact<{
  sdTypeId: Scalars['ID']['input'];
}>;


export type SdTypeQuery = { __typename?: 'Query', sdType: { __typename?: 'SDType', id: number, denotation: string, label?: string | null, icon?: string | null, parameters: Array<{ __typename?: 'SDParameter', id: number, label?: string | null, denotation: string, type: SdParameterType }> } };

export type SdTypesQueryVariables = Exact<{ [key: string]: never; }>;


export type SdTypesQuery = { __typename?: 'Query', sdTypes: Array<{ __typename?: 'SDType', id: number, denotation: string, label?: string | null, icon?: string | null, parameters: Array<{ __typename?: 'SDParameter', id: number, label?: string | null, denotation: string, type: SdParameterType }> }> };

export type StatisticsQuerySensorsWithFieldsQueryVariables = Exact<{
  sensors: SensorsWithFields;
  request?: InputMaybe<StatisticsInput>;
}>;


export type StatisticsQuerySensorsWithFieldsQuery = { __typename?: 'Query', statisticsQuerySensorsWithFields: Array<{ __typename?: 'OutputData', data: any, time: any, deviceId: string }> };

export type KpiDefinitionsQueryVariables = Exact<{ [key: string]: never; }>;


export type KpiDefinitionsQuery = { __typename?: 'Query', kpiDefinitions: Array<{ __typename?: 'KPIDefinition', id: number, userIdentifier: string, sdTypeID: number, sdTypeSpecification: string, sdInstanceMode: SdInstanceMode, selectedSDInstanceUIDs: Array<string> }> };

export type KpiDefinitionDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type KpiDefinitionDetailQuery = { __typename?: 'Query', kpiDefinition: { __typename?: 'KPIDefinition', id: number, userIdentifier: string, sdTypeID: number, sdTypeSpecification: string, sdInstanceMode: SdInstanceMode, selectedSDInstanceUIDs: Array<string>, nodes: Array<{ __typename?: 'BooleanEQAtomKPINode', id: number, parentNodeID?: number | null, nodeType: KpiNodeType, sdParameterID: number, sdParameterSpecification: string, booleanReferenceValue: boolean } | { __typename?: 'LogicalOperationKPINode', id: number, parentNodeID?: number | null, nodeType: KpiNodeType, type: LogicalOperationType } | { __typename?: 'NumericEQAtomKPINode', id: number, parentNodeID?: number | null, nodeType: KpiNodeType, sdParameterID: number, sdParameterSpecification: string, numericReferenceValue: number } | { __typename?: 'NumericGEQAtomKPINode', id: number, parentNodeID?: number | null, nodeType: KpiNodeType, sdParameterID: number, sdParameterSpecification: string, numericReferenceValue: number } | { __typename?: 'NumericGTAtomKPINode', id: number, parentNodeID?: number | null, nodeType: KpiNodeType, sdParameterID: number, sdParameterSpecification: string, numericReferenceValue: number } | { __typename?: 'NumericLEQAtomKPINode', id: number, parentNodeID?: number | null, nodeType: KpiNodeType, sdParameterID: number, sdParameterSpecification: string, numericReferenceValue: number } | { __typename?: 'NumericLTAtomKPINode', id: number, parentNodeID?: number | null, nodeType: KpiNodeType, sdParameterID: number, sdParameterSpecification: string, numericReferenceValue: number } | { __typename?: 'StringEQAtomKPINode', id: number, parentNodeID?: number | null, nodeType: KpiNodeType, sdParameterID: number, sdParameterSpecification: string, stringReferenceValue: string }> } };

export type RestOfKpiDefinitionDetailPageDataQueryVariables = Exact<{ [key: string]: never; }>;


export type RestOfKpiDefinitionDetailPageDataQuery = { __typename?: 'Query', sdTypes: Array<{ __typename?: 'SDType', id: number, denotation: string, parameters: Array<{ __typename?: 'SDParameter', id: number, denotation: string, type: SdParameterType }> }>, sdInstances: Array<{ __typename?: 'SDInstance', id: number, uid: string, confirmedByUser: boolean, userIdentifier: string, type: { __typename?: 'SDType', id: number } }> };


export const DeleteSdTypeDocument = gql`
    mutation DeleteSDType($id: ID!) {
  deleteSDType(id: $id)
}
    `;
export type DeleteSdTypeMutationFn = Apollo.MutationFunction<DeleteSdTypeMutation, DeleteSdTypeMutationVariables>;

/**
 * __useDeleteSdTypeMutation__
 *
 * To run a mutation, you first call `useDeleteSdTypeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteSdTypeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteSdTypeMutation, { data, loading, error }] = useDeleteSdTypeMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteSdTypeMutation(baseOptions?: Apollo.MutationHookOptions<DeleteSdTypeMutation, DeleteSdTypeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteSdTypeMutation, DeleteSdTypeMutationVariables>(DeleteSdTypeDocument, options);
      }
export type DeleteSdTypeMutationHookResult = ReturnType<typeof useDeleteSdTypeMutation>;
export type DeleteSdTypeMutationResult = Apollo.MutationResult<DeleteSdTypeMutation>;
export type DeleteSdTypeMutationOptions = Apollo.BaseMutationOptions<DeleteSdTypeMutation, DeleteSdTypeMutationVariables>;
export const CreateSdTypeDocument = gql`
    mutation CreateSDType($input: SDTypeInput!) {
  createSDType(input: $input) {
    denotation
    icon
    id
    label
    parameters {
      denotation
      id
      label
      type
    }
  }
}
    `;
export type CreateSdTypeMutationFn = Apollo.MutationFunction<CreateSdTypeMutation, CreateSdTypeMutationVariables>;

/**
 * __useCreateSdTypeMutation__
 *
 * To run a mutation, you first call `useCreateSdTypeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateSdTypeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createSdTypeMutation, { data, loading, error }] = useCreateSdTypeMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateSdTypeMutation(baseOptions?: Apollo.MutationHookOptions<CreateSdTypeMutation, CreateSdTypeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateSdTypeMutation, CreateSdTypeMutationVariables>(CreateSdTypeDocument, options);
      }
export type CreateSdTypeMutationHookResult = ReturnType<typeof useCreateSdTypeMutation>;
export type CreateSdTypeMutationResult = Apollo.MutationResult<CreateSdTypeMutation>;
export type CreateSdTypeMutationOptions = Apollo.BaseMutationOptions<CreateSdTypeMutation, CreateSdTypeMutationVariables>;
export const CreateKpiDefinitionDocument = gql`
    mutation createKPIDefinition($input: KPIDefinitionInput!) {
  createKPIDefinition(input: $input) {
    id
  }
}
    `;
export type CreateKpiDefinitionMutationFn = Apollo.MutationFunction<CreateKpiDefinitionMutation, CreateKpiDefinitionMutationVariables>;

/**
 * __useCreateKpiDefinitionMutation__
 *
 * To run a mutation, you first call `useCreateKpiDefinitionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateKpiDefinitionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createKpiDefinitionMutation, { data, loading, error }] = useCreateKpiDefinitionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateKpiDefinitionMutation(baseOptions?: Apollo.MutationHookOptions<CreateKpiDefinitionMutation, CreateKpiDefinitionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateKpiDefinitionMutation, CreateKpiDefinitionMutationVariables>(CreateKpiDefinitionDocument, options);
      }
export type CreateKpiDefinitionMutationHookResult = ReturnType<typeof useCreateKpiDefinitionMutation>;
export type CreateKpiDefinitionMutationResult = Apollo.MutationResult<CreateKpiDefinitionMutation>;
export type CreateKpiDefinitionMutationOptions = Apollo.BaseMutationOptions<CreateKpiDefinitionMutation, CreateKpiDefinitionMutationVariables>;
export const UpdateKpiDefinitionDocument = gql`
    mutation updateKPIDefinition($id: ID!, $input: KPIDefinitionInput!) {
  updateKPIDefinition(id: $id, input: $input) {
    id
  }
}
    `;
export type UpdateKpiDefinitionMutationFn = Apollo.MutationFunction<UpdateKpiDefinitionMutation, UpdateKpiDefinitionMutationVariables>;

/**
 * __useUpdateKpiDefinitionMutation__
 *
 * To run a mutation, you first call `useUpdateKpiDefinitionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateKpiDefinitionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateKpiDefinitionMutation, { data, loading, error }] = useUpdateKpiDefinitionMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateKpiDefinitionMutation(baseOptions?: Apollo.MutationHookOptions<UpdateKpiDefinitionMutation, UpdateKpiDefinitionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateKpiDefinitionMutation, UpdateKpiDefinitionMutationVariables>(UpdateKpiDefinitionDocument, options);
      }
export type UpdateKpiDefinitionMutationHookResult = ReturnType<typeof useUpdateKpiDefinitionMutation>;
export type UpdateKpiDefinitionMutationResult = Apollo.MutationResult<UpdateKpiDefinitionMutation>;
export type UpdateKpiDefinitionMutationOptions = Apollo.BaseMutationOptions<UpdateKpiDefinitionMutation, UpdateKpiDefinitionMutationVariables>;
export const DeleteKpiDefinitionDocument = gql`
    mutation DeleteKPIDefinition($id: ID!) {
  deleteKPIDefinition(id: $id)
}
    `;
export type DeleteKpiDefinitionMutationFn = Apollo.MutationFunction<DeleteKpiDefinitionMutation, DeleteKpiDefinitionMutationVariables>;

/**
 * __useDeleteKpiDefinitionMutation__
 *
 * To run a mutation, you first call `useDeleteKpiDefinitionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteKpiDefinitionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteKpiDefinitionMutation, { data, loading, error }] = useDeleteKpiDefinitionMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteKpiDefinitionMutation(baseOptions?: Apollo.MutationHookOptions<DeleteKpiDefinitionMutation, DeleteKpiDefinitionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteKpiDefinitionMutation, DeleteKpiDefinitionMutationVariables>(DeleteKpiDefinitionDocument, options);
      }
export type DeleteKpiDefinitionMutationHookResult = ReturnType<typeof useDeleteKpiDefinitionMutation>;
export type DeleteKpiDefinitionMutationResult = Apollo.MutationResult<DeleteKpiDefinitionMutation>;
export type DeleteKpiDefinitionMutationOptions = Apollo.BaseMutationOptions<DeleteKpiDefinitionMutation, DeleteKpiDefinitionMutationVariables>;
export const SdInstancesDocument = gql`
    query SdInstances {
  sdInstances {
    id
    uid
    confirmedByUser
    userIdentifier
    type {
      id
      denotation
    }
  }
}
    `;

/**
 * __useSdInstancesQuery__
 *
 * To run a query within a React component, call `useSdInstancesQuery` and pass it any options that fit your needs.
 * When your component renders, `useSdInstancesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSdInstancesQuery({
 *   variables: {
 *   },
 * });
 */
export function useSdInstancesQuery(baseOptions?: Apollo.QueryHookOptions<SdInstancesQuery, SdInstancesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SdInstancesQuery, SdInstancesQueryVariables>(SdInstancesDocument, options);
      }
export function useSdInstancesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SdInstancesQuery, SdInstancesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SdInstancesQuery, SdInstancesQueryVariables>(SdInstancesDocument, options);
        }
export function useSdInstancesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SdInstancesQuery, SdInstancesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SdInstancesQuery, SdInstancesQueryVariables>(SdInstancesDocument, options);
        }
export type SdInstancesQueryHookResult = ReturnType<typeof useSdInstancesQuery>;
export type SdInstancesLazyQueryHookResult = ReturnType<typeof useSdInstancesLazyQuery>;
export type SdInstancesSuspenseQueryHookResult = ReturnType<typeof useSdInstancesSuspenseQuery>;
export type SdInstancesQueryResult = Apollo.QueryResult<SdInstancesQuery, SdInstancesQueryVariables>;
export const SdTypeDocument = gql`
    query SdType($sdTypeId: ID!) {
  sdType(id: $sdTypeId) {
    id
    denotation
    label
    icon
    parameters {
      id
      label
      denotation
      type
    }
  }
}
    `;

/**
 * __useSdTypeQuery__
 *
 * To run a query within a React component, call `useSdTypeQuery` and pass it any options that fit your needs.
 * When your component renders, `useSdTypeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSdTypeQuery({
 *   variables: {
 *      sdTypeId: // value for 'sdTypeId'
 *   },
 * });
 */
export function useSdTypeQuery(baseOptions: Apollo.QueryHookOptions<SdTypeQuery, SdTypeQueryVariables> & ({ variables: SdTypeQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SdTypeQuery, SdTypeQueryVariables>(SdTypeDocument, options);
      }
export function useSdTypeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SdTypeQuery, SdTypeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SdTypeQuery, SdTypeQueryVariables>(SdTypeDocument, options);
        }
export function useSdTypeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SdTypeQuery, SdTypeQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SdTypeQuery, SdTypeQueryVariables>(SdTypeDocument, options);
        }
export type SdTypeQueryHookResult = ReturnType<typeof useSdTypeQuery>;
export type SdTypeLazyQueryHookResult = ReturnType<typeof useSdTypeLazyQuery>;
export type SdTypeSuspenseQueryHookResult = ReturnType<typeof useSdTypeSuspenseQuery>;
export type SdTypeQueryResult = Apollo.QueryResult<SdTypeQuery, SdTypeQueryVariables>;
export const SdTypesDocument = gql`
    query SDTypes {
  sdTypes {
    id
    denotation
    label
    icon
    parameters {
      id
      label
      denotation
      type
    }
  }
}
    `;

/**
 * __useSdTypesQuery__
 *
 * To run a query within a React component, call `useSdTypesQuery` and pass it any options that fit your needs.
 * When your component renders, `useSdTypesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSdTypesQuery({
 *   variables: {
 *   },
 * });
 */
export function useSdTypesQuery(baseOptions?: Apollo.QueryHookOptions<SdTypesQuery, SdTypesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SdTypesQuery, SdTypesQueryVariables>(SdTypesDocument, options);
      }
export function useSdTypesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SdTypesQuery, SdTypesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SdTypesQuery, SdTypesQueryVariables>(SdTypesDocument, options);
        }
export function useSdTypesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SdTypesQuery, SdTypesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SdTypesQuery, SdTypesQueryVariables>(SdTypesDocument, options);
        }
export type SdTypesQueryHookResult = ReturnType<typeof useSdTypesQuery>;
export type SdTypesLazyQueryHookResult = ReturnType<typeof useSdTypesLazyQuery>;
export type SdTypesSuspenseQueryHookResult = ReturnType<typeof useSdTypesSuspenseQuery>;
export type SdTypesQueryResult = Apollo.QueryResult<SdTypesQuery, SdTypesQueryVariables>;
export const StatisticsQuerySensorsWithFieldsDocument = gql`
    query StatisticsQuerySensorsWithFields($sensors: SensorsWithFields!, $request: StatisticsInput) {
  statisticsQuerySensorsWithFields(sensors: $sensors, request: $request) {
    data
    time
    deviceId
  }
}
    `;

/**
 * __useStatisticsQuerySensorsWithFieldsQuery__
 *
 * To run a query within a React component, call `useStatisticsQuerySensorsWithFieldsQuery` and pass it any options that fit your needs.
 * When your component renders, `useStatisticsQuerySensorsWithFieldsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useStatisticsQuerySensorsWithFieldsQuery({
 *   variables: {
 *      sensors: // value for 'sensors'
 *      request: // value for 'request'
 *   },
 * });
 */
export function useStatisticsQuerySensorsWithFieldsQuery(baseOptions: Apollo.QueryHookOptions<StatisticsQuerySensorsWithFieldsQuery, StatisticsQuerySensorsWithFieldsQueryVariables> & ({ variables: StatisticsQuerySensorsWithFieldsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<StatisticsQuerySensorsWithFieldsQuery, StatisticsQuerySensorsWithFieldsQueryVariables>(StatisticsQuerySensorsWithFieldsDocument, options);
      }
export function useStatisticsQuerySensorsWithFieldsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<StatisticsQuerySensorsWithFieldsQuery, StatisticsQuerySensorsWithFieldsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<StatisticsQuerySensorsWithFieldsQuery, StatisticsQuerySensorsWithFieldsQueryVariables>(StatisticsQuerySensorsWithFieldsDocument, options);
        }
export function useStatisticsQuerySensorsWithFieldsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<StatisticsQuerySensorsWithFieldsQuery, StatisticsQuerySensorsWithFieldsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<StatisticsQuerySensorsWithFieldsQuery, StatisticsQuerySensorsWithFieldsQueryVariables>(StatisticsQuerySensorsWithFieldsDocument, options);
        }
export type StatisticsQuerySensorsWithFieldsQueryHookResult = ReturnType<typeof useStatisticsQuerySensorsWithFieldsQuery>;
export type StatisticsQuerySensorsWithFieldsLazyQueryHookResult = ReturnType<typeof useStatisticsQuerySensorsWithFieldsLazyQuery>;
export type StatisticsQuerySensorsWithFieldsSuspenseQueryHookResult = ReturnType<typeof useStatisticsQuerySensorsWithFieldsSuspenseQuery>;
export type StatisticsQuerySensorsWithFieldsQueryResult = Apollo.QueryResult<StatisticsQuerySensorsWithFieldsQuery, StatisticsQuerySensorsWithFieldsQueryVariables>;
export const KpiDefinitionsDocument = gql`
    query KPIDefinitions {
  kpiDefinitions {
    id
    userIdentifier
    sdTypeID
    sdTypeSpecification
    sdInstanceMode
    selectedSDInstanceUIDs
  }
}
    `;

/**
 * __useKpiDefinitionsQuery__
 *
 * To run a query within a React component, call `useKpiDefinitionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useKpiDefinitionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useKpiDefinitionsQuery({
 *   variables: {
 *   },
 * });
 */
export function useKpiDefinitionsQuery(baseOptions?: Apollo.QueryHookOptions<KpiDefinitionsQuery, KpiDefinitionsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<KpiDefinitionsQuery, KpiDefinitionsQueryVariables>(KpiDefinitionsDocument, options);
      }
export function useKpiDefinitionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<KpiDefinitionsQuery, KpiDefinitionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<KpiDefinitionsQuery, KpiDefinitionsQueryVariables>(KpiDefinitionsDocument, options);
        }
export function useKpiDefinitionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<KpiDefinitionsQuery, KpiDefinitionsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<KpiDefinitionsQuery, KpiDefinitionsQueryVariables>(KpiDefinitionsDocument, options);
        }
export type KpiDefinitionsQueryHookResult = ReturnType<typeof useKpiDefinitionsQuery>;
export type KpiDefinitionsLazyQueryHookResult = ReturnType<typeof useKpiDefinitionsLazyQuery>;
export type KpiDefinitionsSuspenseQueryHookResult = ReturnType<typeof useKpiDefinitionsSuspenseQuery>;
export type KpiDefinitionsQueryResult = Apollo.QueryResult<KpiDefinitionsQuery, KpiDefinitionsQueryVariables>;
export const KpiDefinitionDetailDocument = gql`
    query KPIDefinitionDetail($id: ID!) {
  kpiDefinition(id: $id) {
    id
    userIdentifier
    sdTypeID
    sdTypeSpecification
    sdInstanceMode
    selectedSDInstanceUIDs
    nodes {
      ... on LogicalOperationKPINode {
        id
        parentNodeID
        nodeType
        type
      }
      ... on BooleanEQAtomKPINode {
        id
        parentNodeID
        nodeType
        sdParameterID
        sdParameterSpecification
        booleanReferenceValue
      }
      ... on NumericEQAtomKPINode {
        id
        parentNodeID
        nodeType
        sdParameterID
        sdParameterSpecification
        numericReferenceValue
      }
      ... on NumericGEQAtomKPINode {
        id
        parentNodeID
        nodeType
        sdParameterID
        sdParameterSpecification
        numericReferenceValue
      }
      ... on NumericGTAtomKPINode {
        id
        parentNodeID
        nodeType
        sdParameterID
        sdParameterSpecification
        numericReferenceValue
      }
      ... on NumericLEQAtomKPINode {
        id
        parentNodeID
        nodeType
        sdParameterID
        sdParameterSpecification
        numericReferenceValue
      }
      ... on NumericLTAtomKPINode {
        id
        parentNodeID
        nodeType
        sdParameterID
        sdParameterSpecification
        numericReferenceValue
      }
      ... on StringEQAtomKPINode {
        id
        parentNodeID
        nodeType
        sdParameterID
        sdParameterSpecification
        stringReferenceValue
      }
    }
  }
}
    `;

/**
 * __useKpiDefinitionDetailQuery__
 *
 * To run a query within a React component, call `useKpiDefinitionDetailQuery` and pass it any options that fit your needs.
 * When your component renders, `useKpiDefinitionDetailQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useKpiDefinitionDetailQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useKpiDefinitionDetailQuery(baseOptions: Apollo.QueryHookOptions<KpiDefinitionDetailQuery, KpiDefinitionDetailQueryVariables> & ({ variables: KpiDefinitionDetailQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<KpiDefinitionDetailQuery, KpiDefinitionDetailQueryVariables>(KpiDefinitionDetailDocument, options);
      }
export function useKpiDefinitionDetailLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<KpiDefinitionDetailQuery, KpiDefinitionDetailQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<KpiDefinitionDetailQuery, KpiDefinitionDetailQueryVariables>(KpiDefinitionDetailDocument, options);
        }
export function useKpiDefinitionDetailSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<KpiDefinitionDetailQuery, KpiDefinitionDetailQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<KpiDefinitionDetailQuery, KpiDefinitionDetailQueryVariables>(KpiDefinitionDetailDocument, options);
        }
export type KpiDefinitionDetailQueryHookResult = ReturnType<typeof useKpiDefinitionDetailQuery>;
export type KpiDefinitionDetailLazyQueryHookResult = ReturnType<typeof useKpiDefinitionDetailLazyQuery>;
export type KpiDefinitionDetailSuspenseQueryHookResult = ReturnType<typeof useKpiDefinitionDetailSuspenseQuery>;
export type KpiDefinitionDetailQueryResult = Apollo.QueryResult<KpiDefinitionDetailQuery, KpiDefinitionDetailQueryVariables>;
export const RestOfKpiDefinitionDetailPageDataDocument = gql`
    query RestOfKPIDefinitionDetailPageData {
  sdTypes {
    id
    denotation
    parameters {
      id
      denotation
      type
    }
  }
  sdInstances {
    id
    uid
    confirmedByUser
    userIdentifier
    type {
      id
    }
  }
}
    `;

/**
 * __useRestOfKpiDefinitionDetailPageDataQuery__
 *
 * To run a query within a React component, call `useRestOfKpiDefinitionDetailPageDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useRestOfKpiDefinitionDetailPageDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRestOfKpiDefinitionDetailPageDataQuery({
 *   variables: {
 *   },
 * });
 */
export function useRestOfKpiDefinitionDetailPageDataQuery(baseOptions?: Apollo.QueryHookOptions<RestOfKpiDefinitionDetailPageDataQuery, RestOfKpiDefinitionDetailPageDataQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<RestOfKpiDefinitionDetailPageDataQuery, RestOfKpiDefinitionDetailPageDataQueryVariables>(RestOfKpiDefinitionDetailPageDataDocument, options);
      }
export function useRestOfKpiDefinitionDetailPageDataLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<RestOfKpiDefinitionDetailPageDataQuery, RestOfKpiDefinitionDetailPageDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<RestOfKpiDefinitionDetailPageDataQuery, RestOfKpiDefinitionDetailPageDataQueryVariables>(RestOfKpiDefinitionDetailPageDataDocument, options);
        }
export function useRestOfKpiDefinitionDetailPageDataSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<RestOfKpiDefinitionDetailPageDataQuery, RestOfKpiDefinitionDetailPageDataQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<RestOfKpiDefinitionDetailPageDataQuery, RestOfKpiDefinitionDetailPageDataQueryVariables>(RestOfKpiDefinitionDetailPageDataDocument, options);
        }
export type RestOfKpiDefinitionDetailPageDataQueryHookResult = ReturnType<typeof useRestOfKpiDefinitionDetailPageDataQuery>;
export type RestOfKpiDefinitionDetailPageDataLazyQueryHookResult = ReturnType<typeof useRestOfKpiDefinitionDetailPageDataLazyQuery>;
export type RestOfKpiDefinitionDetailPageDataSuspenseQueryHookResult = ReturnType<typeof useRestOfKpiDefinitionDetailPageDataSuspenseQuery>;
export type RestOfKpiDefinitionDetailPageDataQueryResult = Apollo.QueryResult<RestOfKpiDefinitionDetailPageDataQuery, RestOfKpiDefinitionDetailPageDataQueryVariables>;