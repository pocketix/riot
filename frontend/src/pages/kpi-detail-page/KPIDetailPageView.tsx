import React from 'react'
import EditableTree, { LogicalOperationNodeType } from './components/editable-tree/EditableTree'
import StandardContentPageTemplate from '../../page-independent-components/standard-content-page-template/StandardContentPageTemplate'
import { KPIDefinitionModel } from './KPIDetailPageController'
import ChangeLogicalOperationTypeModal from './components/change-logical-operation-type-modal/ChangeLogicalOperationTypeModal'

interface KPIDetailPageViewProps {
  kpiDefinitionModel: KPIDefinitionModel
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
      <ChangeLogicalOperationTypeModal
        isOpen={props.isChangeLogicalOperationTypeModalOpen}
        onCloseHandler={props.closeChangeLogicalOperationTypeModal}
        changeLogicalOperationType={props.changeLogicalOperationType}
      ></ChangeLogicalOperationTypeModal>
      <h2>{`${props.kpiDefinitionModel.userIdentifier} (ID: ${props.kpiDefinitionModel.id})`}</h2>
      <EditableTree editableTreeNodeData={props.kpiDefinitionModel} initiateLogicalOperationNodeModification={props.initiateLogicalOperationNodeModification} />
    </StandardContentPageTemplate>
  )
}

export default KPIDetailPageView
