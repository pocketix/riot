import React, {useState} from "react"
import {ApolloError} from '@apollo/client'
import {UserDefinedDeviceTypesQuery} from '../../generated/graphql'
import {Alert, CircularProgress, FormControlLabel, Switch} from "@mui/material"
import DeviceTypeWidget from "../device-type-widget/DeviceTypeWidget"
import styles from "./CurrentlyDefinedDeviceTypesSection.module.scss"

interface CurrentlyDefinedDeviceTypesSectionProps {
    data: UserDefinedDeviceTypesQuery
    loading: boolean
    error: ApolloError
}

const CurrentlyDefinedDeviceTypesSection: React.FC<CurrentlyDefinedDeviceTypesSectionProps> = ({data, loading, error}) => {

    const [areParametersDisplayed, setParametersDisplayed] = useState<boolean>(true)

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
                    <DeviceTypeWidget id={deviceType.id} denotation={deviceType.denotation} areParametersDisplayed={areParametersDisplayed} parameters={deviceType.parameters} />
                ))}
            </div>
        </div>
    }
}

export default CurrentlyDefinedDeviceTypesSection
