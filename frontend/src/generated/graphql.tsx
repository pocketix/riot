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
  createSDCommand: SdCommand;
  createSDCommandInvocation: SdCommandInvocation;
  createSDInstanceGroup: SdInstanceGroup;
  createSDType: SdType;
  deleteKPIDefinition: Scalars['Boolean']['output'];
  deleteSDCommand: Scalars['Boolean']['output'];
  deleteSDInstanceGroup: Scalars['Boolean']['output'];
  deleteSDType: Scalars['Boolean']['output'];
  deleteUserConfig: Scalars['Boolean']['output'];
  invokeSDCommand: Scalars['Boolean']['output'];
  statisticsMutate: Scalars['Boolean']['output'];
  updateKPIDefinition: KpiDefinition;
  updateSDCommand: SdCommand;
  updateSDInstance: SdInstance;
  updateSDInstanceGroup: SdInstanceGroup;
  updateUserConfig: UserConfig;
};


export type MutationCreateKpiDefinitionArgs = {
  input: KpiDefinitionInput;
};


export type MutationCreateSdCommandArgs = {
  input: SdCommandInput;
};


export type MutationCreateSdCommandInvocationArgs = {
  input: SdCommandInvocationInput;
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


export type MutationDeleteSdCommandArgs = {
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


export type MutationInvokeSdCommandArgs = {
  id: Scalars['ID']['input'];
};


export type MutationStatisticsMutateArgs = {
  inputData: InputData;
};


export type MutationUpdateKpiDefinitionArgs = {
  id: Scalars['ID']['input'];
  input: KpiDefinitionInput;
};


export type MutationUpdateSdCommandArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
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
  sdCommand: SdCommand;
  sdCommandInvocation: SdCommandInvocation;
  sdCommandInvocations: Array<SdCommandInvocation>;
  sdCommands: Array<SdCommand>;
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


export type QuerySdCommandArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySdCommandInvocationArgs = {
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

export type SdCommand = {
  __typename?: 'SDCommand';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  sdTypeId: Scalars['ID']['output'];
};

export type SdCommandInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  sdTypeId: Scalars['ID']['input'];
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

export type SdCommandInvocationInput = {
  commandId: Scalars['ID']['input'];
  invocationTime: Scalars['String']['input'];
  payload: Scalars['String']['input'];
  sdInstanceId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type SdInstance = {
  __typename?: 'SDInstance';
  commandInvocations: Array<SdCommandInvocation>;
  confirmedByUser: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  parameterSnapshots?: Maybe<Array<SdParameterSnapshot>>;
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
  parameterSnapshots: Array<SdParameterSnapshot>;
  type: SdParameterType;
};

export type SdParameterInput = {
  denotation: Scalars['String']['input'];
  label?: InputMaybe<Scalars['String']['input']>;
  type: SdParameterType;
};

export type SdParameterSnapshot = {
  __typename?: 'SDParameterSnapshot';
  boolean?: Maybe<Scalars['Boolean']['output']>;
  instanceUid: Scalars['String']['output'];
  number?: Maybe<Scalars['Float']['output']>;
  parameterDenotation: Scalars['String']['output'];
  string?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['Date']['output'];
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
  commandInvocationStateChanged: SdCommandInvocation;
  onKPIFulfillmentChecked: KpiFulfillmentCheckResultTuple;
  onSDInstanceRegistered: SdInstance;
  onSDParameterSnapshotUpdate: SdParameterSnapshot;
};

export type UserConfig = {
  __typename?: 'UserConfig';
  config: Scalars['JSON']['output'];
  userId: Scalars['ID']['output'];
};

export type UserConfigInput = {
  config: Scalars['JSON']['input'];
};

export type UpdateUserConfigMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  input: UserConfigInput;
}>;


export type UpdateUserConfigMutation = { __typename?: 'Mutation', updateUserConfig: { __typename?: 'UserConfig', userId: number, config: any } };

export type SdInstancesQueryVariables = Exact<{ [key: string]: never; }>;


export type SdInstancesQuery = { __typename?: 'Query', sdInstances: Array<{ __typename?: 'SDInstance', id: number, uid: string, confirmedByUser: boolean, userIdentifier: string, type: { __typename?: 'SDType', id: number, denotation: string } }> };

export type SdTypeQueryVariables = Exact<{
  sdTypeId: Scalars['ID']['input'];
}>;


export type SdTypeQuery = { __typename?: 'Query', sdType: { __typename?: 'SDType', denotation: string, id: number, parameters: Array<{ __typename?: 'SDParameter', denotation: string, id: number, type: SdParameterType }> } };

export type SdTypesQueryVariables = Exact<{ [key: string]: never; }>;


export type SdTypesQuery = { __typename?: 'Query', sdTypes: Array<{ __typename?: 'SDType', id: number, denotation: string, label?: string | null, icon?: string | null, parameters: Array<{ __typename?: 'SDParameter', id: number, label?: string | null, denotation: string, type: SdParameterType }> }> };

export type UserConfigQueryVariables = Exact<{
  userConfigId: Scalars['ID']['input'];
}>;


export type UserConfigQuery = { __typename?: 'Query', userConfig: { __typename?: 'UserConfig', userId: number, config: any } };

export type SdInstancesWithSnapshotsQueryVariables = Exact<{ [key: string]: never; }>;


export type SdInstancesWithSnapshotsQuery = { __typename?: 'Query', sdInstances: Array<{ __typename?: 'SDInstance', confirmedByUser: boolean, id: number, uid: string, userIdentifier: string, parameterSnapshots?: Array<{ __typename?: 'SDParameterSnapshot', parameterDenotation: string, boolean?: boolean | null, instanceUid: string, number?: number | null, string?: string | null, updatedAt: any }> | null }> };

export type SdInstancesWithParamsQueryVariables = Exact<{ [key: string]: never; }>;


export type SdInstancesWithParamsQuery = { __typename?: 'Query', sdInstances: Array<{ __typename?: 'SDInstance', id: number, uid: string, confirmedByUser: boolean, userIdentifier: string, type: { __typename?: 'SDType', id: number, denotation: string, label?: string | null, icon?: string | null, parameters: Array<{ __typename?: 'SDParameter', id: number, denotation: string, label?: string | null, type: SdParameterType }> } }> };

export type SdTypeParametersQueryVariables = Exact<{
  sdTypeId: Scalars['ID']['input'];
}>;


export type SdTypeParametersQuery = { __typename?: 'Query', sdType: { __typename?: 'SDType', denotation: string, id: number, parameters: Array<{ __typename?: 'SDParameter', denotation: string, id: number, type: SdParameterType, label?: string | null }> } };

export type SdTypeParametersWithSnapshotsQueryVariables = Exact<{
  sdTypeId: Scalars['ID']['input'];
}>;


export type SdTypeParametersWithSnapshotsQuery = { __typename?: 'Query', sdType: { __typename?: 'SDType', denotation: string, id: number, parameters: Array<{ __typename?: 'SDParameter', denotation: string, id: number, type: SdParameterType, label?: string | null, parameterSnapshots: Array<{ __typename?: 'SDParameterSnapshot', instanceUid: string, parameterDenotation: string, string?: string | null, number?: number | null, boolean?: boolean | null, updatedAt: any }> }> } };

export type StatisticsQuerySensorsWithFieldsQueryVariables = Exact<{
  sensors: SensorsWithFields;
  request?: InputMaybe<StatisticsInput>;
}>;


export type StatisticsQuerySensorsWithFieldsQuery = { __typename?: 'Query', statisticsQuerySensorsWithFields: Array<{ __typename?: 'OutputData', data: any, time: any, deviceId: string }> };

export type OnSdParameterSnapshotUpdateSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type OnSdParameterSnapshotUpdateSubscription = { __typename?: 'Subscription', onSDParameterSnapshotUpdate: { __typename?: 'SDParameterSnapshot', instanceUid: string, parameterDenotation: string, string?: string | null, number?: number | null, boolean?: boolean | null, updatedAt: any } };


export const UpdateUserConfigDocument = gql`
    mutation UpdateUserConfig($userId: ID!, $input: UserConfigInput!) {
  updateUserConfig(userId: $userId, input: $input) {
    userId
    config
  }
}
    `;
export type UpdateUserConfigMutationFn = Apollo.MutationFunction<UpdateUserConfigMutation, UpdateUserConfigMutationVariables>;

/**
 * __useUpdateUserConfigMutation__
 *
 * To run a mutation, you first call `useUpdateUserConfigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateUserConfigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateUserConfigMutation, { data, loading, error }] = useUpdateUserConfigMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateUserConfigMutation(baseOptions?: Apollo.MutationHookOptions<UpdateUserConfigMutation, UpdateUserConfigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateUserConfigMutation, UpdateUserConfigMutationVariables>(UpdateUserConfigDocument, options);
      }
export type UpdateUserConfigMutationHookResult = ReturnType<typeof useUpdateUserConfigMutation>;
export type UpdateUserConfigMutationResult = Apollo.MutationResult<UpdateUserConfigMutation>;
export type UpdateUserConfigMutationOptions = Apollo.BaseMutationOptions<UpdateUserConfigMutation, UpdateUserConfigMutationVariables>;
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
    denotation
    id
    parameters {
      denotation
      id
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
export const UserConfigDocument = gql`
    query UserConfig($userConfigId: ID!) {
  userConfig(id: $userConfigId) {
    userId
    config
  }
}
    `;

/**
 * __useUserConfigQuery__
 *
 * To run a query within a React component, call `useUserConfigQuery` and pass it any options that fit your needs.
 * When your component renders, `useUserConfigQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUserConfigQuery({
 *   variables: {
 *      userConfigId: // value for 'userConfigId'
 *   },
 * });
 */
export function useUserConfigQuery(baseOptions: Apollo.QueryHookOptions<UserConfigQuery, UserConfigQueryVariables> & ({ variables: UserConfigQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UserConfigQuery, UserConfigQueryVariables>(UserConfigDocument, options);
      }
export function useUserConfigLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UserConfigQuery, UserConfigQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UserConfigQuery, UserConfigQueryVariables>(UserConfigDocument, options);
        }
export function useUserConfigSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UserConfigQuery, UserConfigQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<UserConfigQuery, UserConfigQueryVariables>(UserConfigDocument, options);
        }
export type UserConfigQueryHookResult = ReturnType<typeof useUserConfigQuery>;
export type UserConfigLazyQueryHookResult = ReturnType<typeof useUserConfigLazyQuery>;
export type UserConfigSuspenseQueryHookResult = ReturnType<typeof useUserConfigSuspenseQuery>;
export type UserConfigQueryResult = Apollo.QueryResult<UserConfigQuery, UserConfigQueryVariables>;
export const SdInstancesWithSnapshotsDocument = gql`
    query SdInstancesWithSnapshots {
  sdInstances {
    confirmedByUser
    id
    uid
    userIdentifier
    parameterSnapshots {
      parameterDenotation
      boolean
      instanceUid
      number
      string
      updatedAt
    }
  }
}
    `;

/**
 * __useSdInstancesWithSnapshotsQuery__
 *
 * To run a query within a React component, call `useSdInstancesWithSnapshotsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSdInstancesWithSnapshotsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSdInstancesWithSnapshotsQuery({
 *   variables: {
 *   },
 * });
 */
export function useSdInstancesWithSnapshotsQuery(baseOptions?: Apollo.QueryHookOptions<SdInstancesWithSnapshotsQuery, SdInstancesWithSnapshotsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SdInstancesWithSnapshotsQuery, SdInstancesWithSnapshotsQueryVariables>(SdInstancesWithSnapshotsDocument, options);
      }
export function useSdInstancesWithSnapshotsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SdInstancesWithSnapshotsQuery, SdInstancesWithSnapshotsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SdInstancesWithSnapshotsQuery, SdInstancesWithSnapshotsQueryVariables>(SdInstancesWithSnapshotsDocument, options);
        }
export function useSdInstancesWithSnapshotsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SdInstancesWithSnapshotsQuery, SdInstancesWithSnapshotsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SdInstancesWithSnapshotsQuery, SdInstancesWithSnapshotsQueryVariables>(SdInstancesWithSnapshotsDocument, options);
        }
export type SdInstancesWithSnapshotsQueryHookResult = ReturnType<typeof useSdInstancesWithSnapshotsQuery>;
export type SdInstancesWithSnapshotsLazyQueryHookResult = ReturnType<typeof useSdInstancesWithSnapshotsLazyQuery>;
export type SdInstancesWithSnapshotsSuspenseQueryHookResult = ReturnType<typeof useSdInstancesWithSnapshotsSuspenseQuery>;
export type SdInstancesWithSnapshotsQueryResult = Apollo.QueryResult<SdInstancesWithSnapshotsQuery, SdInstancesWithSnapshotsQueryVariables>;
export const SdInstancesWithParamsDocument = gql`
    query SdInstancesWithParams {
  sdInstances {
    id
    uid
    confirmedByUser
    userIdentifier
    type {
      id
      denotation
      label
      icon
      parameters {
        id
        denotation
        label
        type
      }
    }
  }
}
    `;

/**
 * __useSdInstancesWithParamsQuery__
 *
 * To run a query within a React component, call `useSdInstancesWithParamsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSdInstancesWithParamsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSdInstancesWithParamsQuery({
 *   variables: {
 *   },
 * });
 */
export function useSdInstancesWithParamsQuery(baseOptions?: Apollo.QueryHookOptions<SdInstancesWithParamsQuery, SdInstancesWithParamsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SdInstancesWithParamsQuery, SdInstancesWithParamsQueryVariables>(SdInstancesWithParamsDocument, options);
      }
export function useSdInstancesWithParamsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SdInstancesWithParamsQuery, SdInstancesWithParamsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SdInstancesWithParamsQuery, SdInstancesWithParamsQueryVariables>(SdInstancesWithParamsDocument, options);
        }
