import { SdInstancesQuery } from '../../../../generated/graphql'
import React, { useMemo } from 'react'
import SDInstanceCard from '../sd-instance-card/SDInstanceCard'
import styles from './SDInstanceSection.module.scss'

interface ConfirmedSDInstancesSectionProps {
  sdInstancesQueryData: SdInstancesQuery
  isSectionOfSDInstancesConfirmedByUser: boolean
  updateUserIdentifierOfSdInstance: (id: string, newUserIdentifier: string) => Promise<void>
  confirmSdInstance: (id: string) => Promise<void>
}

const SDInstancesSection: React.FC<ConfirmedSDInstancesSectionProps> = (props) => {
  const sdInstances = useMemo(() => {
    if (props.sdInstancesQueryData) {
      return props.sdInstancesQueryData.sdInstances.filter((sdInstance) => sdInstance.confirmedByUser == props.isSectionOfSDInstancesConfirmedByUser)
    } else {
      return []
    }
  }, [props.sdInstancesQueryData, props.isSectionOfSDInstancesConfirmedByUser])
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
            confirmedByUser={props.isSectionOfSDInstancesConfirmedByUser}
            updateUserIdentifierOfSdInstance={props.updateUserIdentifierOfSdInstance}
            confirmSdInstance={props.confirmSdInstance}
          />
        ))}
    </div>
  )
}

export default SDInstancesSection
