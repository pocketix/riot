import React, {useState} from "react"
import {Alert, Button, FormControlLabel, FormGroup, LinearProgress, TextField} from '@mui/material'
import styles from "./NewDeviceTypeForm.module.scss"
import {useMutation} from "@apollo/client"
import {
    CreateNewUserDefinedDeviceTypeMutation,
    CreateNewUserDefinedDeviceTypeMutationVariables
} from "../../generated/graphql"
import gql from "graphql-tag"
import CREATE_NEW_USER_DEFINED_DEVICE_TYPE_MUTATION from "../../graphql/mutations/createNewUserDefinedDeviceType.graphql"


interface FormState {
    denotationText: string
    denotationTextFieldValid: boolean
}

const NewDeviceTypeForm: React.FC = () => {

    const [createNewUserDefinedDeviceTypeMutation, {loading, error }] = useMutation<CreateNewUserDefinedDeviceTypeMutation, CreateNewUserDefinedDeviceTypeMutationVariables>(gql`${CREATE_NEW_USER_DEFINED_DEVICE_TYPE_MUTATION}`)

    const [formState, setFormState] = useState<FormState>({
        denotationText: "shelly1pro",
        denotationTextFieldValid: true
    })

    const onSubmitHandler = async () => {

        if (formState.denotationText.length === 0) {
            setFormState(current => {
                return {
                    ...current,
                    denotationTextFieldValid: false
                }
            })
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
    }

    if (error) { // Handle error(s)
        return <Alert severity="error">Error: {error.message}</Alert>
    }

    if (loading) { // Handle loading
        return <LinearProgress />
    }

    return <div className={styles.form}>
        <h2>Define new device type</h2>
        <TextField
            error={!formState.denotationTextFieldValid}
            id="denotation"
            label="Denotation"
            value={formState.denotationText}
            onChange={e => setFormState(current => {
                return {
                    ...current,
                    denotationText: e.target.value
                }
            })}
        />
        <Button onClick={() => onSubmitHandler()}>Submit</Button>
    </div>
}

export default NewDeviceTypeForm
