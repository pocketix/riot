import React from 'react'
import { SdInstancesQuery } from '../../generated/graphql'
import StandardContentPageTemplate from '../../page-independent-components/standard-content-page-template/StandardContentPageTemplate'
import styles from './styles.module.scss'
import SDInstancesSection from './components/sd-instances-section/SDInstancesSection'

interface SDTypesPageViewProps {
  sdInstancesData: SdInstancesQuery
  updateUserIdentifierOfSdInstance: (id: string, newUserIdentifier: string) => Promise<void>
  confirmSdInstance: (id: string) => Promise<void>
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const SDInstancesPageView: React.FC<SDTypesPageViewProps> = (props) => {
  return (
    <StandardContentPageTemplate pageTitle="SD instances" anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred}>
      <div className={styles.sdInstancesSectionTitle}>
        <h2>Currently registered SD instances</h2>
      </div>
      <div className={styles.sdInstancesSectionTitle}>
        <h3>SD instances confirmed by user</h3>
      </div>
      <SDInstancesSection
        sdInstancesData={props.sdInstancesData}
        confirmedByUserRequirement={true}
        updateUserIdentifierOfSdInstance={props.updateUserIdentifierOfSdInstance}
        confirmSdInstance={props.confirmSdInstance}
      />
      <div className={styles.sdInstancesSectionTitle}>
        <h3>SD instances not yet confirmed by user</h3>
      </div>
      <SDInstancesSection
        sdInstancesData={props.sdInstancesData}
        confirmedByUserRequirement={false}
        updateUserIdentifierOfSdInstance={props.updateUserIdentifierOfSdInstance}
        confirmSdInstance={props.confirmSdInstance}
      />
    </StandardContentPageTemplate>
  )
}

export default SDInstancesPageView
