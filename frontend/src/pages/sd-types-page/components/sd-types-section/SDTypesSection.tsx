import React, { useState } from 'react'
import { SdTypesQuery } from '../../../../generated/graphql'
import { FormControlLabel, Switch } from '@mui/material'
import SDTypeCard from '../sd-type-card/SDTypeCard'
import styles from './styles.module.scss'

interface SDTypesSectionProps {
  sdTypesQueryData: SdTypesQuery
  deleteSDType: (id: string) => Promise<void>
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const SDTypesSection: React.FC<SDTypesSectionProps> = (props) => {
  const [areParametersDisplayed, setParametersDisplayed] = useState<boolean>(true)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setParametersDisplayed(event.target.checked)
  }

  return (
    <div className={styles.sectionContainer}>
      <h2>Current SD type definitions</h2>
      <FormControlLabel control={<Switch checked={areParametersDisplayed} onChange={handleChange} />} label="Display parameters?" />
      <div className={styles.section}>
        {props.sdTypesQueryData &&
          props.sdTypesQueryData.sdTypes
            .slice()
            .sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
            .map((sdType) => {
              const deleteButtonDisabled: boolean =
                props.sdTypesQueryData && props.sdTypesQueryData.sdInstances && props.sdTypesQueryData.sdInstances.some((sdInstance) => sdInstance.type.id === sdType.id)
              return (
                <SDTypeCard
                  key={sdType.id}
                  id={sdType.id}
                  denotation={sdType.denotation}
                  areParametersDisplayed={areParametersDisplayed}
                  parameters={sdType.parameters}
                  deleteSDType={props.deleteSDType}
                  anyLoadingOccurs={props.anyLoadingOccurs}
                  anyErrorOccurred={props.anyErrorOccurred}
                  isDeleteButtonDisabled={deleteButtonDisabled}
                />
              )
            })}
      </div>
    </div>
  )
}

export default SDTypesSection
