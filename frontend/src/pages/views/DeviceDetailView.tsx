import { SdParameterType } from '@/generated/graphql'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SequentialStatesVisualization } from '@/features/dashboard/components/visualizations/SequentialStatesVisualization'
import { SingleParameterCombobox } from '@/features/dashboard/components/builders/components/single-parameter-combobox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Group, Parameter } from '@/context/InstancesContext'
import { getIcon } from '@/utils/getIcon'
import { Separator } from '@/components/ui/separator'
import { useNavigate } from 'react-router-dom'
import { GoLinkExternal } from 'react-icons/go'
import { ResponsiveLineChart } from '@/features/dashboard/components/visualizations/ResponsiveLineChart'
import { InstanceWithKPIs } from '@/context/stores/kpiStore'
import { Serie } from '@nivo/line'
import { EditableUserIdentifier } from './components/EditableUserIdentifier'
import { Scale } from 'lucide-react'
import { SingleInstanceCombobox } from '@/features/dashboard/components/builders/components/single-instance-combobox'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DeviceDetailSchema, DeviceDetailSchemaType } from '@/schemas/DeviceDetailSchema'
import { getMaxValue, getMinValue } from '@/features/dashboard/components/utils/charts/tickUtils'
import { DateTimeRangePicker } from './components/date-time-picker'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { LineChartLegend } from '@/features/dashboard/components/visualizations/LineChartLegend'
import { z } from 'zod'
import { useMemo } from 'react'

export interface DeviceDetailPageProps {
  instance: InstanceWithKPIs | null
  groups: Group[]
  lastUpdated: string | null
  mainData: Serie[]
  onUserIdentifierChange: (value: string) => void

  isLoading: boolean
  error?: any

  isLoadingMain: boolean
  isLoadingComparison: boolean

  getParameterOptions: (instanceID: number | null) => Parameter[]
  getParameterType: (instanceID: number, parameterID: number) => SdParameterType | undefined
  checkAndFetch: (isComparison: boolean, values: DeviceDetailSchemaType) => void
  clearComparisonData: () => void

  comparisonData: Serie[]
}

