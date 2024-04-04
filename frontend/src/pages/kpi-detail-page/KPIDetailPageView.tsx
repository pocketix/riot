import React from 'react'
import EditableTree from './components/editable-tree/EditableTree'
import StandardContentPageTemplate from '../../page-independent-components/standard-content-page-template/StandardContentPageTemplate'
import {KPIModel} from "./KPIDetailPageController";

interface KPIDetailPageViewProps {
  kpi: KPIModel
}

const KPIDetailPageView: React.FC<KPIDetailPageViewProps> = (props) => {
  return (
    <StandardContentPageTemplate pageTitle="KPI detail" anyLoadingOccurs={false} anyErrorOccurred={false}>
        <h2>{`${props.kpi.userIdentifier} (ID: ${props.kpi.id})`}</h2>
        <EditableTree editableTreeNodeData={props.kpi} />
    </StandardContentPageTemplate>
  )
}

export default KPIDetailPageView
