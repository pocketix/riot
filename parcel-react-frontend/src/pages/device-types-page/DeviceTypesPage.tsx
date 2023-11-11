import React from "react"
import styles from "./DeviceTypesPage.module.scss"

import CurrentlyDefinedDeviceTypesSection from "../../components/currently-defined-device-types-section/CurrentlyDefinedDeviceTypesSection"

const DeviceTypesPage: React.FC = () => {

    return <div className={styles.deviceTypesPage}>
        <h1>Device Types</h1>
        <h2>Currently defined device types:</h2>
        <CurrentlyDefinedDeviceTypesSection />
    </div>
}

export default DeviceTypesPage
