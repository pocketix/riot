import React from "react"
import styles from "./DeviceTypesPage.module.scss"

import CurrentlyDefinedDeviceTypesSection from "../../components/currently-defined-device-types-section/CurrentlyDefinedDeviceTypesSection"
import NewDeviceTypeForm from "../../components/new-device-type-form/NewDeviceTypeForm"
import {useQuery} from "@apollo/client";
import {UserDefinedDeviceTypesQuery, UserDefinedDeviceTypesQueryVariables} from "../../generated/graphql";
import gql from "graphql-tag";
import USER_DEFINED_DEVICE_TYPES_QUERY from "../../graphql/queries/userDefinedDeviceTypes.graphql";

const DeviceTypesPage: React.FC = () => {

    const {data, loading, error, refetch} = useQuery<UserDefinedDeviceTypesQuery, UserDefinedDeviceTypesQueryVariables>(gql`${USER_DEFINED_DEVICE_TYPES_QUERY}`)

    return <div className={styles.deviceTypesPage}>
        <h1>Device types</h1>
        <CurrentlyDefinedDeviceTypesSection data={data} loading={loading} error={error}/>
        <NewDeviceTypeForm userDefinedDeviceTypesQueryLoading={loading} userDefinedDeviceTypesQueryError={error} userDefinedDeviceTypesQueryRefetchFunction={refetch}/>
    </div>
}

export default DeviceTypesPage