export function useSdInstancesWithParamsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SdInstancesWithParamsQuery, SdInstancesWithParamsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SdInstancesWithParamsQuery, SdInstancesWithParamsQueryVariables>(SdInstancesWithParamsDocument, options);
        }
export type SdInstancesWithParamsQueryHookResult = ReturnType<typeof useSdInstancesWithParamsQuery>;
export type SdInstancesWithParamsLazyQueryHookResult = ReturnType<typeof useSdInstancesWithParamsLazyQuery>;
export type SdInstancesWithParamsSuspenseQueryHookResult = ReturnType<typeof useSdInstancesWithParamsSuspenseQuery>;
export type SdInstancesWithParamsQueryResult = Apollo.QueryResult<SdInstancesWithParamsQuery, SdInstancesWithParamsQueryVariables>;
export const SdTypeParametersDocument = gql`
    query SdTypeParameters($sdTypeId: ID!) {
  sdType(id: $sdTypeId) {
    denotation
    id
    parameters {
      denotation
      id
      type
      label
    }
  }
}
    `;

/**
 * __useSdTypeParametersQuery__
 *
 * To run a query within a React component, call `useSdTypeParametersQuery` and pass it any options that fit your needs.
 * When your component renders, `useSdTypeParametersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSdTypeParametersQuery({
 *   variables: {
 *      sdTypeId: // value for 'sdTypeId'
 *   },
 * });
 */
