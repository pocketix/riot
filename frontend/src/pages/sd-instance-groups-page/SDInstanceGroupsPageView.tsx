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
      <h2>Currently defined SD instance groups</h2>
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
                  <p>
                    User identifier: <strong>{sdInstanceGroupDataItem.userIdentifier}</strong>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <p>SD instances:</p>
                    {sdInstanceGroupDataItem.sdInstanceData.map((sdInstanceDataItem, index, array) => {
                      return (
                        <p key={sdInstanceDataItem.id}>
                          <strong>{`${sdInstanceDataItem.userIdentifier}${index !== array.length - 1 ? ',' : ''}`}</strong>
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
              className="max-w-[400px]"
            ></GenericCardTemplate>
          ))}
        <AddNewCardButton onClick={() => {}} />
      </div>
    </StandardContentPageTemplate>
  )
}

export default SDInstanceGroupsPageView
