import { SdInstancesQuery } from '../../../../generated/graphql'
import React from 'react'
import SDInstanceCard from '../sd-instance-card/SDInstanceCard'
import styles from './SDInstanceSection.module.scss'

interface SDInstancesSectionProps {
  sdInstancesQueryData: SdInstancesQuery
  updateUserIdentifierOfSdInstance: (id: string, newUserIdentifier: string) => Promise<void>
}

const SDInstancesSection: React.FC<SDInstancesSectionProps> = (props) => {
  return (
    <div className={styles.section}>
      {props.sdInstancesQueryData &&
        props.sdInstancesQueryData.sdInstances
          .slice()
          .sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
          .map((sdInstance) => <SDInstanceCard key={sdInstance.id} id={sdInstance.id} userIdentifier={sdInstance.userIdentifier} uid={sdInstance.uid} sdTypeDenotation={sdInstance.type.denotation} updateUserIdentifierOfSdInstance={props.updateUserIdentifierOfSdInstance} />)}
    </div>
  )
}

export default SDInstancesSection
