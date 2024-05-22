import React, { useEffect, useState } from 'react'
import EditableTree, { AtomNodeType } from './components/editable-tree/EditableTree'
import StandardContentPageTemplate, { StandardContentTemplatePageProps } from '../../page-independent-components/StandardContentPageTemplate'
import { KPIDefinitionModel } from './KPIDetailPageController'
import { Button, FormControl, Grid, InputLabel, MenuItem, Select } from '@mui/material'
import { SdInstanceMode, SdInstancesPageDataQuery, SdType, SdTypesQuery } from '../../generated/graphql'
import { AsynchronousEffectFunction, ConsumerFunction, EffectFunction, TetraConsumerFunction } from '../../util'
import { PlainTextField } from '../../page-independent-components/mui-based/Styled'
import ChipBasedMultiSelect from '../../page-independent-components/mui-based/ChipBasedMultiSelect'

interface KPIDetailPageViewProps extends Omit<StandardContentTemplatePageProps, 'children'> {
  reset: EffectFunction
  kpiDefinitionModel: KPIDefinitionModel
  sdTypesData: SdTypesQuery
  sdTypeData: SdType
  sdInstancesPageData: SdInstancesPageDataQuery
  canSubmit: boolean
  initiateLogicalOperationNodeModification: ConsumerFunction<string>
  initiateNewNodeCreation: ConsumerFunction<string>
  initiateNewLogicalOperationNodeCreation: EffectFunction
  initiateNewAtomNodeCreation: EffectFunction
  handleSDTypeSelection: ConsumerFunction<string>
  handleSDInstanceModeSelection: ConsumerFunction<SdInstanceMode>
  initiateAtomNodeModification: TetraConsumerFunction<string, string, AtomNodeType, string | number | boolean>
  onSubmitHandler: AsynchronousEffectFunction
  onCancelHandler: EffectFunction
  updateUserIdentifier: ConsumerFunction<string>
  updateSelectedSDInstanceUIDs: ConsumerFunction<string[]>
}

const KPIDetailPageView: React.FC<KPIDetailPageViewProps> = (props) => {
  const [userIdentifier, setUserIdentifier] = useState<string>('')
  const [selectedSDInstanceIDs, setSelectedSDInstanceIDs] = useState<string[]>([])

  useEffect(() => {
    setSelectedSDInstanceIDs(
      props.kpiDefinitionModel.selectedSDInstanceUIDs.map((selectedSDInstanceUID) => {
        return props.sdInstancesPageData.sdInstances.find((sdInstance) => sdInstance.uid === selectedSDInstanceUID).id
      })
    )
  }, [props.kpiDefinitionModel.selectedSDInstanceUIDs])

  useEffect(() => {
    setUserIdentifier(props.kpiDefinitionModel.userIdentifier)
  }, [props.kpiDefinitionModel.userIdentifier])

  return (
    <StandardContentPageTemplate pageTitle={props.pageTitle} anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred}>
      <div className="flex items-center gap-5">
        <p className="m-0 text-[40px]">User identifier:</p>
        <PlainTextField
          sx={{
            width: '60%',
            fontSize: 40
          }}
          id="standard-basic"
          label=""
          variant="standard"
          value={userIdentifier}
          onChange={(e) => setUserIdentifier(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          onBlur={() => {
            if (userIdentifier.length > 0) {
              props.updateUserIdentifier(userIdentifier)
            } else {
              setUserIdentifier(props.kpiDefinitionModel.userIdentifier)
            }
          }}
        />
      </div>
      <div className="mt-[-16px] flex items-center gap-5 pt-2.5">
        <p className="m-0 text-[32px]">Defined for SD type:</p>
        <FormControl sx={{ width: '20%' }}>
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
        <div className="ml-auto flex cursor-pointer items-center gap-1.5" onClick={props.reset}>
          <span className="text-2xl">Reset KPI editor to default state</span>
          <span className="material-symbols-outlined text-5xl">restart_alt</span>
        </div>
      </div>
      <div className="flex items-center gap-5 pt-2.5">
        <p className="m-0 text-[32px]">SD instance mode:</p>
        <FormControl sx={{ width: '20%' }}>
          <InputLabel id="sd-instace-mode-select-field-label">Select SD instance mode</InputLabel>
          <Select
            labelId="sd-instace-mode-select-field-label"
            value={props.kpiDefinitionModel.sdInstanceMode ? (props.kpiDefinitionModel.sdInstanceMode as string) : ''}
            label="Select SD instance mode"
            onChange={(e) => {
              props.handleSDInstanceModeSelection(e.target.value as SdInstanceMode)
            }}
          >
            <MenuItem key="ALL" value="ALL">
              All
            </MenuItem>
            <MenuItem key="SELECTED" value="SELECTED">
              Selected
            </MenuItem>
          </Select>
        </FormControl>
      </div>
      {props.kpiDefinitionModel.sdInstanceMode && props.kpiDefinitionModel.sdInstanceMode === SdInstanceMode.Selected && (
        <div className="flex items-center gap-5 pt-2.5">
          <p className="m-0 text-[32px]">Selected SD instances:</p>
          <FormControl sx={{ width: '30%' }}>
            <ChipBasedMultiSelect
              title="Select SD instances"
              allSelectionSubjects={
                props?.sdInstancesPageData?.sdInstances.map((sdInstance) => {
                  return {
                    id: sdInstance.id,
                    name: sdInstance.userIdentifier
                  }
                }) ?? []
              }
              selectedSelectionSubjects={
                props?.sdInstancesPageData?.sdInstances
                  .filter((sdInstance) => selectedSDInstanceIDs.indexOf(sdInstance.id) !== -1)
                  .map((sdInstance) => {
                    return {
                      id: sdInstance.id,
                      name: sdInstance.userIdentifier
                    }
                  }) ?? []
              }
              onChange={(selectedSelectionSubjectIDs: string[]) => {
                props.updateSelectedSDInstanceUIDs(
                  selectedSelectionSubjectIDs.map((selectedSelectionSubjectID) => {
                    return props.sdInstancesPageData.sdInstances.find((sdInstance) => sdInstance.id === selectedSelectionSubjectID).uid
                  })
                )
              }}
            />
          </FormControl>
        </div>
      )}
      <EditableTree
        editableTreeNodeData={props.kpiDefinitionModel}
        initiateLogicalOperationNodeModification={props.initiateLogicalOperationNodeModification}
        initiateNewNodeCreation={props.initiateNewNodeCreation}
        initiateAtomNodeModification={props.initiateAtomNodeModification}
      />
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={1}>
          <Button fullWidth disabled={!props.canSubmit} onClick={props.onSubmitHandler}>
            Submit
          </Button>
        </Grid>
        <Grid item xs={0.1} />
        <Grid item xs={1}>
          <Button fullWidth onClick={props.onCancelHandler}>
            Cancel
          </Button>
        </Grid>
      </Grid>
    </StandardContentPageTemplate>
  )
}

export default KPIDetailPageView
