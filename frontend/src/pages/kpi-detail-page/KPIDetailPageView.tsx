import React, { useEffect, useState } from 'react'
import EditableTree, { AtomNodeType } from './components/editable-tree/EditableTree'
import StandardContentPageTemplate, { StandardContentTemplatePageProps } from '../../page-independent-components/StandardContentPageTemplate'
import { KPIDefinitionModel } from './KPIDetailPageController'
import { Button, FormControl, Grid } from '@mui/material'
import { RestOfKpiDefinitionDetailPageDataQuery, SdInstanceMode, SdType } from '../../generated/graphql'
import { AsynchronousEffectFunction, ConsumerFunction, EffectFunction, TetraConsumerFunction } from '../../util'
import ChipBasedMultiSelect from '../../page-independent-components/mui-based/ChipBasedMultiSelect'
import StandardSingleSelect from '../../page-independent-components/mui-based/StandardSingleSelect'
import MUIBasedTextField from '../../page-independent-components/mui-based/MUIBasedTextField'

interface KPIDetailPageViewProps extends Omit<StandardContentTemplatePageProps, 'children'> {
  reset: EffectFunction
  kpiDefinitionModel: KPIDefinitionModel
  restOfKPIDefinitionDetailPageData: RestOfKpiDefinitionDetailPageDataQuery
  sdTypeData: SdType
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
    if (!props?.restOfKPIDefinitionDetailPageData?.sdInstances) {
      return
    }
    setSelectedSDInstanceIDs(
      props.kpiDefinitionModel.selectedSDInstanceUIDs.map((selectedSDInstanceUID) => {
        return props.restOfKPIDefinitionDetailPageData.sdInstances.find((sdInstance) => sdInstance.uid === selectedSDInstanceUID).id
      })
    )
  }, [props.kpiDefinitionModel.selectedSDInstanceUIDs])

  useEffect(() => {
    setUserIdentifier(props.kpiDefinitionModel.userIdentifier)
  }, [props.kpiDefinitionModel.userIdentifier])

  return (
    <StandardContentPageTemplate pageTitle={props.pageTitle} anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={4}>
          <FormControl fullWidth>
            <MUIBasedTextField
              label="User identifier"
              content={userIdentifier}
              onContentChange={setUserIdentifier}
              onBlur={() => {
                if (userIdentifier.length > 0) {
                  props.updateUserIdentifier(userIdentifier)
                } else {
                  setUserIdentifier(props.kpiDefinitionModel.userIdentifier)
                }
              }}
            />
          </FormControl>
        </Grid>
        <Grid item xs={2.5}>
          <FormControl fullWidth>
            <StandardSingleSelect
              sx={{
                height: 56
              }}
              title="SD type"
              allSelectionSubjects={
                props?.restOfKPIDefinitionDetailPageData?.sdTypes.map((sdType) => ({
                  id: sdType.id,
                  name: sdType.denotation
                })) ?? []
              }
              selectedSelectionSubjectID={props?.sdTypeData?.id ?? ''}
              onChange={props.handleSDTypeSelection}
            />
          </FormControl>
        </Grid>
        <Grid item xs={2}>
          <FormControl fullWidth>
            <StandardSingleSelect
              sx={{
                height: 56
              }}
              title="SD instance mode"
              allSelectionSubjects={[
                {
                  id: 'ALL',
                  name: 'All SD instances'
                },
                {
                  id: 'SELECTED',
                  name: 'Only selected SD instances'
                }
              ]}
              selectedSelectionSubjectID={(props?.kpiDefinitionModel?.sdInstanceMode as string) ?? ''}
              onChange={(selectedSelectionSubjectID) => props.handleSDInstanceModeSelection(selectedSelectionSubjectID as SdInstanceMode)}
            />
          </FormControl>
        </Grid>
        <Grid item xs={3.5} />
        {props.kpiDefinitionModel.sdInstanceMode === SdInstanceMode.Selected && (
          <Grid item xs={4}>
            <FormControl fullWidth>
              <ChipBasedMultiSelect
                sx={{
                  minHeight: 65
                }}
                title="Selected SD instances"
                allSelectionSubjects={
                  props?.restOfKPIDefinitionDetailPageData?.sdInstances
                    .filter((sdInstance) => props?.sdTypeData?.id && sdInstance.type.id === props.sdTypeData.id)
                    .map((sdInstance) => {
                      return {
                        id: sdInstance.id,
                        name: sdInstance.userIdentifier
                      }
                    }) ?? []
                }
                selectedSelectionSubjects={
                  props?.restOfKPIDefinitionDetailPageData?.sdInstances
                    .filter((sdInstance) => selectedSDInstanceIDs.indexOf(sdInstance.id) !== -1)
                    .map((sdInstance) => {
                      return {
                        id: sdInstance.id,
                        name: sdInstance.userIdentifier
                      }
                    }) ?? []
                }
                onChange={(selectedSelectionSubjectIDs: string[]) => {
                  if (!props?.restOfKPIDefinitionDetailPageData?.sdInstances) {
                    return
                  }
                  props.updateSelectedSDInstanceUIDs(
                    selectedSelectionSubjectIDs.map((selectedSelectionSubjectID) => {
                      return props.restOfKPIDefinitionDetailPageData.sdInstances.find((sdInstance) => sdInstance.id === selectedSelectionSubjectID).uid
                    })
                  )
                }}
              />
            </FormControl>
          </Grid>
        )}
      </Grid>
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
        <Grid item xs={1}>
          <Button fullWidth onClick={props.onCancelHandler}>
            Cancel
          </Button>
        </Grid>
        <Grid item xs={7} />
        <Grid item xs={3}>
          <div className="flex cursor-pointer items-center justify-end gap-1.5" onClick={props.reset}>
            <span className="text-2xl">Reset KPI editor to default state</span>
            <span className="material-symbols-outlined text-5xl">restart_alt</span>
          </div>
        </Grid>
      </Grid>
    </StandardContentPageTemplate>
  )
}

export default KPIDetailPageView
