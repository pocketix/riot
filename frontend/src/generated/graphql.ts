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
  Date: { input: any; output: any; }
  StatisticsParameterValue: { input: any; output: any; }
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
  data: StatisticsFieldInput;
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
  statisticsMutate: Scalars['Boolean']['output'];
  updateKPIDefinition: KpiDefinition;
  updateSDInstance: SdInstance;
  updateSDInstanceGroup: SdInstanceGroup;
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
  data: StatisticsField;
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
  statisticsQuery: Array<OutputData>;
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


export type QueryStatisticsQueryArgs = {
  request: StatisticsInput;
};

export type SdInstance = {
  __typename?: 'SDInstance';
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

export type SensorField = {
  __typename?: 'SensorField';
  key: Scalars['String']['output'];
  values: Array<Scalars['String']['output']>;
};

/** Return only the requested sensor fields */
export type SensorFieldInput = {
  fields: Array<Scalars['String']['input']>;
  key: Scalars['String']['input'];
};

/** Sensors to be queried */
export type SensorsInput = {
  /** Return only the requested sensor fields */
  sensorsWithFields?: InputMaybe<Array<InputMaybe<SensorFieldInput>>>;
  /** Simple definition, returns all available sensor fields */
  simpleSensors?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type SensorsWithFields = {
  __typename?: 'SensorsWithFields';
  sensors: Array<SensorField>;
};

export type SimpleSensors = {
  __typename?: 'SimpleSensors';
  sensors: Array<Scalars['String']['output']>;
};

export type StatisticsField = {
  __typename?: 'StatisticsField';
  key: Scalars['String']['output'];
  value: Scalars['StatisticsParameterValue']['output'];
};

export type StatisticsFieldInput = {
  key: Scalars['String']['input'];
  value: Scalars['StatisticsParameterValue']['input'];
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
  /** Sensors to be queried */
  sensors: SensorsInput;
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
  Count = 'COUNT',
  First = 'FIRST',
  Integral = 'INTEGRAL',
  Last = 'LAST',
  Max = 'MAX',
  Mean = 'MEAN',
  Median = 'MEDIAN',
  Min = 'MIN',
  Mode = 'MODE',
  None = 'NONE',
  Quantile = 'QUANTILE',
  Reduce = 'REDUCE',
  Skew = 'SKEW',
  Spread = 'SPREAD',
  Stddev = 'STDDEV',
  Sum = 'SUM',
  Timeweightedavg = 'TIMEWEIGHTEDAVG'
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

export type ConfirmSdInstanceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ConfirmSdInstanceMutation = { __typename?: 'Mutation', updateSDInstance: { __typename?: 'SDInstance', id: string, uid: string, confirmedByUser: boolean, userIdentifier: string, type: { __typename?: 'SDType', id: string, denotation: string, parameters: Array<{ __typename?: 'SDParameter', id: string, denotation: string, type: SdParameterType }> } } };

export type CreateKpiDefinitionMutationVariables = Exact<{
  input: KpiDefinitionInput;
}>;


export type CreateKpiDefinitionMutation = { __typename?: 'Mutation', createKPIDefinition: { __typename?: 'KPIDefinition', id: string } };

export type CreateSdInstanceGroupMutationVariables = Exact<{
  input: SdInstanceGroupInput;
}>;


export type CreateSdInstanceGroupMutation = { __typename?: 'Mutation', createSDInstanceGroup: { __typename?: 'SDInstanceGroup', id: string, userIdentifier: string, sdInstanceIDs: Array<string> } };

export type CreateSdTypeMutationVariables = Exact<{
  input: SdTypeInput;
}>;


export type CreateSdTypeMutation = { __typename?: 'Mutation', createSDType: { __typename?: 'SDType', id: string, denotation: string, parameters: Array<{ __typename?: 'SDParameter', id: string, denotation: string, type: SdParameterType }> } };

export type DeleteKpiDefinitionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteKpiDefinitionMutation = { __typename?: 'Mutation', deleteKPIDefinition: boolean };

export type DeleteSdInstanceGroupMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteSdInstanceGroupMutation = { __typename?: 'Mutation', deleteSDInstanceGroup: boolean };

export type DeleteSdTypeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteSdTypeMutation = { __typename?: 'Mutation', deleteSDType: boolean };

export type UpdateKpiDefinitionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: KpiDefinitionInput;
}>;


export type UpdateKpiDefinitionMutation = { __typename?: 'Mutation', updateKPIDefinition: { __typename?: 'KPIDefinition', id: string } };

export type UpdateSdInstanceGroupMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: SdInstanceGroupInput;
}>;


export type UpdateSdInstanceGroupMutation = { __typename?: 'Mutation', updateSDInstanceGroup: { __typename?: 'SDInstanceGroup', id: string, userIdentifier: string, sdInstanceIDs: Array<string> } };

export type UpdateUserIdentifierOfSdInstanceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  newUserIdentifier: Scalars['String']['input'];
}>;


export type UpdateUserIdentifierOfSdInstanceMutation = { __typename?: 'Mutation', updateSDInstance: { __typename?: 'SDInstance', id: string, uid: string, confirmedByUser: boolean, userIdentifier: string, type: { __typename?: 'SDType', id: string, denotation: string, parameters: Array<{ __typename?: 'SDParameter', id: string, denotation: string, type: SdParameterType }> } } };

