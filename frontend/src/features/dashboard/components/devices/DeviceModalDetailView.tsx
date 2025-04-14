import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription
} from '@/components/ui/drawer'
import { Skeleton } from '@/components/ui/skeleton'
import { Serie } from '@nivo/line'
import { SingleParameterCombobox } from '../builders/components/single-parameter-combobox'
import { SequentialStatesVisualization } from './components/SequentialStatesVisualization'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FC } from 'react'
import { SdParameterType, SdTypeParametersQuery } from '@/generated/graphql'
import { ResponsiveLineChart } from '../visualizations/ResponsiveLineChart'
import { Label } from '@/components/ui/label'
import { GoLinkExternal } from 'react-icons/go'
import { Group } from '@/context/InstancesContext'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ParameterSnapshotHookResult } from '@/hooks/useParameterSnapshot'
import { InstanceWithKPIs } from '@/context/stores/kpiStore'
import { TimeFrameButtonSelector } from '../builders/components/time-frame-button-selectors'

export interface DeviceModalDetailViewProps {
  selectedDevice: any
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  instance: InstanceWithKPIs | undefined
  setSelectedParameter: (parameter: string | null) => void
  timeFrame: string
  setTimeFrame: (timeFrame: string) => void
  parameters: SdTypeParametersQuery['sdType']['parameters'] | undefined
  wholeParameter: SdTypeParametersQuery['sdType']['parameters'][number] | undefined
  isDesktop: boolean
  lastUpdated: string
  IconComponent: FC | null
  processedData: Serie[]
  handleViewAllDetails: () => void
  instanceGroups?: Group[]
  parameterLastValue: ParameterSnapshotHookResult['value']
}

