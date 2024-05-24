import React from 'react'
import StandardContentPageTemplate, { StandardContentTemplatePageProps } from '../../page-independent-components/StandardContentPageTemplate'
import { KpiDefinitionsQuery, SdInstanceMode } from '../../generated/graphql'
import GenericCardTemplate from '../../page-independent-components/GenericCardTemplate'
import AddNewCardButton from '../../page-independent-components/AddNewCardButton'
import { ConsumerFunction, useChangeURL } from '../../util'

interface KPIPageViewProps extends Omit<StandardContentTemplatePageProps, 'pageTitle' | 'children'> {
  kpiDefinitionsData: KpiDefinitionsQuery
  initiateKPIDefinitionDeletion: ConsumerFunction<string>
}

const KPIPageView: React.FC<KPIPageViewProps> = (props) => {
  const changeURL = useChangeURL()
  return (
    <StandardContentPageTemplate pageTitle="KPI definitions" anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred}>
      <div className="flex flex-wrap gap-5">
        {props.kpiDefinitionsData &&
          props.kpiDefinitionsData.kpiDefinitions
            .slice()
            .sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
            .map((kpiDefinition) => (
              <GenericCardTemplate // TODO: Consider creating a separate component out of this...
                onEdit={() => changeURL(`${kpiDefinition.id}/edit`)}
                onDelete={() => props.initiateKPIDefinitionDeletion(kpiDefinition.id)}
              >
                <p>
                  User identifier: <strong>{kpiDefinition.userIdentifier}</strong>
                </p>
                <p>
                  Defined for SD type: <strong>{kpiDefinition.sdTypeSpecification}</strong>
                </p>
                <p>
                  Fulfillment check upon: <strong>{`${kpiDefinition.sdInstanceMode === SdInstanceMode.All ? 'all' : 'selected'} SD instances`}</strong>
                </p>
              </GenericCardTemplate>
            ))}
        <AddNewCardButton onClick={() => changeURL('create')} />
      </div>
    </StandardContentPageTemplate>
  )
}

export default KPIPageView
