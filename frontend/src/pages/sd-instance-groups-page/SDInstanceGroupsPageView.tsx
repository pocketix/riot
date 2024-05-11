import React from 'react'
import StandardContentPageTemplate from '../../page-independent-components/StandardContentPageTemplate'
import GenericCardTemplate from '../../page-independent-components/GenericCardTemplate'
import AddNewCardButton from '../../page-independent-components/AddNewCardButton'
import KPIFulfillmentCheckResultSection, { KPIFulfillmentState } from '../../page-independent-components/KPIFulfillmentCheckResultSection'

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
              headerContent={
                <>
                  <span onClick={() => {}} className="material-symbols-outlined cursor-pointer">
                    edit
                  </span>
                  <span onClick={() => {}} className="material-symbols-outlined cursor-pointer">
                    delete
                  </span>
                </>
              }
              bodyContent={
                <>
                  <p className="text-[24px]">
                    User identifier: <strong>{sdInstanceGroupDataItem.userIdentifier}</strong>
                  </p>
                  <div className="flex flex-wrap">
                    <p className="text-[24px]">SD instances:</p>
                    {sdInstanceGroupDataItem.sdInstanceData.map((sdInstanceDataItem, index, array) => {
                      return (
                        <p key={sdInstanceDataItem.id} className={`text-[24px] ${index === 0 ? 'ml-1.5' : 'ml-2'}`}>
                          <strong>{sdInstanceDataItem.userIdentifier}</strong>
                          {index !== array.length - 1 ? ',' : ''}
                        </p>
                      )
                    })}
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
                </>
              }
              className="max-w-[500px]"
            ></GenericCardTemplate>
          ))}
        <AddNewCardButton onClick={() => {}} />
      </div>
    </StandardContentPageTemplate>
  )
}

export default SDInstanceGroupsPageView
