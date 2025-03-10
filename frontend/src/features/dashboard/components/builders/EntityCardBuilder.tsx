import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { IoAdd } from 'react-icons/io5'
import { Label } from '@/components/ui/label'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { EntityCardInfo } from '@/types/EntityCardInfo'
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { SdInstance, SdParameter } from '@/generated/graphql'
import { useQuery } from '@apollo/client'
import { GET_PARAMETERS } from '@/graphql/Queries'
import { ResponsiveLine } from '@nivo/line'
import { useDarkMode } from '@/context/DarkModeContext'
import { darkTheme, lightTheme } from '../cards/ChartThemes'
import { Switch } from '@/components/ui/switch'
import { TbTrash } from 'react-icons/tb'

export interface EntityCardBuilderProps {
  onDataSubmit: (data: EntityCardInfo) => void
  data?: EntityCardInfo
  instances: SdInstance[]
}

export function EntityCardBuilder({ onDataSubmit, data, instances }: EntityCardBuilderProps) {
  const { isDarkMode } = useDarkMode()
  const initialEntityCardConfig: EntityCardInfo = {
    _cardID: 'exampleCardID',
    title: 'Entity Card',
    rows: []
  }

  const [entityCardConfig, setEntityCardConfig] = useState<EntityCardInfo>(data || initialEntityCardConfig)
  const [selectedInstance, setSelectedInstance] = useState<SdInstance | null>(null)
  const [availableParameters, setAvailableParameters] = useState<{ [key: string]: SdParameter[] }>({})

  const { data: parametersData } = useQuery<{ sdType: { parameters: SdParameter[] } }>(GET_PARAMETERS, {
    variables: { sdTypeId: selectedInstance?.type.id },
    skip: !selectedInstance
  })

  useEffect(() => {
    if (parametersData && selectedInstance) {
      setAvailableParameters((prev) => ({
        ...prev,
        [selectedInstance.uid]: parametersData.sdType.parameters
      }))
    }
  }, [parametersData, selectedInstance])

  const handleConfigChange = (property: string, value: any) => {
    const newConfig = {
      ...entityCardConfig,
      [property]: value
    }
    setEntityCardConfig(newConfig)
  }

  const handleRowChange = (index: number, property: string, value: any) => {
    const newRows = [...entityCardConfig.rows]
    newRows[index] = {
      ...newRows[index],
      [property]: value
    }

    if (property === 'visualization' && value === 'immediate') {
      newRows[index].value = Math.floor(Math.random() * 100).toString()
    }

    if (property === 'visualization' && value === 'sparkline') {
      newRows[index].sparkLineData = newRows[index].sparkLineData || { data: [] }
      newRows[index].sparkLineData!.data = [
        {
          x: '2025-01-01T00:00:00.000Z',
          y: 15.1
        },
        {
          x: '2025-01-02T00:00:00.000Z',
          y: 23.1
        },
        {
          x: '2025-01-03T02:00:00.000Z',
          y: 20.8
        },
        {
          x: '2025-01-04T00:00:00.000Z',
          y: 26.5
        },
        {
          x: '2025-01-05T00:00:00.000Z',
          y: 30.3
        }
      ]
    }
    handleConfigChange('rows', newRows)
  }

  const handleTimeFrameChange = (index: number, value: string) => {
    const newRows = [...entityCardConfig.rows]
    newRows[index].sparkLineData!.timeFrame = value
    handleConfigChange('rows', newRows)
  }

  const addRow = () => {
    const newRows = [...entityCardConfig.rows, { name: '', instance: null, parameter: null, visualization: 'immediate' }]
    handleConfigChange('rows', newRows)
  }

  const removeRow = (index: number) => {
    const newRows = entityCardConfig.rows.filter((_, i) => i !== index)
    handleConfigChange('rows', newRows)
  }

  const handleParameterChange = (rowIndex: number, value: string) => {
    const parameter = availableParameters[selectedInstance?.uid!]?.find((param) => param.id === value) || null
    if (!parameter) return
    const newRows = [...entityCardConfig.rows]
    newRows[rowIndex].parameter = parameter
    handleConfigChange('rows', newRows)
  }

  const handleInstanceChange = (rowIndex: number, instanceId: string) => {
    const instance = instances.find((instance) => instance.uid === instanceId) || null
    if (!instance) return
    handleRowChange(rowIndex, 'instance', instance)
    setSelectedInstance(instance)
  }

  const handleSubmit = () => {
    onDataSubmit(entityCardConfig)
  }

  return (
    <div className="w-full">
      <Card className="h-fit w-full overflow-hidden p-2 pt-0">
        {entityCardConfig.title && <h3 className="text-lg font-semibold">{entityCardConfig.title}</h3>}
        <table className="w-full h-fit">
          <thead className="border-b-[2px]">
            <tr>
              <th className="text-left text-md">Name</th>
              <th className="text-center text-md">Visualization</th>
            </tr>
          </thead>
          <tbody>
            {entityCardConfig.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="text-sm">{row.name}</td>
                {row.visualization === 'sparkline' && row.sparkLineData && (
                  <td className="text-sm text-center w-[75px] h-[24px]">
                    <ResponsiveLine
                      data={[
                        {
                          id: 'temperature',
                          data: row.sparkLineData?.data!
                        }
                      ]}
                      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                      xScale={{ type: 'time', format: '%Y-%m-%dT%H:%M:%S.%LZ' }}
                      yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: true, reverse: false }}
                      animate={false}
                      pointSize={0}
                      axisBottom={null}
                      axisLeft={null}
                      curve="cardinal"
                      lineWidth={4}
                      enableGridX={false}
                      enableGridY={false}
                      useMesh={false}
                      theme={isDarkMode ? darkTheme : lightTheme}
                    />
                  </td>
                )}
                {row.visualization === 'immediate' && <td className="text-sm text-center">{row.value}</td>}
                {row.visualization === 'switch' && (
                  <td className="text-sm text-center">
                    <Switch checked={row.value === 'on'} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="flex gap-4 w-full mt-2">
        <Label className="w-full">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col items-start gap-2 w-full">
              Card Title
              <Input type="text" value={entityCardConfig.title} onChange={(e) => handleConfigChange('title', e.target.value)} className="w-full" />
            </div>
          </div>
        </Label>
      </div>
      <div className="flex gap-4 w-full mt-2">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="rows">
            <AccordionTrigger>Rows</AccordionTrigger>
            <AccordionContent className="w-full flex flex-col gap-4 mt-2">
              {entityCardConfig.rows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex flex-col gap-2 items-center p-1 border-2 rounded-md">
                  <div className="flex items-start justify-between w-full gap-2">
                    <Label className="w-full">
                      Row Name
                      <Input type="text" value={row.name} onChange={(e) => handleRowChange(rowIndex, 'name', e.target.value)} placeholder="Row Name" className="w-full" />
                    </Label>
                    <Button onClick={() => removeRow(rowIndex)} variant={'ghost'} className="text-destructive">
                      <TbTrash />
                    </Button>
                  </div>
                  <div className="flex gap-2 w-full">
                    <Label className="w-full">
                      Instance
                      <Select onValueChange={(value) => handleInstanceChange(rowIndex, value)} value={row.instance?.uid || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an instance" />
                        </SelectTrigger>
                        <SelectContent>
                          {instances.map((instance) => (
                            <SelectItem key={instance.uid} value={instance.uid}>
                              {instance.type.denotation}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Label>
                    <Label className="w-full">
                      Parameter
                      <Select onValueChange={(value) => handleParameterChange(rowIndex, value)} value={row.parameter?.id! || ''} disabled={!availableParameters[row.instance?.uid!]}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a parameter" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableParameters[row.instance?.uid!]?.map((parameter) => (
                            <SelectItem key={parameter.id} value={parameter.id}>
                              {parameter.denotation}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Label>
                  </div>
                  <Label className="w-full">
                    Visualization
                    <Select onValueChange={(value) => handleRowChange(rowIndex, 'visualization', value)} value={row.visualization} disabled={!row.parameter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a visualization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sparkline">Sparkline</SelectItem>
                        <SelectItem value="immediate">Immediate Value</SelectItem>
                        <SelectItem value="switch">Switch</SelectItem>
                      </SelectContent>
                    </Select>
                  </Label>
                  {row.visualization === 'sparkline' && (
                    <Label className="w-full">
                      Time frame
                      <Select onValueChange={(value) => handleTimeFrameChange(rowIndex, value)} value={row.sparkLineData?.timeFrame} disabled={!row.parameter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a visualization" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="1440">1 day</SelectItem>
                          <SelectItem value="4320">3 days</SelectItem>
                          <SelectItem value="10080">1 week</SelectItem>
                          <SelectItem value="40320">1 month</SelectItem>
                        </SelectContent>
                      </Select>
                    </Label>
                  )}
                  {/* TODO: ?? Switch API not done */}
                  {/* {row.visualization === 'switch' && (
                    <Label className="w-full">
                      Switch position parameter
                      <Select onValueChange={(value) => handleRowChange(rowIndex, 'visualization', value)} value={row.visualization} disabled={!row.parameter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a visualization" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sparkline">Sparkline</SelectItem>
                          <SelectItem value="immediate">Immediate Value</SelectItem>
                          <SelectItem value="switch">Switch</SelectItem>
                        </SelectContent>
                      </Select>
                    </Label>
                  )} */}
                </div>
              ))}
              <Button onClick={addRow} variant={'green'} size={'icon'} className="flex items-center justify-center w-1/2 m-auto">
                <IoAdd /> Add Row
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <div className="flex justify-end mt-2">
        <Button onClick={() => handleSubmit()} size={'default'}>
          Submit
        </Button>
      </div>
    </div>
  )
}
