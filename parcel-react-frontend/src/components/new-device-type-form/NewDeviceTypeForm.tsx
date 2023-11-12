import React, {useEffect, useState} from "react"
import {Alert, Button, TextField} from '@mui/material'
import styles from "./NewDeviceTypeForm.module.scss"
import {ApolloError, useMutation} from "@apollo/client"
import {
    CreateNewUserDefinedDeviceTypeMutation,
    CreateNewUserDefinedDeviceTypeMutationVariables, UserDefinedDeviceTypesQuery, UserDefinedDeviceTypesQueryVariables
} from "../../generated/graphql"
import gql from "graphql-tag"
import CREATE_NEW_USER_DEFINED_DEVICE_TYPE_MUTATION from "../../graphql/mutations/createNewUserDefinedDeviceType.graphql"
import {RefetchFunction} from "@apollo/client/react/hooks/useSuspenseQuery";


interface FormState {
    formEnabled: boolean
    denotationText: string
    denotationTextFieldValid: boolean
}

interface NewDeviceTypeFormProps {
    userDefinedDeviceTypesQueryLoading: boolean
    userDefinedDeviceTypesQueryError: ApolloError
    userDefinedDeviceTypesQueryRefetchFunction: RefetchFunction<UserDefinedDeviceTypesQuery, UserDefinedDeviceTypesQueryVariables>
}

const NewDeviceTypeForm: React.FC<NewDeviceTypeFormProps> = ({userDefinedDeviceTypesQueryLoading, userDefinedDeviceTypesQueryError, userDefinedDeviceTypesQueryRefetchFunction}) => {

    let userDefinedDeviceTypesQueryLoadingIncludingRefetch: boolean = userDefinedDeviceTypesQueryLoading
    let userDefinedDeviceTypesQueryErrorIncludingRefetch: ApolloError = userDefinedDeviceTypesQueryError

    const [createNewUserDefinedDeviceTypeMutation, {loading, error }] = useMutation<CreateNewUserDefinedDeviceTypeMutation, CreateNewUserDefinedDeviceTypeMutationVariables>(gql`${CREATE_NEW_USER_DEFINED_DEVICE_TYPE_MUTATION}`)

    const [formState, setFormState] = useState<FormState>({
        formEnabled: true,
        denotationText: "shelly1pro",
        denotationTextFieldValid: true
    })

    useEffect(() => {
        if (userDefinedDeviceTypesQueryLoadingIncludingRefetch || userDefinedDeviceTypesQueryErrorIncludingRefetch || loading) {
            setFormState(current => {
                return {
                    ...current,
                    formEnabled: false
                }
            })
        } else {
            setFormState(current => {
                return {
                    ...current,
                    formEnabled: true
                }
            })
        }
    }, [userDefinedDeviceTypesQueryLoadingIncludingRefetch, userDefinedDeviceTypesQueryErrorIncludingRefetch, loading])

    useEffect(() => {
        if (formState.denotationText.length === 0) {
            setFormState(current => {
                return {
                    ...current,
                    denotationTextFieldValid: false
                }
            })
        } else {
            setFormState(current => {
                return {
                    ...current,
                    denotationTextFieldValid: true
                }
            })
        }
    }, [formState.denotationText]);

    const onSubmitHandler = async () => {

        if (!formState.denotationTextFieldValid) {
            return
        }

        await createNewUserDefinedDeviceTypeMutation({
            variables: {
                input: {
                    denotation: formState.denotationText,
                    parameters: []
                }
            }
        })

        const {loading, error} = await userDefinedDeviceTypesQueryRefetchFunction()
        userDefinedDeviceTypesQueryLoadingIncludingRefetch = loading
        userDefinedDeviceTypesQueryErrorIncludingRefetch = error
    }

    return <div className={styles.form}>
        <h2>Define new device type</h2>
        {error && <Alert severity="error">Error: {error.message}</Alert>}
        <TextField
            error={!formState.denotationTextFieldValid}
            id="denotation"
            label="Denotation"
            value={formState.denotationText}
            disabled={!formState.formEnabled}
            onChange={e => setFormState(current => {
                return {
                    ...current,
                    denotationText: e.target.value
                }
            })}
        />
        <Button disabled={!formState.formEnabled} onClick={() => onSubmitHandler()}>Submit</Button>
    </div>
}

export default NewDeviceTypeForm
