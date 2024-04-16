import React from 'react'
import EditableTree, { LogicalOperationNodeType } from './components/editable-tree/EditableTree'
import StandardContentPageTemplate from '../../page-independent-components/standard-content-page-template/StandardContentPageTemplate'
import { KPIDefinitionModel } from './KPIDetailPageController'
import ChangeLogicalOperationTypeModal from './components/change-logical-operation-type-modal/ChangeLogicalOperationTypeModal'
import styles from './styles.module.scss'
import { Button, Grid } from '@mui/material'

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
      />
      <p className={styles.kpiUserIdentifier}>
        User identifier: <strong>{props.kpiDefinitionModel.userIdentifier}</strong>
      </p>
      <EditableTree editableTreeNodeData={props.kpiDefinitionModel} initiateLogicalOperationNodeModification={props.initiateLogicalOperationNodeModification} />
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={1}>
          <Button fullWidth>Submit</Button>
        </Grid>
        <Grid item xs={0.1} />
        <Grid item xs={1}>
          <Button fullWidth>Cancel</Button>
        </Grid>
      </Grid>
    </StandardContentPageTemplate>
  )
}

export default KPIDetailPageView