export function useSdTypeParametersQuery(baseOptions: Apollo.QueryHookOptions<SdTypeParametersQuery, SdTypeParametersQueryVariables> & ({ variables: SdTypeParametersQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SdTypeParametersQuery, SdTypeParametersQueryVariables>(SdTypeParametersDocument, options);
      }
export function useSdTypeParametersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SdTypeParametersQuery, SdTypeParametersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SdTypeParametersQuery, SdTypeParametersQueryVariables>(SdTypeParametersDocument, options);
        }
export function useSdTypeParametersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SdTypeParametersQuery, SdTypeParametersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SdTypeParametersQuery, SdTypeParametersQueryVariables>(SdTypeParametersDocument, options);
        }
export type SdTypeParametersQueryHookResult = ReturnType<typeof useSdTypeParametersQuery>;
export type SdTypeParametersLazyQueryHookResult = ReturnType<typeof useSdTypeParametersLazyQuery>;
export type SdTypeParametersSuspenseQueryHookResult = ReturnType<typeof useSdTypeParametersSuspenseQuery>;
export type SdTypeParametersQueryResult = Apollo.QueryResult<SdTypeParametersQuery, SdTypeParametersQueryVariables>;
export const SdTypeParametersWithSnapshotsDocument = gql`
    query SdTypeParametersWithSnapshots($sdTypeId: ID!) {
  sdType(id: $sdTypeId) {
    denotation
    id
    parameters {
      denotation
      id
      type
      label
      parameterSnapshots {
        instanceUid
        parameterDenotation
        string
        number
        boolean
        updatedAt
      }
    }
  }
}
    `;

