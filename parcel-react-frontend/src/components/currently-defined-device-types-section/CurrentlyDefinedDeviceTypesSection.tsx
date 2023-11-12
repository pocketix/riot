import React, {useCallback, useState} from "react"
import {ApolloError, useMutation} from '@apollo/client'
import {UserDefinedDeviceTypesQuery, UserDefinedDeviceTypesQueryVariables} from '../../generated/graphql'
import {Alert, CircularProgress, FormControlLabel, Switch} from "@mui/material"
import DeviceTypeWidget from "../device-type-widget/DeviceTypeWidget"
import styles from "./CurrentlyDefinedDeviceTypesSection.module.scss"
import gql from "graphql-tag";
import DELETE_USER_DEFINED_DEVICE_TYPE_MUTATION from "../../graphql/mutations/deleteUserDefinedDeviceType.graphql"
import {RefetchFunction} from "@apollo/client/react/hooks/useSuspenseQuery";

interface CurrentlyDefinedDeviceTypesSectionProps {
    data: UserDefinedDeviceTypesQuery
    loading: boolean
    error: ApolloError
    refetch: RefetchFunction<UserDefinedDeviceTypesQuery, UserDefinedDeviceTypesQueryVariables>
}

const CurrentlyDefinedDeviceTypesSection: React.FC<CurrentlyDefinedDeviceTypesSectionProps> = ({data, loading, error, refetch}) => {

    const [areParametersDisplayed, setParametersDisplayed] = useState<boolean>(true)

    const [deleteUserDefinedDeviceType] = useMutation(gql`${DELETE_USER_DEFINED_DEVICE_TYPE_MUTATION}`)

    const deleteCertainUserDefinedDeviceType = useCallback(async (id: string) => {
        await deleteUserDefinedDeviceType({
            variables: {
                input: id
            }
        })
        await refetch()
    }, [])

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setParametersDisplayed(event.target.checked)
    }

    if (error || loading) {
        return <div className={styles.nonStandardStateContainer}>
            {error && <Alert severity="error">Error: {error.message}</Alert>}
            {loading && <CircularProgress />}
        </div>
    }

    if (data) {
        return <div className={styles.sectionContainer}>
            <h2>Currently defined device types</h2>
            <FormControlLabel control={<Switch checked={areParametersDisplayed} onChange={handleChange} />} label="Display parameters?" />
            <div className={styles.section}>
                {data.userDefinedDeviceTypes.map(deviceType => (
                    <DeviceTypeWidget id={deviceType.id} denotation={deviceType.denotation} areParametersDisplayed={areParametersDisplayed} parameters={deviceType.parameters} deleteCertainUserDefinedDeviceType={deleteCertainUserDefinedDeviceType}/>
                ))}
            </div>
        </div>
    }
}

export default CurrentlyDefinedDeviceTypesSection
