import React from 'react'
import EditableTree, { LogicalOperationNodeType } from './components/editable-tree/EditableTree'
import StandardContentPageTemplate from '../../page-independent-components/standard-content-page-template/StandardContentPageTemplate'
import { KPIModel } from './KPIDetailPageController'
import ChangeLogicalOperationTypeModal from './components/change-logical-operation-type-modal/ChangeLogicalOperationTypeModal'

interface KPIDetailPageViewProps {
  kpi: KPIModel
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
  isChangeLogicalOperationTypeModalOpen: boolean
  closeChangeLogicalOperationTypeModal: () => void
  changeLogicalOperationType: (newOperationType: LogicalOperationNodeType) => void
  initiateLogicalOperationNodeModification: (nodeName: string) => void
}

const KPIDetailPageView: React.FC<KPIDetailPageViewProps> = (props) => {
  return (
    <StandardContentPageTemplate pageTitle="KPI detail" anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred}>
      <ChangeLogicalOperationTypeModal isOpen={props.isChangeLogicalOperationTypeModalOpen} onCloseHandler={props.closeChangeLogicalOperationTypeModal} changeLogicalOperationType={props.changeLogicalOperationType}></ChangeLogicalOperationTypeModal>
      <h2>{`${props.kpi.userIdentifier} (ID: ${props.kpi.id})`}</h2>
      <EditableTree editableTreeNodeData={props.kpi} initiateLogicalOperationNodeModification={props.initiateLogicalOperationNodeModification} />
    </StandardContentPageTemplate>
  )
}

export default KPIDetailPageView
