import React from 'react'
import StandardContentPageTemplate from '../../page-independent-components/StandardContentPageTemplate'
import AddNewCardButton from '../../page-independent-components/AddNewCardButton'
import { KPIFulfillmentState } from '../../page-independent-components/KPIFulfillmentCheckResultSection'
import { AsynchronousConsumerFunction, ConsumerFunction, EffectFunction } from '../../util'
import SDInstanceGroupCard from './components/SDInstanceGroupCard'

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
            <SDInstanceGroupCard
              key={sdInstanceGroupDataItem.id}
              sdInstanceGroupID={sdInstanceGroupDataItem.id}
              sdInstanceGroupUserIdentifier={sdInstanceGroupDataItem.userIdentifier}
              sdInstanceData={sdInstanceGroupDataItem.sdInstanceData}
              kpiDefinitionData={sdInstanceGroupDataItem.kpiDefinitionData}
              initiateSDInstanceGroupUpdate={props.initiateSDInstanceGroupUpdate}
              deleteSDInstanceGroup={props.deleteSDInstanceGroup}
            />
          ))}
        <AddNewCardButton onClick={props.initiateSDInstanceGroupCreation} />
      </div>
    </StandardContentPageTemplate>
  )
}

export default SDInstanceGroupsPageView