export const DeviceModalDetailView = (props: DeviceModalDetailViewProps) => {
  const {
    selectedDevice,
    isOpen,
    setIsOpen,
    instance,
    parameters,
    setSelectedParameter,
    timeFrame,
    setTimeFrame,
    wholeParameter,
    isDesktop,
    lastUpdated,
    IconComponent,
    processedData,
    handleViewAllDetails,
    instanceGroups,
    parameterLastValue
  } = props

  const navigate = useNavigate()

  const ParameterDetail = () => (
    <>
      <Card className="flex flex-col items-center justify-center">
        <Label className="flex items-center justify-center gap-2 pt-1">
          Last Value
          <Badge variant="outline" className="font-mono text-xs">
            {parameterLastValue?.toString() || 'N/A'}
          </Badge>
        </Label>
        <div className="flex flex-wrap items-center justify-center gap-1 pt-2">
          <Label className="flex flex-col items-start">
            Parameter
            <SingleParameterCombobox
              options={(parameters || []).map((param) => ({
                ...param,
                parameterSnapshots: []
              }))}
              onValueChange={(value) => setSelectedParameter(value?.denotation || null)}
              value={
                wholeParameter
                  ? parameters?.find((param) => param.denotation === wholeParameter.denotation) || null
                  : null
              }
              className="w-48"
            />
          </Label>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Time Frame
            </span>
            <TimeFrameButtonSelector
              compact={true}
              onValueChange={(value) => setTimeFrame(value!)}
              value={timeFrame}
              className="w-32"
            />
          </div>
        </div>
        {renderVisualization()}
      </Card>
    </>
  )

  const renderVisualization = () => {
    if (processedData.length === 0) {
      console.log('No data available for the selected device and parameter.')
      return (
        <Skeleton className="h-[100px] w-full">
          <div className="flex h-full w-full flex-col items-center justify-center">
            <p className="text-destructive">No data available</p>
            <p className="break-words text-center text-lg">Please select a different time frame or parameter</p>
          </div>
        </Skeleton>
      )
    }

    if (wholeParameter?.type === SdParameterType.Number) {
      return (
        <div className="relative h-[200px] w-full min-w-0 overflow-hidden">
          <div className="absolute inset-0 h-full w-full">
            <ResponsiveLineChart data={processedData} />
          </div>
        </div>
      )
    } else {
      return (
        <div className="h-[80px] w-full min-w-0 overflow-hidden px-2">
          <SequentialStatesVisualization data={processedData[0].data} />
        </div>
      )
    }
  }

  return (
    <>
      {isDesktop ? (
        <Dialog open={isOpen && !!selectedDevice} onOpenChange={(open) => setIsOpen(open)}>
          <DialogContent className="gap-2 overflow-hidden sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle asChild>
                <h2 className="flex flex-col items-center break-words text-lg sm:flex-row sm:justify-between sm:text-xl">
                  <div className="flex items-center gap-2">
                    {IconComponent && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-[1px] bg-muted text-muted-foreground shadow-sm">
                        <IconComponent />
                      </div>
                    )}
                    <span>{instance?.userIdentifier!}</span>
                  </div>
                  <code className="mr-2 block w-fit break-all rounded bg-muted px-1.5 py-1 font-mono text-xs text-muted-foreground">
                    {instance?.uid}
                  </code>
                </h2>
              </DialogTitle>
              <DialogDescription asChild>
                <div className="flex flex-col items-start gap-0">
                  <div className="flex flex-col items-center gap-1 sm:flex-row">
                    <span className="mr-1">Last updated:</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {lastUpdated}
                    </Badge>
                  </div>
                  {instanceGroups?.length! > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      Member of:{''}
                      {instanceGroups?.map((group, index) => (
                        <Button
                          variant="link"
                          key={group.id}
                          className="m-0 p-0 text-sm"
                          onClick={() => {
                            setIsOpen(false)
                            navigate(`/group/${group.id}`)
                          }}
                        >
                          {group.userIdentifier}
                          {index < instanceGroups.length - 1 ? ', ' : '.'}
                        </Button>
                      ))}
                    </div>
                  )}
                  {instance?.kpis?.length! > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-sm">KPIs:</span>
                      {instance?.kpis.map((kpi) => (
                        <Badge
                          key={kpi.id}
                          variant={kpi.fulfilled ? 'success' : 'destructive'}
                          className="font-mono text-xs"
                        >
                          {kpi.userIdentifier}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <ParameterDetail />
            <DialogFooter className="pt-2">
              <Button variant="link" onClick={handleViewAllDetails} className="flex gap-1 whitespace-nowrap">
                View all details
                <GoLinkExternal className="h-3 w-3 text-xs" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isOpen && !!selectedDevice} onOpenChange={(open) => setIsOpen(open)}>
          <DrawerContent className="flex h-fit max-h-[calc(90vh-2rem)] flex-col gap-2">
            <ScrollArea>
              <div className="max-h-[calc(100vh-2rem)]">
                <DrawerHeader>
                  <DrawerTitle className="flex flex-col items-center break-words text-lg sm:flex-row sm:justify-between sm:text-xl">
                    <div className="flex flex-col items-center gap-2 sm:flex-row">
                      {IconComponent && (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border-[1px] bg-muted text-muted-foreground shadow-md sm:h-8 sm:w-8 sm:shadow-sm">
                          <IconComponent />
                        </div>
                      )}
                      {instance?.userIdentifier!}
                    </div>
                    <code className="mr-2 block w-fit break-all rounded bg-muted px-1.5 py-1 font-mono text-xs text-muted-foreground">
                      {instance?.uid}
                    </code>
                  </DrawerTitle>
                  <DrawerDescription className="mt-2 space-y-1">
                    <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-start sm:gap-2">
                      <span className="mr-1">Last updated:</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {lastUpdated}
                      </Badge>
                    </div>
                    {instanceGroups?.length! > 0 && (
                      <div className="flex flex-wrap items-center justify-center gap-1 text-muted-foreground sm:flex-row sm:justify-start sm:gap-2">
                        <span>Member of:{''}</span>
                        {instanceGroups?.map((group, index) => (
                          <Button
                            variant="link"
                            key={group.id}
                            className="m-0 h-fit p-0"
                            onClick={() => {
                              setIsOpen(false)
                              navigate(`/group/${group.id}`)
                            }}
                          >
                            {group.userIdentifier}
                            {index < instanceGroups.length - 1 ? ', ' : '.'}
                          </Button>
                        ))}
                      </div>
                    )}
                    {instance?.kpis?.length! > 0 && (
                      <div className="flex flex-wrap items-center justify-center gap-1 sm:flex-row sm:items-start sm:justify-start">
                        <span className="text-sm">KPIs:</span>
                        {instance?.kpis.map((kpi) => (
                          <Badge
                            key={kpi.id}
                            variant={kpi.fulfilled ? 'default' : 'destructive'}
                            className="whitespace-nowrap font-mono text-xs"
                          >
                            {kpi.userIdentifier}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </DrawerDescription>
                </DrawerHeader>
                <ParameterDetail />
                <DrawerFooter className="pt-2">
                  <Button variant="link" onClick={handleViewAllDetails} className="flex gap-1 whitespace-nowrap">
                    View all details
                    <GoLinkExternal className="h-3 w-3 text-xs" />
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="outline" className="w-full">
                      Close
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </ScrollArea>
          </DrawerContent>
        </Drawer>
      )}
    </>
  )
}