/**
 * __useSdTypeParametersWithSnapshotsQuery__
 *
 * To run a query within a React component, call `useSdTypeParametersWithSnapshotsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSdTypeParametersWithSnapshotsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSdTypeParametersWithSnapshotsQuery({
 *   variables: {
 *      sdTypeId: // value for 'sdTypeId'
 *   },
 * });
 */
export function useSdTypeParametersWithSnapshotsQuery(baseOptions: Apollo.QueryHookOptions<SdTypeParametersWithSnapshotsQuery, SdTypeParametersWithSnapshotsQueryVariables> & ({ variables: SdTypeParametersWithSnapshotsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SdTypeParametersWithSnapshotsQuery, SdTypeParametersWithSnapshotsQueryVariables>(SdTypeParametersWithSnapshotsDocument, options);
      }
export function useSdTypeParametersWithSnapshotsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SdTypeParametersWithSnapshotsQuery, SdTypeParametersWithSnapshotsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SdTypeParametersWithSnapshotsQuery, SdTypeParametersWithSnapshotsQueryVariables>(SdTypeParametersWithSnapshotsDocument, options);
        }
export function useSdTypeParametersWithSnapshotsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SdTypeParametersWithSnapshotsQuery, SdTypeParametersWithSnapshotsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SdTypeParametersWithSnapshotsQuery, SdTypeParametersWithSnapshotsQueryVariables>(SdTypeParametersWithSnapshotsDocument, options);
        }
