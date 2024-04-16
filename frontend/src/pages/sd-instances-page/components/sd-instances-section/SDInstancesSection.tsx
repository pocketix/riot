import { SdInstancesQuery } from '../../../../generated/graphql'
import React, { useMemo } from 'react'
import SDInstanceCard from '../sd-instance-card/SDInstanceCard'
import styles from './styles.module.scss'

interface ConfirmedSDInstancesSectionProps {
  sdInstancesData: SdInstancesQuery
  confirmedByUserRequirement: boolean
  updateUserIdentifierOfSdInstance: (id: string, newUserIdentifier: string) => Promise<void>
  confirmSdInstance: (id: string) => Promise<void>
}

const SDInstancesSection: React.FC<ConfirmedSDInstancesSectionProps> = (props) => {
  const confirmedByUserRequirement = props.confirmedByUserRequirement
  const sdInstances = useMemo(() => {
    if (props.sdInstancesData) {
      return props.sdInstancesData.sdInstances.filter((sdInstance) => sdInstance.confirmedByUser === confirmedByUserRequirement)
    } else {
      return []
    }
  }, [props.sdInstancesData, props.confirmedByUserRequirement])
  return (
    <div className={styles.section}>
      {sdInstances.length === 0 && <p>No SD instances of this kind...</p>}
      {sdInstances
        .slice()
        .sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
        .map((sdInstance) => (
          <SDInstanceCard
            key={sdInstance.id}
            id={sdInstance.id}
            userIdentifier={sdInstance.userIdentifier}
            uid={sdInstance.uid}
            sdTypeDenotation={sdInstance.type.denotation}
            confirmedByUser={confirmedByUserRequirement}
            updateUserIdentifierOfSdInstance={props.updateUserIdentifierOfSdInstance}
            confirmSdInstance={props.confirmSdInstance}
          />
        ))}
    </div>
  )
}

export default SDInstancesSection
