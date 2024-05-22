import React from 'react'
import StandardContentPageTemplate from '../../page-independent-components/StandardContentPageTemplate'
import GenericCardTemplate from '../../page-independent-components/GenericCardTemplate'
import AddNewCardButton from '../../page-independent-components/AddNewCardButton'
import KPIFulfillmentCheckResultSection, { KPIFulfillmentState } from '../../page-independent-components/KPIFulfillmentCheckResultSection'
import { AsynchronousConsumerFunction, ConsumerFunction, EffectFunction } from '../../util'

export interface SDInstanceGroupData {
  id: string
  userIdentifier: string
  sdInstanceData: {
    id: string
    userIdentifier: string
  }[]
  kpiDefinitionData: {
    id: string
    userIdentifier: string
    fulfillmentState: KPIFulfillmentState
  }[]
}

interface SDInstanceGroupsPageViewProps {
  sdInstanceGroupsPageData: SDInstanceGroupData[]
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
  initiateSDInstanceGroupCreation: EffectFunction
  initiateSDInstanceGroupUpdate: ConsumerFunction<string>
  deleteSDInstanceGroup: AsynchronousConsumerFunction<string>
}

const SDInstanceGroupsPageView: React.FC<SDInstanceGroupsPageViewProps> = (props) => {
  return (
    <StandardContentPageTemplate pageTitle="SD instance groups" anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred}>
      <div className="flex flex-wrap gap-5">
        {props.sdInstanceGroupsPageData
          .slice()
          .sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
          .map((sdInstanceGroupDataItem) => (
            <GenericCardTemplate // TODO: Consider creating a separate component out of this...
              key={sdInstanceGroupDataItem.id}
              onEdit={() => props.initiateSDInstanceGroupUpdate(sdInstanceGroupDataItem.id)}
              onDelete={() => props.deleteSDInstanceGroup(sdInstanceGroupDataItem.id)}
              className="max-w-[500px]"
            >
              <p className="text-[24px]">
                User identifier: <strong>{sdInstanceGroupDataItem.userIdentifier}</strong>
              </p>
              <div className="flex flex-col">
                <p className="text-[24px]">SD instances:</p>
                <ul>
                  {sdInstanceGroupDataItem.sdInstanceData.map((sdInstanceDataItem) => (
                    <li key={sdInstanceDataItem.id} className="text-[24px] font-bold">
                      {sdInstanceDataItem.userIdentifier}
                    </li>
                  ))}
                </ul>
              </div>
              {sdInstanceGroupDataItem.kpiDefinitionData.length > 0 && (
                <KPIFulfillmentCheckResultSection
                  kpiFulfillmentCheckResultsData={sdInstanceGroupDataItem.kpiDefinitionData.map((kpiDefinition) => {
                    return {
                      kpiDefinitionData: {
                        id: kpiDefinition.id,
                        userIdentifier: kpiDefinition.userIdentifier
                      },
                      kpiFulfillmentState: kpiDefinition.fulfillmentState
                    }
                  })}
                />
              )}
            </GenericCardTemplate>
          ))}
        <AddNewCardButton onClick={props.initiateSDInstanceGroupCreation} />
      </div>
    </StandardContentPageTemplate>
  )
}

export default SDInstanceGroupsPageView
