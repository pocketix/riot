import React, { useState, useCallback, useMemo } from 'react'
import { Alert, Button, TextField } from '@mui/material'
import styles from './NewDeviceTypeForm.module.scss'
import { useMutation, ApolloError } from '@apollo/client'
import CREATE_NEW_USER_DEFINED_DEVICE_TYPE_MUTATION from '../../../../graphql/mutations/createNewUserDefinedDeviceType.graphql'
import { RefetchFunction } from '@apollo/client/react/hooks/useSuspenseQuery'
import { UserDefinedDeviceTypesQuery, UserDefinedDeviceTypesQueryVariables } from '../../../../generated/graphql'
import gql from "graphql-tag";

interface NewDeviceTypeFormProps {
    userDefinedDeviceTypesQueryLoading: boolean
    userDefinedDeviceTypesQueryError: ApolloError | undefined
    userDefinedDeviceTypesQueryRefetch: RefetchFunction<UserDefinedDeviceTypesQuery, UserDefinedDeviceTypesQueryVariables>
}

const NewDeviceTypeForm: React.FC<NewDeviceTypeFormProps> = ({userDefinedDeviceTypesQueryLoading, userDefinedDeviceTypesQueryError, userDefinedDeviceTypesQueryRefetch}) => {
    const [denotationText, setDenotationText] = useState('shelly1pro')
    const [submitError, setSubmitError] = useState<ApolloError | null>(null)

    const isFormDisabled = useMemo(() => userDefinedDeviceTypesQueryLoading || userDefinedDeviceTypesQueryError !== undefined, [userDefinedDeviceTypesQueryLoading, userDefinedDeviceTypesQueryError])

    const [createNewUserDefinedDeviceType] = useMutation(gql`${CREATE_NEW_USER_DEFINED_DEVICE_TYPE_MUTATION}`)

    const onSubmitHandler = useCallback(async () => {
        if (denotationText.length === 0) {
            return
        }
        try {
            await createNewUserDefinedDeviceType({
                variables: {
                    input: {
                        denotation: denotationText,
                        parameters: [],
                    },
                },
            })
            await userDefinedDeviceTypesQueryRefetch();
        } catch (error) {
            if (error instanceof ApolloError) {
                setSubmitError(error)
            }
        }
    }, [denotationText, createNewUserDefinedDeviceType, userDefinedDeviceTypesQueryRefetch])

    const onDenotationTextChange = useCallback((e) => {
        setDenotationText(e.target.value)
    }, [])

    return (
        <div className={styles.form}>
            <h2>Define new device type</h2>
            {submitError && <Alert severity="error">Error: {submitError.message}</Alert>}
            <TextField
                error={denotationText.length === 0}
                id="denotation"
                label="Denotation"
                value={denotationText}
                disabled={isFormDisabled}
                onChange={onDenotationTextChange}
            />
            <Button disabled={isFormDisabled} onClick={onSubmitHandler}>Submit</Button>
        </div>
    )
}

export default NewDeviceTypeForm
