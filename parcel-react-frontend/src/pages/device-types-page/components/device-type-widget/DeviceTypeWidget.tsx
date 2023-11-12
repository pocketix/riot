import React from "react"
import {Collapse} from "@mui/material"
import styles from "./DeviceTypeWidget.module.scss"

interface DeviceTypeParameter {
    id: string
    name: string
    type: "STRING" | "NUMBER" | "BOOLEAN"
}

interface DeviceTypeWidgetProps {
    id: string
    denotation: string
    areParametersDisplayed: boolean
    parameters: DeviceTypeParameter[]
    deleteCertainUserDefinedDeviceType: (id: string) => Promise<void>
}

const DeviceTypeWidget: React.FC<DeviceTypeWidgetProps> = ({id, denotation, areParametersDisplayed, parameters, deleteCertainUserDefinedDeviceType}) => {

    const parameterElements = <>
        <div className={styles.parameterElements}>
            {parameters.map(parameter => (
                <div className={styles.parameterElement}>
                    <p>Name: <strong>{parameter.name}</strong></p>
                    <p>Type: <strong>{parameter.type}</strong></p>
                </div>
            ))}
        </div>
    </>

    return <div className={styles.widget}>
        <div className={styles.upperRow}>
            <p>Denotation: <strong>{denotation}</strong></p>
            <div className={styles.deleteButton} onClick={() => deleteCertainUserDefinedDeviceType(id)}>
                <span className="material-symbols-outlined">delete</span>
            </div>
        </div>
        <Collapse in={areParametersDisplayed}>
            {parameterElements}
        </Collapse>
    </div>
}

export default DeviceTypeWidget
