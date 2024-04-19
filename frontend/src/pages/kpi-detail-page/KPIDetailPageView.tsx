import React from 'react'
import EditableTree, { AtomNodeType, LogicalOperationNodeType } from './components/editable-tree/EditableTree'
import StandardContentPageTemplate from '../../page-independent-components/standard-content-page-template/StandardContentPageTemplate'
import { KPIDefinitionModel } from './KPIDetailPageController'
import SelectLogicalOperationTypeModal from './components/select-logical-operation-type-modal/SelectLogicalOperationTypeModal'
import styles from './styles.module.scss'
import { Button, FormControl, Grid, InputLabel, MenuItem, Select } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import SelectNodeTypeModal from './components/select-new-node-type-modal/SelectNodeTypeModal'
import AtomNodeModal from './components/atom-node-modal/AtomNodeModal'
import { SdType, SdTypesQuery } from '../../generated/graphql'

interface KPIDetailPageViewProps {
  kpiDefinitionModel: KPIDefinitionModel
  sdTypesData: SdTypesQuery
  sdTypeData: SdType
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
  isSelectLogicalOperationTypeModalOpen: boolean
  isSelectNewNodeTypeModalOpen: boolean
  isAtomNodeModalOpen: boolean
  closeSelectLogicalOperationTypeModal: () => void
  closeSelectNewNodeTypeModal: () => void
  closeAtomNodeModal: () => void
  selectedLogicalOperationTypeHandler: (logicalOperationType: LogicalOperationNodeType) => void
  initiateLogicalOperationNodeModification: (nodeName: string) => void
  initiateNewNodeCreation: (nodeName: string) => void
  initiateNewLogicalOperationNodeCreation: () => void
  initiateNewAtomNodeCreation: () => void
  finalizeNewAtomNodeCreation: (type: AtomNodeType, sdParameterSpecification: string, referenceValue: string | boolean | number) => void
  handleSDTypeSelection: (sdTypeID: string) => void
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
        initiateNewAtomNodeCreation={props.initiateNewAtomNodeCreation}
      />
      <AtomNodeModal isOpen={props.isAtomNodeModalOpen} onCloseHandler={props.closeAtomNodeModal} sdTypeData={props.sdTypeData} onConfirmHandler={props.finalizeNewAtomNodeCreation} />
      <FormControl fullWidth>
        <InputLabel id="sd-type-select-field-label">Select SD type</InputLabel>
        <Select labelId="sd-type-select-field-label" value={props.sdTypeData ? props.sdTypeData.id : ''} label="Select SD type" onChange={(e) => props.handleSDTypeSelection(e.target.value)}>
          {props.sdTypesData &&
            props.sdTypesData.sdTypes.map((sdType) => (
              <MenuItem key={sdType.id} value={sdType.id}>
                {sdType.denotation}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
      <p className={styles.kpiUserIdentifier}>
        User identifier: <strong>{props.kpiDefinitionModel.userIdentifier}</strong>
      </p>
      <p className={styles.kpiSDTypeSpecification}>
        Defined for SD type: <strong>{props.sdTypeData ? props.sdTypeData.denotation : '---'}</strong>
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
