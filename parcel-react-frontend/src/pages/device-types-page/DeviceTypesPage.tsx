import React, {ReactElement} from "react"
import styles from "./DeviceTypesPage.module.scss"

import gql from 'graphql-tag' // FIXME: Should not be necessary with correct build tool (Parcel) configuration...
import {useQuery} from '@apollo/client'
import USER_DEFINED_DEVICE_TYPES_QUERY from './../../graphql/queries/userDefinedDeviceTypes.graphql'
import {UserDefinedDeviceTypesQuery, UserDefinedDeviceTypesQueryVariables} from '../../generated/graphql'

const DeviceTypesPage: React.FC = () => {

    const {data, loading, error} = useQuery<UserDefinedDeviceTypesQuery, UserDefinedDeviceTypesQueryVariables>(gql`${USER_DEFINED_DEVICE_TYPES_QUERY}`)

    let content: ReactElement
    if (error) {
        content = <p>Error: {error.message}</p>
    } else if (loading) {
        content = <p>Loading...</p>
    } else if (data) {
        content = <>
            {data.userDefinedDeviceTypes.map(deviceType => (
                <div key={deviceType.id}>
                    <h2>{deviceType.denotation}</h2>
                    <ul>
                        {deviceType.parameters.map(param => (
                            <li key={param.id}>{param.name} ({param.type})</li>
                        ))}
                    </ul>
                </div>
            ))}
        </>
    }

    return <div className={styles.deviceTypesPage}>
        <h1>Device Types</h1>
        <p>For now, this page offers an overview of already defined device types.:</p>
        {content}
    </div>
}

export default DeviceTypesPage
