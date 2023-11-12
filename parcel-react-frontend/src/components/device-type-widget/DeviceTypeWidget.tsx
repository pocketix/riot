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
}

const DeviceTypeWidget: React.FC<DeviceTypeWidgetProps> = ({denotation, areParametersDisplayed, parameters}) => {

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
        <p>Denotation: <strong>{denotation}</strong></p>
        <Collapse in={areParametersDisplayed}>
            {parameterElements}
        </Collapse>
    </div>
}

export default DeviceTypeWidget
