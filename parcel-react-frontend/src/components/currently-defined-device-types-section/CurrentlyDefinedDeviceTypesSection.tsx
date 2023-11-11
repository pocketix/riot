import React from "react"
import gql from 'graphql-tag' // FIXME: Should not be necessary with correct build tool (Parcel) configuration...
import {useQuery} from '@apollo/client'
import USER_DEFINED_DEVICE_TYPES_QUERY from './../../graphql/queries/userDefinedDeviceTypes.graphql'
import {UserDefinedDeviceTypesQuery, UserDefinedDeviceTypesQueryVariables} from '../../generated/graphql'
import {Alert, LinearProgress} from "@mui/material"
import DeviceTypeWidget from "../device-type-widget/DeviceTypeWidget"
import styles from "./CurrentlyDefinedDeviceTypesSection.module.scss"

const CurrentlyDefinedDeviceTypesSection: React.FC = () => {

    const {data, loading, error} = useQuery<UserDefinedDeviceTypesQuery, UserDefinedDeviceTypesQueryVariables>(gql`${USER_DEFINED_DEVICE_TYPES_QUERY}`)

    if (error) { // Handle error(s)
        return <Alert severity="error">Error: {error.message}</Alert>
    }

    if (loading) { // Handle loading
        return <LinearProgress />
    }

    if (data) {
        return <div className={styles.section}>
            {data.userDefinedDeviceTypes.map(deviceType => (
                <DeviceTypeWidget id={deviceType.id} denotation={deviceType.denotation} parameters={deviceType.parameters} />
            ))}
        </div>
    }
}

export default CurrentlyDefinedDeviceTypesSection
