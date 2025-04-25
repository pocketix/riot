import { SdParameterType, SdTypeParametersQuery } from '@/generated/graphql'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SequentialStatesVisualization } from '@/features/dashboard/components/devices/components/SequentialStatesVisualization'
import { SingleParameterCombobox } from '@/features/dashboard/components/builders/components/single-parameter-combobox'
import { TimeFrameSelector } from '@/features/dashboard/components/builders/components/time-frame-selector'
import { Group } from '@/context/InstancesContext'
import { getIcon } from '@/utils/getIcon'
import { Separator } from '@/components/ui/separator'
import { useNavigate } from 'react-router-dom'
import { GoLinkExternal } from 'react-icons/go'
import { ResponsiveLineChart } from '@/features/dashboard/components/visualizations/ResponsiveLineChart'
import { InstanceWithKPIs } from '@/context/stores/kpiStore'
import { Label } from '@/components/ui/label'
import { Serie } from '@nivo/line'
import { EditableUserIdentifier } from './components/EditableUserIdentifier'

export interface DeviceDetailPageProps {
  instance: InstanceWithKPIs | null
  groups: Group[]
  lastUpdated: string | null

  parameters: SdTypeParametersQuery['sdType']['parameters']
  currentParameter: SdTypeParametersQuery['sdType']['parameters'][0] | null

  chartData: Serie[]

  onUserIdentifierChange: (value: string) => void

  selectedParameter: string | null
  setSelectedParameter: (value: string | null) => void
  timeFrame: string
  setTimeFrame: (value: string) => void

  isLoading: boolean
  isChartLoading: boolean
  error?: any
}

export const DeviceDetailPageView = ({
  instance,
  groups,
  lastUpdated,

  parameters,
  currentParameter,

  chartData,
  onUserIdentifierChange,

  setSelectedParameter,
  timeFrame,
  setTimeFrame,

  isLoading,
  isChartLoading,
  error
}: DeviceDetailPageProps) => {
  const IconComponent = getIcon(instance?.type?.icon! || 'TbQuestionMark')
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="container mx-auto mt-8 space-y-3">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !instance) {
    return (
      <div className="container mx-auto mt-8 p-6 text-center">
        <h2 className="mb-4 text-2xl font-bold text-destructive">Error Loading Device</h2>
        <p className="mb-6">{error?.message || 'Device not found'}</p>
      </div>
    )
  }

  const renderVisualization = () => {
    if (isChartLoading) {
      return <Skeleton className="h-[300px] w-full" />
    }

    if (chartData.length === 0 || chartData[0]?.data?.length === 0) {
      return (
        <div className="flex h-[300px] w-full flex-col items-center justify-center rounded-md border bg-muted/20">
          <p className="font-medium text-destructive">No data available</p>
          <p className="text-muted-foreground">Please select a different time frame or parameter</p>
        </div>
      )
    }

    if (currentParameter?.type === SdParameterType.Number) {
      return <ResponsiveLineChart data={chartData} height={300} detailsOnClick={false} />
    } else {
      return <SequentialStatesVisualization data={chartData[0]?.data || []} />
    }
  }

  return (
    <div className="min-h-[80vh] space-y-2 overflow-x-hidden px-6 pt-3">
      <div className="flex w-full flex-col items-center justify-between gap-2 md:flex-row">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex flex-col items-center md:flex-row md:gap-2">
            {IconComponent && (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-[1px] bg-muted text-muted-foreground shadow-md">
                <IconComponent />
              </div>
            )}
            <EditableUserIdentifier onSave={onUserIdentifierChange} value={instance.userIdentifier} className="text-center text-3xl font-bold tracking-tight" />
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="ml-2 mr-1">Last updated:</span>
            <Badge variant="outline" className="text-center font-mono text-xs">
              {lastUpdated}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 sm:gap-1 md:items-end">
          <Badge variant="outline">{instance.type.label || instance.type.denotation}</Badge>
          <code className="break-all rounded-md bg-muted px-2 py-1 text-center text-xs">{instance.uid}</code>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="space-y-3 md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Device Groups</CardTitle>
              <CardDescription>
                {groups.length > 0 && (
                  <span className="text-center text-sm text-muted-foreground">
                    This device is a member of {groups.length} group
                    {groups.length > 1 ? 's' : ''}:
                  </span>
                )}
                <Separator orientation="horizontal" className="mt-1" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              {groups.length > 0 ? (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {groups.map((group) => (
                    <div key={group.id} className="flex flex-wrap items-center">
                      <Badge
                        variant="secondary"
                        onClick={() => {
                          navigate(`/group/${group.id}`)
                        }}
                        className="flex cursor-pointer items-center whitespace-nowrap rounded-md bg-muted text-xs transition-all hover:bg-accent/50 hover:underline hover:shadow-md"
                      >
                        {group.userIdentifier} <GoLinkExternal className="ml-1 h-3 w-3" />
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-2 text-center text-muted-foreground">This device is not part of any groups</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">KPI Status</CardTitle>
                {instance.kpis.length > 0 && (
                  <Badge
                    variant={instance.kpiStats.notFulfilled === 0 ? 'default' : 'destructive'}
                    className="whitespace-nowrap"
                  >
                    {instance.kpiStats.fulfilled}/{instance.kpiStats.total} Fulfilled
                  </Badge>
                )}
              </div>
              <CardDescription>Key Performance Indicators</CardDescription>
            </CardHeader>
            <CardContent>
              {instance.kpis.length === 0 ? (
                <p className="py-2 text-center text-muted-foreground">No KPIs defined for this device</p>
              ) : (
                <div className="space-y-3">
                  {instance.kpis.map((kpi) => (
                    <div
                      key={kpi.id}
                      className={`flex items-center justify-between gap-1 rounded-md border p-2 ${kpi.fulfilled ? 'border-green-500' : 'border-destructive'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{kpi.userIdentifier}</span>
                      </div>
                      <Badge
                        variant={
                          kpi.fulfilled === true ? 'default' : kpi.fulfilled === false ? 'destructive' : 'outline'
                        }
                        className="w-fit whitespace-nowrap"
                      >
                        {kpi.fulfilled === true ? 'Fulfilled' : kpi.fulfilled === false ? 'Not Fulfilled' : 'Unknown'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Parameter Data</CardTitle>
              <CardDescription>Real-time and historical parameter values</CardDescription>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Label className="flex flex-col items-start">
                  Parameter
                  <SingleParameterCombobox
                    options={parameters.map((param) => ({
                      ...param,
                      parameterSnapshots: []
                    }))}
                    onValueChange={(value) => setSelectedParameter(value?.denotation || null)}
                    value={
                      currentParameter
                        ? parameters.find((param) => param.denotation === currentParameter.denotation) || null
                        : null
                    }
                    className="w-48"
                  />
                </Label>
                <Label className="flex flex-col items-start">
                  Time Frame
                  <TimeFrameSelector
                    onValueChange={(value) => setTimeFrame(value!)}
                    value={timeFrame}
                    className="w-48"
                  />
                </Label>
              </div>
            </CardHeader>
            <CardContent className="px-1 sm:px-3">{renderVisualization()}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
