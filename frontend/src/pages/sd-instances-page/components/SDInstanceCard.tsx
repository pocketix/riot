import React, { useMemo, useState } from 'react'
import GenericCardTemplate from '../../../page-independent-components/GenericCardTemplate'
import { Button } from '@mui/material'
import { PlainTextField } from '../../../page-independent-components/mui-based/Styled'
import { AsynchronousBiConsumerFunction, AsynchronousConsumerFunction } from '../../../util'
import { SdInstancesPageDataQuery } from '../../../generated/graphql'
import KPIFulfillmentCheckResultSection, { KPIFulfillmentState } from '../../../page-independent-components/KPIFulfillmentCheckResultSection'

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
    return props.sdInstancePageData.kpiDefinitions.filter((kpiDefinition) => kpiDefinition.sdTypeID === props.sdTypeID)
  }, [props.sdInstancePageData.kpiDefinitions, props.sdTypeDenotation])

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
            <PlainTextField
              sx={{
                flexGrow: 1
              }}
              id="standard-basic"
              label=""
              variant="standard"
              value={userIdentifier}
              onChange={(e) => setUserIdentifier(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              onBlur={async () => {
                if (userIdentifier === '') {
                  setUserIdentifier(props.userIdentifier)
                  return
                }
                await props.updateUserIdentifierOfSdInstance(props.id, userIdentifier)
              }}
            />
          </div>
        )}
        <p className="mb-1 mt-1">
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
