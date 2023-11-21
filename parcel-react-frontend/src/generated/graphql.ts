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
  type: UserDefinedDeviceType;
  uid: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createNewUserDefinedDeviceType: UserDefinedDeviceType;
  deleteUserDefinedDeviceType?: Maybe<Scalars['Boolean']['output']>;
};


export type MutationCreateNewUserDefinedDeviceTypeArgs = {
  input: NewUserDefinedDeviceTypeInput;
};


export type MutationDeleteUserDefinedDeviceTypeArgs = {
  input: Scalars['ID']['input'];
};

export type NewUserDefinedDeviceTypeInput = {
  denotation: Scalars['String']['input'];
  parameters: Array<UserDefinedDeviceTypeParameterInput>;
};

export type Query = {
  __typename?: 'Query';
  devices: Array<Device>;
  singleUserDefinedDeviceType: UserDefinedDeviceType;
  userDefinedDeviceTypes: Array<UserDefinedDeviceType>;
};


export type QuerySingleUserDefinedDeviceTypeArgs = {
  input: Scalars['ID']['input'];
};

export type UserDefinedDeviceType = {
  __typename?: 'UserDefinedDeviceType';
  denotation: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  parameters: Array<UserDefinedDeviceTypeParameter>;
};

export type UserDefinedDeviceTypeParameter = {
  __typename?: 'UserDefinedDeviceTypeParameter';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  type: UserDefinedDeviceTypeParameterType;
};

export type UserDefinedDeviceTypeParameterInput = {
  name: Scalars['String']['input'];
  type: UserDefinedDeviceTypeParameterType;
};

export enum UserDefinedDeviceTypeParameterType {
  Boolean = 'BOOLEAN',
  Number = 'NUMBER',
  String = 'STRING'
}

export type CreateNewUserDefinedDeviceTypeMutationVariables = Exact<{
  input: NewUserDefinedDeviceTypeInput;
}>;


export type CreateNewUserDefinedDeviceTypeMutation = { __typename?: 'Mutation', createNewUserDefinedDeviceType: { __typename?: 'UserDefinedDeviceType', id: string, denotation: string, parameters: Array<{ __typename?: 'UserDefinedDeviceTypeParameter', id: string, name: string, type: UserDefinedDeviceTypeParameterType }> } };

export type DeleteUserDefinedDeviceTypeMutationVariables = Exact<{
  input: Scalars['ID']['input'];
}>;


export type DeleteUserDefinedDeviceTypeMutation = { __typename?: 'Mutation', deleteUserDefinedDeviceType?: boolean | null };

export type DevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type DevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, uid: string, name: string, type: { __typename?: 'UserDefinedDeviceType', id: string, denotation: string } }> };

export type SingleUserDefinedDeviceTypeQueryVariables = Exact<{
  input: Scalars['ID']['input'];
}>;


export type SingleUserDefinedDeviceTypeQuery = { __typename?: 'Query', singleUserDefinedDeviceType: { __typename?: 'UserDefinedDeviceType', id: string, denotation: string, parameters: Array<{ __typename?: 'UserDefinedDeviceTypeParameter', id: string, name: string, type: UserDefinedDeviceTypeParameterType }> } };

export type UserDefinedDeviceTypesQueryVariables = Exact<{ [key: string]: never; }>;


export type UserDefinedDeviceTypesQuery = { __typename?: 'Query', userDefinedDeviceTypes: Array<{ __typename?: 'UserDefinedDeviceType', id: string, denotation: string, parameters: Array<{ __typename?: 'UserDefinedDeviceTypeParameter', id: string, name: string, type: UserDefinedDeviceTypeParameterType }> }> };
