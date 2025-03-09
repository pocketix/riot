import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { IoRemove, IoAdd } from 'react-icons/io5'
import { Label } from '@/components/ui/label'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { TableCardInfo } from '@/types/TableCardInfo'
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { SdInstance, SdParameter, StatisticsOperation } from '@/generated/graphql'
import { useQuery } from '@apollo/client'
import { GET_PARAMETERS } from '@/graphql/Queries'
import { HiOutlineQuestionMarkCircle } from 'react-icons/hi2'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface TableCardBuilderProps {
  onDataSubmit: (data: TableCardInfo) => void
  data?: TableCardInfo
  instances: SdInstance[]
}

export function TableCardBuilder({ onDataSubmit, data, instances }: TableCardBuilderProps) {
  const initialTableConfig: TableCardInfo = {
    _cardID: 'exampleCardID',
    sizing: {
      w: 2,
      h: 1
    },
    title: 'Area',
    tableTitle: 'Sensors',
    icon: 'temperature-icon',
    aggregatedTime: '1h',
    decimalPlaces: 2,
    columns: [],
    rows: []
  }

  const [tableConfig, setTableConfig] = useState<TableCardInfo>(data || initialTableConfig)
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
      ...tableConfig,
      [property]: value
    }
    setTableConfig(newConfig)
  }

  const handleColumnChange = (index: number, property: string, value: any) => {
    const newColumns = [...tableConfig.columns]
    newColumns[index] = {
      ...newColumns[index],
      [property]: value
    }
    handleConfigChange('columns', newColumns)
  }

  const handleRowChange = (index: number, property: string, value: any) => {
    const newRows = [...tableConfig.rows]
    newRows[index] = {
      ...newRows[index],
      [property]: value
    }
    console.log(newRows)
    handleConfigChange('rows', newRows)
  }

  const addColumn = () => {
    const newColumns = [...tableConfig.columns, { header: '', function: '' }]
    handleConfigChange('columns', newColumns)
  }

  const removeColumn = (index: number) => {
    const newColumns = tableConfig.columns.filter((_, i) => i !== index)
    handleConfigChange('columns', newColumns)
  }

  const addRow = () => {
    const newRows = [...tableConfig.rows, { name: '', instance: null, parameter: null, values: tableConfig.columns.map(() => ({ value: '' })) }]
    handleConfigChange('rows', newRows)
  }

  const removeRow = (index: number) => {
    const newRows = tableConfig.rows.filter((_, i) => i !== index)
    handleConfigChange('rows', newRows)
  }

  const handleParameterChange = (rowIndex: number, value: string) => {
    const parameter = availableParameters[selectedInstance?.uid!]?.find((param) => param.id === value) || null
    if (!parameter) return
    const newRows = [...tableConfig.rows]
    newRows[rowIndex].parameter = parameter
    handleConfigChange('rows', newRows)
  }

  const handleInstanceChange = (rowIndex: number, instanceId: string) => {
    const instance = instances.find((instance) => instance.uid === instanceId) || null
    if (!instance) return
    handleRowChange(rowIndex, 'instance', instance)
    setSelectedInstance(instance)
  }

  // TODO: Dont know whether setting the sizing is necessary (minW)
  const handleSubmit = () => {
    let newConfig = { ...tableConfig }

    // Update the sizing based on the number of rows
    if (newConfig.rows.length > 3) {
      newConfig = {
        ...newConfig,
        sizing: {
          ...newConfig.sizing,
          minW: 2
        }
      }
    }

    setTableConfig(newConfig)
    onDataSubmit(newConfig)
  }

  return (
    <div className="w-full">
      <Card className="h-fit w-full overflow-hidden p-2 pt-0">
        {tableConfig.title && <h3 className="text-lg font-semibold">{tableConfig.title}</h3>}
        <table className="w-full h-fit">
          <thead className="border-b-[2px]">
            <tr>
              <th className="text-left text-md">{tableConfig.tableTitle}</th>
              {tableConfig.columns.map((column, index) => (
                <th key={index} className="text-center text-xs">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableConfig.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="text-sm">{row.name}</td>
                {tableConfig.columns.map((_, columnIndex) => (
                  <td key={columnIndex} className="text-sm text-center">
                    {(Math.random() * 100).toFixed(tableConfig.decimalPlaces ?? 2)}
                  </td>
                ))}
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
              <Input type="text" value={tableConfig.title} onChange={(e) => handleConfigChange('title', e.target.value)} className="w-full" />
            </div>
          </div>
        </Label>
      </div>
      <div className="flex gap-4 w-full mt-2 items-end">
        <Label className="w-1/2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-2">
                Number of decimal places
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HiOutlineQuestionMarkCircle className="text-primary w-5 h-5" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-thin">The number of decimal places to display in the table.</p>
                      <p>
                        <span className="font-thin">The values inside this builder are </span>
                        <b>randomly generated.</b>
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input type="number" value={tableConfig.decimalPlaces} onChange={(e) => handleConfigChange('decimalPlaces', e.target.value)} className="w-full" />
            </div>
          </div>
        </Label>
        <Label className="w-1/2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col items-start gap-2">
              Table Title
              <Input type="text" value={tableConfig.tableTitle} onChange={(e) => handleConfigChange('tableTitle', e.target.value)} className="w-full" />
            </div>
          </div>
        </Label>
      </div>
      <div className="flex gap-4 w-full mt-2">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="columns">
            <AccordionTrigger>Columns</AccordionTrigger>
            <AccordionContent className="w-full flex flex-col gap-4 mt-2 px-1">
              {tableConfig.columns.map((column, index) => (
                <div key={index} className="flex gap-4 items-center">
                  <Input type="text" value={column.header} onChange={(e) => handleColumnChange(index, 'header', e.target.value)} placeholder="Header" className="w-full" />
                  <Select onValueChange={(value) => handleColumnChange(index, 'function', value)} value={column.function}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a function" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(StatisticsOperation).map((operation) => (
                        <SelectItem key={operation} value={operation}>
                          {operation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => removeColumn(index)} variant={'destructive'} size={'icon'} className="flex items-center justify-center">
                    <IoRemove />
                  </Button>
                </div>
              ))}
              <Button onClick={addColumn} variant={'green'} size={'icon'} className="flex items-center justify-center w-1/2 m-auto">
                <IoAdd />
                Add Column
              </Button>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="rows">
            <AccordionTrigger>Rows</AccordionTrigger>
            <AccordionContent className="w-full flex flex-col gap-4 mt-2">
              {tableConfig.rows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-4 items-center p-1 border-2 rounded-md">
                  <Input type="text" value={row.name} onChange={(e) => handleRowChange(rowIndex, 'name', e.target.value)} placeholder="Row Name" className="w-full" />
                  <Button onClick={() => removeRow(rowIndex)} variant={'destructive'} size={'icon'} className="flex items-center justify-center">
                    <IoRemove />
                  </Button>
                  {/* Entity and parameter selectors */}
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
                  <Select onValueChange={(value) => handleParameterChange(rowIndex, value)} value={row.parameter?.id || ''} disabled={!availableParameters[row.instance?.uid]}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a parameter" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableParameters[row.instance?.uid]?.map((parameter) => (
                        <SelectItem key={parameter.id} value={parameter.id}>
                          {parameter.denotation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
