import React from "react"
import styles from "./DeviceTypesPage.module.scss"

import CurrentlyDefinedDeviceTypesSection from "../../components/currently-defined-device-types-section/CurrentlyDefinedDeviceTypesSection"
import NewDeviceTypeForm from "../../components/new-device-type-form/NewDeviceTypeForm"

const DeviceTypesPage: React.FC = () => {

    return <div className={styles.deviceTypesPage}>
        <h1>Device types</h1>
        <CurrentlyDefinedDeviceTypesSection />
        <NewDeviceTypeForm />
    </div>
}

export default DeviceTypesPage
