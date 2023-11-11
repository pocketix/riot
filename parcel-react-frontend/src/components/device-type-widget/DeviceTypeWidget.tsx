import React, {useState} from "react"
import {Collapse, FormControlLabel, Switch} from "@mui/material"
import styles from "./DeviceTypeWidget.module.scss"

interface DeviceTypeParameter {
    id: string
    name: string
    type: "STRING" | "NUMBER" | "BOOLEAN"
}

interface DeviceTypeWidgetProps {
    id: string
    denotation: string
    parameters: DeviceTypeParameter[]
}

const DeviceTypeWidget: React.FC<DeviceTypeWidgetProps> = ({denotation, parameters}) => {

    const [areParametersDisplayed, setParametersDisplayed] = useState<boolean>(true)

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setParametersDisplayed(event.target.checked)
    }

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
        <FormControlLabel control={<Switch checked={areParametersDisplayed} onChange={handleChange} />} label="Display parameters?" />
        <Collapse in={areParametersDisplayed}>
            {parameterElements}
        </Collapse>
    </div>
}

export default DeviceTypeWidget
