import React from 'react'
import KPIFulfillmentCheckResultSection, { KPIFulfillmentState } from '../../../page-independent-components/KPIFulfillmentCheckResultSection'
import GenericCardTemplate from '../../../page-independent-components/GenericCardTemplate'
import { AsynchronousConsumerFunction, ConsumerFunction } from '../../../util'

interface SDInstanceGroupCardProps {
  sdInstanceGroupID: string
  sdInstanceGroupUserIdentifier: string
  sdInstanceData: {
    id: string
    userIdentifier: string
  }[]
  kpiDefinitionData: {
    id: string
    userIdentifier: string
    fulfillmentState: KPIFulfillmentState
  }[]
  initiateSDInstanceGroupUpdate: ConsumerFunction<string>
  deleteSDInstanceGroup: AsynchronousConsumerFunction<string>
}

const SDInstanceGroupCard: React.FC<SDInstanceGroupCardProps> = (props) => {
  return (
    <GenericCardTemplate onEdit={() => props.initiateSDInstanceGroupUpdate(props.sdInstanceGroupID)} onDelete={() => props.deleteSDInstanceGroup(props.sdInstanceGroupID)} className="max-w-[500px]">
      <p className="text-[24px]">
        User identifier: <strong>{props.sdInstanceGroupUserIdentifier}</strong>
      </p>
      <div className="flex flex-col">
        <p className="text-[24px]">SD instances:</p>
        <ul>
          {props.sdInstanceData.map((sdInstanceDataItem) => (
            <li key={sdInstanceDataItem.id} className="truncate text-[24px] font-bold">
              {sdInstanceDataItem.userIdentifier}
            </li>
          ))}
        </ul>
      </div>
      {props.kpiDefinitionData.length > 0 && (
        <KPIFulfillmentCheckResultSection
          kpiFulfillmentCheckResultsData={props.kpiDefinitionData.map((kpiDefinitionDataItem) => {
            return {
              kpiDefinitionData: {
                id: kpiDefinitionDataItem.id,
                userIdentifier: kpiDefinitionDataItem.userIdentifier
              },
              kpiFulfillmentState: kpiDefinitionDataItem.fulfillmentState
            }
          })}
        />
      )}
    </GenericCardTemplate>
  )
}

export default SDInstanceGroupCard