export const DeviceDetailPageView = ({
  instance,
  groups,
  lastUpdated,
  mainData,
  onUserIdentifierChange,

  isLoading,
  error,

  isLoadingMain,
  isLoadingComparison,

  getParameterOptions,
  getParameterType,
  checkAndFetch,
  clearComparisonData,

  comparisonData
}: DeviceDetailPageProps) => {
  const IconComponent = getIcon(instance?.type?.icon! || 'TbQuestionMark')
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof DeviceDetailSchema>>({
    mode: 'all',
    resolver: zodResolver(DeviceDetailSchema),
    defaultValues: {
      dateTimeRange: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      },
      comparison: {
        dateTimeRange: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date()
        },
        instanceID: null,
        parameter: { id: null, denotation: '' }
      }
    }
  })

  const [globalMin, globalMax] = useMemo(() => {
    return [
      Math.min(getMinValue(mainData), getMinValue(comparisonData)),
      Math.max(getMaxValue(mainData), getMaxValue(comparisonData))
    ]
  }, [mainData, comparisonData])

  const mainParameter = form.watch('parameter')
  const comparisonParameter = form.watch('comparison.parameter')
  const comparisonInstanceID = form.watch('comparison.instanceID')

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

  const renderVisualization = (parameterID: number, instanceID: number, data: Serie[], isLoading: boolean) => {
    if (isLoading) {
      return <Skeleton className="h-[300px] w-full" />
    }

    if (data.length === 0 || data[0]?.data?.length === 0) {
      return (
        <div className="flex h-fit w-full flex-col items-center justify-center rounded-md border bg-muted/20">
          <p className="break-words text-center font-medium text-destructive">No data available</p>
          <p className="break-words text-center text-muted-foreground">
            Please select a different time frame or parameter
          </p>
        </div>
      )
    }

    const parameterType = getParameterType(instanceID, parameterID)
    if (parameterType === SdParameterType.Number) {
      return (
        <div>
          <ResponsiveLineChart data={data} height={300} detailsOnClick={false} />
          <LineChartLegend data={data} />
        </div>
      )
    } else {
      return (
        <div className="flex h-[65px] w-full flex-col items-center justify-center">
          <SequentialStatesVisualization data={data[0].data} disableDetailsOnClick />
        </div>
      )
    }
  }

  const renderCharts = () => {
    const mainIsNumber = getParameterType(instance.id, mainParameter?.id!) === SdParameterType.Number
    const comparisonIsNumber =
      getParameterType(comparisonInstanceID!, comparisonParameter?.id!) === SdParameterType.Number
    const dataConcatenated = mainData.concat(comparisonData)

    if (mainIsNumber && comparisonIsNumber && mainData.length > 0 && comparisonData.length > 0) {
      // Overlay both charts
      return (
        <div>
          <div className="relative h-[300px] w-full">
            <ResponsiveLineChart
              data={comparisonData}
              height={300}
              detailsOnClick={false}
              biaxial={true}
              config={{
                enableGridX: false,
                enableGridY: false,
                yScale: { type: 'linear', min: globalMin, max: globalMax }
              }}
              className="absolute inset-0"
            />
            <ResponsiveLineChart
              data={mainData}
              height={300}
              detailsOnClick={false}
              config={{
                margin: { top: 40, bottom: 20, left: 40, right: 10 },
                yScale: { type: 'linear', min: globalMin, max: globalMax }
              }}
              className="absolute inset-0"
            />
            <div className="absolute inset-0 z-20 h-full w-full" />
          </div>
          <LineChartLegend data={dataConcatenated} />
        </div>
      )
    }

    // Different types, show them separately
    return (
      <div className="flex flex-col gap-4">
        <div>{renderVisualization(mainParameter?.id!, instance.id, mainData, isLoadingMain)}</div>
        {comparisonInstanceID && (
          <div>
            {renderVisualization(comparisonParameter?.id!, comparisonInstanceID!, comparisonData, isLoadingComparison)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] space-y-2 overflow-x-hidden pt-3 sm:px-6">
      <div className="flex w-full flex-col items-center justify-between gap-2 md:flex-row">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex flex-col items-center md:flex-row md:gap-2">
            {IconComponent && (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-[1px] bg-muted text-muted-foreground shadow-md">
                <IconComponent />
              </div>
            )}
            <EditableUserIdentifier
              onSave={onUserIdentifierChange}
              value={instance.userIdentifier}
              className="w-fit text-center text-3xl font-bold tracking-tight"
            />
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="ml-2 mr-1">Last updated:</span>
            <Badge variant="outline" className="text-center font-mono text-xs">
              {lastUpdated}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 sm:gap-1 md:items-end">
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="mr-1">Type:</span>
            <Badge variant="outline">{instance.type.label || instance.type.denotation}</Badge>
          </div>
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
              <CardTitle className="text-lg">Inspect Data</CardTitle>
              <CardDescription>Choose parameter and time range to visualize</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form>
                  <div className="space-y-2">
                    <div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="parameter"
                          render={({ field }) => (
                            <FormItem className="self-center">
                              <FormLabel>Parameter</FormLabel>
                              <FormControl>
                                <SingleParameterCombobox
                                  options={getParameterOptions(instance.id)}
                                  onValueChange={(param) => {
                                    field.onChange(param)
                                    checkAndFetch(false, form.getValues())
                                  }}
                                  value={field.value}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="dateTimeRange"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Time Range</FormLabel>
                              <FormControl>
                                <DateTimeRangePicker
                                  value={{
                                    start: field.value?.start,
                                    end: field.value?.end
                                  }}
                                  onValueChange={(range) => {
                                    field.onChange(range)
                                    checkAndFetch(false, form.getValues())
                                  }}
                                  maxDate={new Date()}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Accordion type="single" collapsible>
                      <AccordionItem value="comparison">
                        <AccordionTrigger>
                          <div className="flex flex-col">
                            <div className="flex w-full items-center justify-start gap-1">
                              <Scale className="h-4 w-4 text-muted-foreground" />
                              <h3 className="text-sm font-medium">Compare</h3>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Tooltips will be disabled in the comparison chart.
                            </p>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="comparison.instanceID"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Comparison Device</FormLabel>
                                  <FormControl>
                                    <SingleInstanceCombobox
                                      value={field.value!}
                                      onValueChange={(instance) => {
                                        field.onChange(instance?.id || null)
                                        form.setValue('comparison.parameter', { id: null, denotation: '' })
                                      }}
                                      className="w-full"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="comparison.parameter"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Comparison Parameter</FormLabel>
                                  <FormControl>
                                    <SingleParameterCombobox
                                      options={getParameterOptions(form.watch('comparison.instanceID'))}
                                      onValueChange={(param) => {
                                        field.onChange(param)
                                        checkAndFetch(true, form.getValues())
                                      }}
                                      value={field.value!}
                                      className="w-full"
                                      disabled={!form.watch('comparison.instanceID')}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="comparison.dateTimeRange"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Time Range</FormLabel>
                                  <FormControl>
                                    <DateTimeRangePicker
                                      value={field.value}
                                      onValueChange={(range) => {
                                        field.onChange(range)
                                        checkAndFetch(true, form.getValues())
                                      }}
                                      className="w-full"
                                      maxDate={new Date()}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Button
                              type="button"
                              variant="secondary"
                              className="h-fit self-center"
                              onClick={() => {
                                const mainRange = form.getValues().dateTimeRange
                                console.log('mainRange', mainRange)
                                if (mainRange?.start && mainRange?.end) {
                                  form.setValue('comparison.dateTimeRange', {
                                    start: mainRange.start,
                                    end: mainRange.end
                                  })
                                  checkAndFetch(true, form.getValues())
                                }
                              }}
                            >
                              <span className="block whitespace-normal break-words text-center">
                                Synchronize with Main Time Range
                              </span>
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </form>
              </Form>
              {comparisonData && comparisonData.length > 0 && (
                <Button
                  variant="destructive"
                  className="mb-4 mt-4 w-full"
                  onClick={() => {
                    form.setValue('comparison.instanceID', null)
                    form.setValue('comparison.parameter', { id: null, denotation: '' })
                    clearComparisonData()
                  }}
                >
                  Clear Comparison Data
                </Button>
              )}
              {renderCharts()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
