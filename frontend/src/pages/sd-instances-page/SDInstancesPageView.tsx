import React, { useState } from 'react'
import { SdInstancesPageDataQuery } from '../../generated/graphql'
import StandardContentPageTemplate from '../../page-independent-components/StandardContentPageTemplate'
import SDInstancesSection from './components/SDInstancesSection'
import { AsynchronousBiConsumerFunction, AsynchronousConsumerFunction } from '../../util'
import { FormControlLabel, Switch } from '@mui/material'

interface SDTypesPageViewProps {
  sdInstancesPageData: SdInstancesPageDataQuery
  updateUserIdentifierOfSdInstance: AsynchronousBiConsumerFunction<string, string>
  confirmSdInstance: AsynchronousConsumerFunction<string>
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const SDInstancesPageView: React.FC<SDTypesPageViewProps> = (props) => {
  const [confirmedInstancesDisplayed, setConfirmedInstancesDisplayed] = useState<boolean>(true)
  const [notYetConfirmedInstancesDisplayed, setNotYetConfirmedInstancesDisplayed] = useState<boolean>(true)
  return (
    <StandardContentPageTemplate pageTitle="SD instances" anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred}>
      <div className="flex gap-5">
        <FormControlLabel
          control={
            <Switch
              checked={confirmedInstancesDisplayed}
              onChange={(e) => {
                setConfirmedInstancesDisplayed(e.target.checked)
              }}
            />
          }
          label="Display SD instances confirmed by user?"
        />
        <FormControlLabel
          control={
            <Switch
              checked={notYetConfirmedInstancesDisplayed}
              onChange={(e) => {
                setNotYetConfirmedInstancesDisplayed(e.target.checked)
              }}
            />
          }
          label="Display SD instances not yet confirmed by user?"
        />
      </div>
      {confirmedInstancesDisplayed && (
        <>
          <h2>SD instances confirmed by user</h2>
          <SDInstancesSection
            sdInstancePageData={props.sdInstancesPageData}
            confirmedByUserRequirement={true}
            updateUserIdentifierOfSdInstance={props.updateUserIdentifierOfSdInstance}
            confirmSdInstance={props.confirmSdInstance}
          />
        </>
      )}
      {notYetConfirmedInstancesDisplayed && (
        <>
          <h2>SD instances not yet confirmed by user</h2>
          <SDInstancesSection
            sdInstancePageData={props.sdInstancesPageData}
            confirmedByUserRequirement={false}
            updateUserIdentifierOfSdInstance={props.updateUserIdentifierOfSdInstance}
            confirmSdInstance={props.confirmSdInstance}
          />
        </>
      )}
    </StandardContentPageTemplate>
  )
}

export default SDInstancesPageView
