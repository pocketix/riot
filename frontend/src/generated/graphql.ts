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

export type Device = {
  __typename?: 'Device';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  type: DeviceType;
  uid: Scalars['String']['output'];
};

export type DeviceType = {
  __typename?: 'DeviceType';
  denotation: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  parameters: Array<DeviceTypeParameter>;
};

export type DeviceTypeParameter = {
  __typename?: 'DeviceTypeParameter';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  type: DeviceTypeParameterType;
};

export type DeviceTypeParameterInput = {
  name: Scalars['String']['input'];
  type: DeviceTypeParameterType;
};

export enum DeviceTypeParameterType {
  Boolean = 'BOOLEAN',
  Number = 'NUMBER',
  String = 'STRING'
}

export type Mutation = {
  __typename?: 'Mutation';
  createNewDeviceType: DeviceType;
  deleteDeviceType?: Maybe<Scalars['Boolean']['output']>;
  updateDeviceName: Device;
};


export type MutationCreateNewDeviceTypeArgs = {
  input: NewDeviceTypeInput;
};


export type MutationDeleteDeviceTypeArgs = {
  input: Scalars['ID']['input'];
};


export type MutationUpdateDeviceNameArgs = {
  id: Scalars['ID']['input'];
  newName: Scalars['String']['input'];
};

export type NewDeviceTypeInput = {
  denotation: Scalars['String']['input'];
  parameters: Array<DeviceTypeParameterInput>;
};

export type Query = {
  __typename?: 'Query';
  deviceTypes: Array<DeviceType>;
  devices: Array<Device>;
  singleDeviceType: DeviceType;
};


export type QuerySingleDeviceTypeArgs = {
  input: Scalars['ID']['input'];
};

export type CreateNewDeviceTypeMutationVariables = Exact<{
  input: NewDeviceTypeInput;
}>;


export type CreateNewDeviceTypeMutation = { __typename?: 'Mutation', createNewDeviceType: { __typename?: 'DeviceType', id: string, denotation: string, parameters: Array<{ __typename?: 'DeviceTypeParameter', id: string, name: string, type: DeviceTypeParameterType }> } };

export type DeleteDeviceTypeMutationVariables = Exact<{
  input: Scalars['ID']['input'];
}>;


export type DeleteDeviceTypeMutation = { __typename?: 'Mutation', deleteDeviceType?: boolean | null };

export type UpdateDeviceNameMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  newName: Scalars['String']['input'];
}>;


export type UpdateDeviceNameMutation = { __typename?: 'Mutation', updateDeviceName: { __typename?: 'Device', id: string } };

export type DeviceTypesQueryVariables = Exact<{ [key: string]: never; }>;


export type DeviceTypesQuery = { __typename?: 'Query', deviceTypes: Array<{ __typename?: 'DeviceType', id: string, denotation: string, parameters: Array<{ __typename?: 'DeviceTypeParameter', id: string, name: string, type: DeviceTypeParameterType }> }>, devices: Array<{ __typename?: 'Device', type: { __typename?: 'DeviceType', id: string } }> };

export type DevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type DevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, uid: string, name: string, type: { __typename?: 'DeviceType', id: string, denotation: string } }> };
