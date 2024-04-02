import React from 'react'
import { SdInstancesQuery } from '../../generated/graphql'
import StandardContentPageTemplate from '../../page-independent-components/standard-content-page-template/StandardContentPageTemplate'
import styles from './SDInstancesPageView.module.scss'
import SDInstancesSection from './components/sd-instances-section/SDInstancesSection'

interface SDTypesPageViewProps {
  sdInstancesQueryData: SdInstancesQuery
  refetchSDInstances: () => Promise<void>
  updateUserIdentifierOfSdInstance: (id: string, newUserIdentifier: string) => Promise<void>
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const SDInstancesPageView: React.FC<SDTypesPageViewProps> = (props) => {
  return (
    <StandardContentPageTemplate pageTitle="SD instances" anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred}>
      <div className={styles.sdInstancesSectionTitle}>
        <h2>Currently registered SD instances</h2>
        <span onClick={props.refetchSDInstances} className={`material-symbols-outlined ${styles.pointerCursor}`}>
          refresh
        </span>
      </div>
      <SDInstancesSection sdInstancesQueryData={props.sdInstancesQueryData} updateUserIdentifierOfSdInstance={props.updateUserIdentifierOfSdInstance}></SDInstancesSection>
    </StandardContentPageTemplate>
  )
}

export default SDInstancesPageView
