import React from 'react'
import EditableTree, { LogicalOperationNodeType } from './components/editable-tree/EditableTree'
import StandardContentPageTemplate from '../../page-independent-components/standard-content-page-template/StandardContentPageTemplate'
import { KPIDefinitionModel } from './KPIDetailPageController'
import SelectLogicalOperationTypeModal from './components/select-logical-operation-type-modal/SelectLogicalOperationTypeModal'
import styles from './styles.module.scss'
import { Button, Grid } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import SelectNodeTypeModal from './components/select-new-node-type-modal/SelectNodeTypeModal'

interface KPIDetailPageViewProps {
  kpiDefinitionModel: KPIDefinitionModel
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
  isSelectLogicalOperationTypeModalOpen: boolean
  isSelectNewNodeTypeModalOpen: boolean
  closeSelectLogicalOperationTypeModal: () => void
  closeSelectNewNodeTypeModal: () => void
  selectedLogicalOperationTypeHandler: (logicalOperationType: LogicalOperationNodeType) => void
  initiateLogicalOperationNodeModification: (nodeName: string) => void
  initiateNewNodeCreation: (nodeName: string) => void
  initiateNewLogicalOperationNodeCreation: () => void
}

const KPIDetailPageView: React.FC<KPIDetailPageViewProps> = (props) => {
  const navigate = useNavigate()
  return (
    <StandardContentPageTemplate pageTitle="KPI detail" anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred}>
      <SelectLogicalOperationTypeModal
        isOpen={props.isSelectLogicalOperationTypeModalOpen}
        onCloseHandler={props.closeSelectLogicalOperationTypeModal}
        selectedLogicalOperationTypeHandler={props.selectedLogicalOperationTypeHandler}
      />
      <SelectNodeTypeModal
        isOpen={props.isSelectNewNodeTypeModalOpen}
        onCloseHandler={props.closeSelectNewNodeTypeModal}
        initiateNewLogicalOperationNodeCreation={props.initiateNewLogicalOperationNodeCreation}
      />
      <p className={styles.kpiUserIdentifier}>
        User identifier: <strong>{props.kpiDefinitionModel.userIdentifier}</strong>
      </p>
      <EditableTree
        editableTreeNodeData={props.kpiDefinitionModel}
        initiateLogicalOperationNodeModification={props.initiateLogicalOperationNodeModification}
        initiateNewNodeCreation={props.initiateNewNodeCreation}
      />
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={1}>
          <Button fullWidth>Submit</Button>
        </Grid>
        <Grid item xs={0.1} />
        <Grid item xs={1}>
          <Button fullWidth onClick={() => navigate('/kpi-definitions')}>
            Cancel
          </Button>
        </Grid>
      </Grid>
    </StandardContentPageTemplate>
  )
}

export default KPIDetailPageView
