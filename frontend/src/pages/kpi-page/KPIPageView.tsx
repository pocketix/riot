import React from 'react'
import StandardContentPageTemplate from '../../page-independent-components/standard-content-page-template/StandardContentPageTemplate'
import { KpiDefinitionsQuery } from '../../generated/graphql'
import styles from './styles.module.scss'
import GenericCardTemplate from '../../page-independent-components/generic-card-template/GenericCardTemplate'
import { useNavigate } from 'react-router-dom'

interface KPIPageViewProps {
  kpiDefinitionsData: KpiDefinitionsQuery
  refetchKPIDefinitions: () => Promise<void>
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const KPIPageView: React.FC<KPIPageViewProps> = (props) => {
  const navigate = useNavigate()
  return (
    <StandardContentPageTemplate pageTitle="KPI definitions" anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred}>
      <h2>Current KPI definitions</h2>
      <div className={styles.section}>
        {props.kpiDefinitionsData && props.kpiDefinitionsData.kpiDefinitions.length === 0 && <p>No KPI definitions yet...</p>}
        {props.kpiDefinitionsData &&
          props.kpiDefinitionsData.kpiDefinitions
            .slice()
            .sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
            .map((kpiDefinition) => (
              <GenericCardTemplate // TODO: Consider creating a separate component out of this...
                headerContent={
                  <span onClick={() => navigate(`${kpiDefinition.id}/edit`)} className={`material-symbols-outlined ${styles.pointerCursor}`}>
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
        <GenericCardTemplate
          headerContent={<></>}
          bodyContent={<span className="material-symbols-outlined">add_circle</span>}
          onClickHandler={() => navigate('create')}
          className={styles.createDefinitionButton}
        ></GenericCardTemplate>
      </div>
    </StandardContentPageTemplate>
  )
}

export default KPIPageView
