import React from 'react'
import StandardContentPageTemplate from '../../page-independent-components/StandardContentPageTemplate'
import { KpiDefinitionsQuery } from '../../generated/graphql'
import GenericCardTemplate from '../../page-independent-components/GenericCardTemplate'
import { useNavigate } from 'react-router-dom'
import AddNewCardButton from '../../page-independent-components/AddNewCardButton'

interface KPIPageViewProps {
  kpiDefinitionsData: KpiDefinitionsQuery
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const KPIPageView: React.FC<KPIPageViewProps> = (props) => {
  const navigate = useNavigate()
  return (
    <StandardContentPageTemplate pageTitle="KPI definitions" anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred}>
      <h2>Current KPI definitions</h2>
      <div className="flex flex-wrap gap-5">
        {props.kpiDefinitionsData &&
          props.kpiDefinitionsData.kpiDefinitions
            .slice()
            .sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
            .map((kpiDefinition) => (
              <GenericCardTemplate // TODO: Consider creating a separate component out of this...
                headerContent={
                  <span onClick={() => navigate(`${kpiDefinition.id}/edit`)} className="material-symbols-outlined cursor-pointer">
                    edit
                  </span>
                }
                bodyContent={
                  <>
                    <p>
                      User identifier: <strong>{kpiDefinition.userIdentifier}</strong>
                    </p>
                    <p>
                      Defined for SD type: <strong>{kpiDefinition.sdTypeSpecification}</strong>
                    </p>
                  </>
                }
              ></GenericCardTemplate>
            ))}
        <AddNewCardButton onClick={() => navigate('create')} />
      </div>
    </StandardContentPageTemplate>
  )
}

export default KPIPageView