export type SdTypeParametersWithSnapshotsQueryHookResult = ReturnType<typeof useSdTypeParametersWithSnapshotsQuery>;
export type SdTypeParametersWithSnapshotsLazyQueryHookResult = ReturnType<typeof useSdTypeParametersWithSnapshotsLazyQuery>;
export type SdTypeParametersWithSnapshotsSuspenseQueryHookResult = ReturnType<typeof useSdTypeParametersWithSnapshotsSuspenseQuery>;
export type SdTypeParametersWithSnapshotsQueryResult = Apollo.QueryResult<SdTypeParametersWithSnapshotsQuery, SdTypeParametersWithSnapshotsQueryVariables>;
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
export const OnSdParameterSnapshotUpdateDocument = gql`
    subscription OnSDParameterSnapshotUpdate {
  onSDParameterSnapshotUpdate {
    instanceUid
    parameterDenotation
    string
    number
    boolean
    updatedAt
  }
}
    `;

/**
 * __useOnSdParameterSnapshotUpdateSubscription__
 *
 * To run a query within a React component, call `useOnSdParameterSnapshotUpdateSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnSdParameterSnapshotUpdateSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnSdParameterSnapshotUpdateSubscription({
 *   variables: {
 *   },
 * });
 */
export function useOnSdParameterSnapshotUpdateSubscription(baseOptions?: Apollo.SubscriptionHookOptions<OnSdParameterSnapshotUpdateSubscription, OnSdParameterSnapshotUpdateSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<OnSdParameterSnapshotUpdateSubscription, OnSdParameterSnapshotUpdateSubscriptionVariables>(OnSdParameterSnapshotUpdateDocument, options);
      }
export type OnSdParameterSnapshotUpdateSubscriptionHookResult = ReturnType<typeof useOnSdParameterSnapshotUpdateSubscription>;
export type OnSdParameterSnapshotUpdateSubscriptionResult = Apollo.SubscriptionResult<OnSdParameterSnapshotUpdateSubscription>;