export type KpiDefinitionDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type KpiDefinitionDetailQuery = { __typename?: 'Query', kpiDefinition: { __typename?: 'KPIDefinition', id: string, userIdentifier: string, sdTypeID: string, sdTypeSpecification: string, sdInstanceMode: SdInstanceMode, selectedSDInstanceUIDs: Array<string>, nodes: Array<{ __typename?: 'BooleanEQAtomKPINode', id: string, parentNodeID?: string | null, nodeType: KpiNodeType, sdParameterID: string, sdParameterSpecification: string, booleanReferenceValue: boolean } | { __typename?: 'LogicalOperationKPINode', id: string, parentNodeID?: string | null, nodeType: KpiNodeType, type: LogicalOperationType } | { __typename?: 'NumericEQAtomKPINode', id: string, parentNodeID?: string | null, nodeType: KpiNodeType, sdParameterID: string, sdParameterSpecification: string, numericReferenceValue: number } | { __typename?: 'NumericGEQAtomKPINode', id: string, parentNodeID?: string | null, nodeType: KpiNodeType, sdParameterID: string, sdParameterSpecification: string, numericReferenceValue: number } | { __typename?: 'NumericGTAtomKPINode', id: string, parentNodeID?: string | null, nodeType: KpiNodeType, sdParameterID: string, sdParameterSpecification: string, numericReferenceValue: number } | { __typename?: 'NumericLEQAtomKPINode', id: string, parentNodeID?: string | null, nodeType: KpiNodeType, sdParameterID: string, sdParameterSpecification: string, numericReferenceValue: number } | { __typename?: 'NumericLTAtomKPINode', id: string, parentNodeID?: string | null, nodeType: KpiNodeType, sdParameterID: string, sdParameterSpecification: string, numericReferenceValue: number } | { __typename?: 'StringEQAtomKPINode', id: string, parentNodeID?: string | null, nodeType: KpiNodeType, sdParameterID: string, sdParameterSpecification: string, stringReferenceValue: string }> } };

export type KpiDefinitionsQueryVariables = Exact<{ [key: string]: never; }>;


export type KpiDefinitionsQuery = { __typename?: 'Query', kpiDefinitions: Array<{ __typename?: 'KPIDefinition', id: string, userIdentifier: string, sdTypeID: string, sdTypeSpecification: string, sdInstanceMode: SdInstanceMode, selectedSDInstanceUIDs: Array<string> }> };

export type RestOfKpiDefinitionDetailPageDataQueryVariables = Exact<{ [key: string]: never; }>;


export type RestOfKpiDefinitionDetailPageDataQuery = { __typename?: 'Query', sdTypes: Array<{ __typename?: 'SDType', id: string, denotation: string, parameters: Array<{ __typename?: 'SDParameter', id: string, denotation: string, type: SdParameterType }> }>, sdInstances: Array<{ __typename?: 'SDInstance', id: string, uid: string, confirmedByUser: boolean, userIdentifier: string, type: { __typename?: 'SDType', id: string } }> };

export type SdInstanceGroupsPageDataQueryVariables = Exact<{ [key: string]: never; }>;


export type SdInstanceGroupsPageDataQuery = { __typename?: 'Query', sdInstances: Array<{ __typename?: 'SDInstance', id: string, uid: string, confirmedByUser: boolean, userIdentifier: string, type: { __typename?: 'SDType', id: string } }>, sdInstanceGroups: Array<{ __typename?: 'SDInstanceGroup', id: string, userIdentifier: string, sdInstanceIDs: Array<string> }>, kpiDefinitions: Array<{ __typename?: 'KPIDefinition', id: string, userIdentifier: string, sdTypeID: string, sdInstanceMode: SdInstanceMode, selectedSDInstanceUIDs: Array<string> }>, kpiFulfillmentCheckResults: Array<{ __typename?: 'KPIFulfillmentCheckResult', kpiDefinitionID: string, sdInstanceID: string, fulfilled: boolean }> };

export type SdInstancesPageDataQueryVariables = Exact<{ [key: string]: never; }>;


export type SdInstancesPageDataQuery = { __typename?: 'Query', sdInstances: Array<{ __typename?: 'SDInstance', id: string, uid: string, confirmedByUser: boolean, userIdentifier: string, type: { __typename?: 'SDType', id: string, denotation: string } }>, kpiFulfillmentCheckResults: Array<{ __typename?: 'KPIFulfillmentCheckResult', kpiDefinitionID: string, sdInstanceID: string, fulfilled: boolean }>, kpiDefinitions: Array<{ __typename?: 'KPIDefinition', id: string, userIdentifier: string, sdTypeID: string, sdInstanceMode: SdInstanceMode, selectedSDInstanceUIDs: Array<string> }> };

export type SdTypesQueryVariables = Exact<{ [key: string]: never; }>;


export type SdTypesQuery = { __typename?: 'Query', sdTypes: Array<{ __typename?: 'SDType', id: string, denotation: string, parameters: Array<{ __typename?: 'SDParameter', id: string, denotation: string, type: SdParameterType }> }> };

export type OnKpiFulfillmentCheckedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type OnKpiFulfillmentCheckedSubscription = { __typename?: 'Subscription', onKPIFulfillmentChecked: { __typename?: 'KPIFulfillmentCheckResultTuple', kpiFulfillmentCheckResults: Array<{ __typename?: 'KPIFulfillmentCheckResult', kpiDefinitionID: string, sdInstanceID: string, fulfilled: boolean }> } };

export type OnSdInstanceRegisteredSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type OnSdInstanceRegisteredSubscription = { __typename?: 'Subscription', onSDInstanceRegistered: { __typename?: 'SDInstance', id: string, uid: string, confirmedByUser: boolean, userIdentifier: string, type: { __typename?: 'SDType', id: string, denotation: string } } };
