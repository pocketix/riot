import React, { useCallback, useMemo } from 'react'
import { Collapse } from '@mui/material'
import styles from './styles.module.scss'
import GenericCardTemplate from '../../../../page-independent-components/generic-card-template/GenericCardTemplate'

interface SDTypeParameter {
  id: string
  denotation: string
  type: 'STRING' | 'NUMBER' | 'BOOLEAN'
}

interface SDTypeCardProps {
  id: string
  denotation: string
  areParametersDisplayed: boolean
  parameters: SDTypeParameter[]
  deleteSDType: (id: string) => Promise<void>
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
  isDeleteButtonDisabled: boolean
}

const SDTypeCard: React.FC<SDTypeCardProps> = (props) => {
  const deleteButtonDisabled: boolean = useMemo<boolean>(() => props.isDeleteButtonDisabled || props.anyErrorOccurred, [props.isDeleteButtonDisabled, props.anyErrorOccurred])

  const onDeleteHandler = useCallback(async () => {
    if (deleteButtonDisabled) {
      return
    }
    await props.deleteSDType(props.id)
  }, [deleteButtonDisabled, props.deleteSDType, props.id])

  return (
    <GenericCardTemplate
      headerContent={
        <>
          <div className={`${deleteButtonDisabled ? styles.deleteButtonDisabled : styles.deleteButton}`} onClick={() => onDeleteHandler()}>
            <span className="material-symbols-outlined">delete</span>
          </div>
        </>
      }
      bodyContent={
        <>
          <p>
            Denotation: <strong>{props.denotation}</strong>
          </p>
          <Collapse in={props.areParametersDisplayed}>
            <div className={styles.parameterElements}>
              {props.parameters.map((parameter) => (
                <div key={parameter.id} className={styles.parameterElement}>
                  <p>
                    Denotation: <strong>{parameter.denotation}</strong>
                  </p>
                  <p>
                    Type: <strong>{parameter.type}</strong>
                  </p>
                </div>
              ))}
            </div>
          </Collapse>
        </>
      }
    ></GenericCardTemplate>
  )
}

export default SDTypeCard
