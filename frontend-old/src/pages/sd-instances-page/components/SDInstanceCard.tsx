import React, { useMemo, useState } from 'react'
import GenericCardTemplate from '../../../page-independent-components/GenericCardTemplate'
import { Button } from '@mui/material'
import { AsynchronousBiConsumerFunction, AsynchronousConsumerFunction } from '../../../util'
import { SdInstanceMode, SdInstancesPageDataQuery } from '../../../generated/graphql'
import KPIFulfillmentCheckResultSection, { KPIFulfillmentState } from '../../../page-independent-components/KPIFulfillmentCheckResultSection'
import MUIBasedTextField, { MUIBasedTextFieldType } from '../../../page-independent-components/mui-based/MUIBasedTextField'

interface SDInstanceCardProps {
  id: string
  userIdentifier: string
  uid: string
  sdTypeDenotation: string
  sdTypeID: string
  confirmedByUser: boolean
  updateUserIdentifierOfSdInstance: AsynchronousBiConsumerFunction<string, string>
  confirmSdInstance: AsynchronousConsumerFunction<string>
  sdInstancePageData: SdInstancesPageDataQuery
}

const SDInstanceCard: React.FC<SDInstanceCardProps> = (props) => {
  const [userIdentifier, setUserIdentifier] = useState<string>(props.userIdentifier)

  const fulfillmentCheckResults = useMemo(() => {
    return props.sdInstancePageData.kpiFulfillmentCheckResults.filter((kpiFulfillmentCheckResult) => kpiFulfillmentCheckResult.sdInstanceID === props.id)
  }, [props.sdInstancePageData.kpiFulfillmentCheckResults, props.id])

  const kpiDefinitions = useMemo(() => {
    return props.sdInstancePageData.kpiDefinitions.filter((kpiDefinition) => {
      return kpiDefinition.sdTypeID === props.sdTypeID && (kpiDefinition.sdInstanceMode === SdInstanceMode.All || kpiDefinition.selectedSDInstanceUIDs.indexOf(props.uid) !== -1)
    })
  }, [props.sdInstancePageData.kpiDefinitions, props.sdTypeID, props.uid])

  const displayFulfillmentCheckResultSection = useMemo(() => props.confirmedByUser && kpiDefinitions.length > 0, [props.confirmedByUser, kpiDefinitions])

  const kpiDefinitionFulfillmentMap: { [key: string]: boolean | null } = useMemo(() => {
    return kpiDefinitions.reduce((map, kpiDefinition) => {
      const result = fulfillmentCheckResults.find((result) => result.kpiDefinitionID === kpiDefinition.id)
      map[kpiDefinition.id] = result?.fulfilled ?? null
      return map
    }, {})
  }, [kpiDefinitions, fulfillmentCheckResults])

  return (
    <GenericCardTemplate className="max-w-[500px]">
      <div className="flex flex-col gap-1 text-[18px]">
        {props.confirmedByUser && (
          <div className="flex items-baseline gap-1">
            <p className="mb-1 mt-1">User identifier:</p>
            <MUIBasedTextField
              content={userIdentifier}
              onContentChange={setUserIdentifier}
              type={MUIBasedTextFieldType.Plain}
              onBlur={async () => {
                if (userIdentifier === '') {
                  setUserIdentifier(props.userIdentifier)
                  return
                }
                await props.updateUserIdentifierOfSdInstance(props.id, userIdentifier)
              }}
              sx={{
                flexGrow: 1
              }}
            />
          </div>
        )}
        <p className="mb-1 mt-1 truncate">
          UID: <strong className="font-bold">{props.uid}</strong>
        </p>
        <p className="mb-1 mt-1">
          SD type denotation: <strong className="font-bold">{props.sdTypeDenotation}</strong>
        </p>
        {!props.confirmedByUser && (
          <Button sx={{ border: '2px solid black' }} onClick={() => props.confirmSdInstance(props.id)}>
            Confirm this SD instance
          </Button>
        )}
      </div>
      {displayFulfillmentCheckResultSection && (
        <KPIFulfillmentCheckResultSection
          kpiFulfillmentCheckResultsData={kpiDefinitions.map((kpiDefinition) => {
            return {
              kpiDefinitionData: {
                id: kpiDefinition.id,
                userIdentifier: kpiDefinition.userIdentifier
              },
              kpiFulfillmentState: ((fulfilled: boolean | null): KPIFulfillmentState => {
                return fulfilled === null ? KPIFulfillmentState.Unknown : fulfilled ? KPIFulfillmentState.Fulfilled : KPIFulfillmentState.Unfulfilled
              })(kpiDefinitionFulfillmentMap[kpiDefinition.id])
            }
          })}
        />
      )}
    </GenericCardTemplate>
  )
}

export default SDInstanceCard
