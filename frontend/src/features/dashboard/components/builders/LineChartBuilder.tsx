import { useEffect, useRef, useState } from 'react'
import { ResponsiveLine, PointTooltipProps } from '@nivo/line'
import { Card } from '@/components/ui/card'
import { AxisLegendPosition } from '@nivo/axes'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { IoRemove, IoAdd } from 'react-icons/io5'
import { ToolTip } from '../cards/tooltips/LineChartToolTip'
import { useDarkMode } from '@/context/DarkModeContext'
import { darkTheme, lightTheme } from '../cards/ChartThemes'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ChartCardInfo } from '@/types/ChartCardInfo'

export interface LineChartBuilderProps {
  onDataSubmit: (data: any) => void
  data?: any
  parameterName?: string
}

export function LineChartBuilder({ onDataSubmit, data, parameterName }: LineChartBuilderProps) {
  const containerRef = useRef(null)
  const { isDarkMode } = useDarkMode()

  const initialChartConfig: ChartCardInfo = {
    cardTitle: 'Line Chart',
    sizing: {
      minH: 2
    },
    toolTip: {
      x: 'Time',
      y: parameterName ? parameterName : 'Value'
    },
    margin: { top: 10, right: 20, bottom: 50, left: 50 },
    xScale: { type: 'time', format: '%Y-%m-%dT%H:%M:%SZ' },
    xFormat: 'time:%Y-%m-%dT%H:%M:%SZ',
    yScale: {
      type: 'linear',
      min: 'auto',
      max: 'auto',
      stacked: true,
      reverse: false
    },
    animate: true,
    yFormat: ' >-.2f',
    axisBottom: {
      format: '%H:%M',
      tickValues: 'every 2 hours',
      legend: 'Date',
      legendOffset: 36,
      legendPosition: 'middle' as AxisLegendPosition
    },
    axisLeft: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: 'Value',
      legendOffset: -40,
      truncateTickAt: 0,
      legendPosition: 'middle' as AxisLegendPosition
    },
    pointSize: 3,
    pointColor: { theme: 'background' },
    pointBorderWidth: 0,
    pointBorderColor: { from: 'serieColor' },
    enableGridX: true,
    enableGridY: true
  }

  const [chartConfig, setChartConfig] = useState(initialChartConfig)

  useEffect(() => {
    setChartConfig((prevConfig) => {
      const newMargin = { ...prevConfig.margin }
      if (prevConfig.axisBottom.legend === null) {
        newMargin.bottom = 30
      } else {
        newMargin.bottom = 50
      }
      if (prevConfig.axisLeft.legend === null) {
        newMargin.left = 40
      } else {
        newMargin.left = 50
      }
      return { ...prevConfig, margin: newMargin }
    })
  }, [chartConfig.axisBottom.legend, chartConfig.axisLeft.legend])

  const handleConfigChange = (property: string, value: any) => {
    const newConfig = {
      ...chartConfig,
      [property]: value
    }
    setChartConfig(newConfig)
  }

  const linedata = [
    {
      id: 'temperature',
      data: data
    }
  ]

  return (
    <div className="w-full">
      <Card className="h-[220px] w-full overflow-hidden">
        {chartConfig.cardTitle && <h3 className="text-md font-semibold ml-2">{chartConfig.cardTitle}</h3>}
        <div className={`w-full ${chartConfig.cardTitle ? 'h-[200px]' : 'h-[220px]'}`} ref={containerRef}>
          <ResponsiveLine
            data={linedata}
            margin={chartConfig.margin}
            xScale={chartConfig.xScale as any}
            yScale={chartConfig.yScale as any}
            animate={chartConfig.animate}
            yFormat={chartConfig.yFormat}
            axisBottom={chartConfig.axisBottom}
            axisLeft={chartConfig.axisLeft}
            pointSize={chartConfig.pointSize}
            pointColor={isDarkMode ? '#ffffff' : '#000000'}
            pointBorderWidth={0}
            colors={isDarkMode ? { scheme: 'category10' } : { scheme: 'pastel1' }}
            pointBorderColor={chartConfig.pointBorderColor}
            pointLabelYOffset={-12}
            enableTouchCrosshair={true}
            useMesh={true}
            enableGridX={chartConfig.enableGridX}
            enableGridY={chartConfig.enableGridY}
            tooltip={(pos: PointTooltipProps) => <ToolTip position={pos} containerRef={containerRef} xName={chartConfig.toolTip.x} yName={chartConfig.toolTip.y} />}
            theme={isDarkMode ? darkTheme : lightTheme}
          />
        </div>
      </Card>
      <div className="flex gap-4 w-full mt-2">
        <Label className="w-full">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              Card Title
              <Checkbox
                checked={chartConfig.cardTitle !== null}
                onCheckedChange={(e) => {
                  // e is a boolean
                  if (e) {
                    handleConfigChange('cardTitle', initialChartConfig.cardTitle)
                  } else {
                    handleConfigChange('cardTitle', null)
                  }
                }}
              />
            </div>
          </div>
          <Input type="text" disabled={chartConfig.cardTitle == null} placeholder={chartConfig.cardTitle} onChange={(e) => handleConfigChange('cardTitle', e.target.value)} className="w-full" />
        </Label>
      </div>
      <div className="flex gap-4 w-full mt-2">
        <Label className="w-full">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              X-Axis Legend
              <Checkbox
                checked={chartConfig.axisBottom.legend !== null}
                onCheckedChange={(e) => {
                  // e is a boolean
                  if (e) {
                    handleConfigChange('axisBottom', {
                      ...chartConfig.axisBottom,
                      legend: initialChartConfig.axisBottom.legend
                    })
                  } else {
                    handleConfigChange('axisBottom', {
                      ...chartConfig.axisBottom,
                      legend: null
                    })
                  }
                  console.log('Show X-Axis:', e)
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              X-Axis Grid
              <Checkbox
                checked={chartConfig.enableGridX}
                onCheckedChange={(e) => {
                  // e is a boolean
                  handleConfigChange('enableGridX', e)
                }}
              />
            </div>
          </div>
          <Input
            type="text"
            disabled={chartConfig.axisBottom == null}
            placeholder={(chartConfig.axisBottom?.legend as string) || ''}
            onChange={(e) =>
              handleConfigChange('axisBottom', {
                ...chartConfig.axisBottom,
                legend: e.target.value
              })
            }
            className="w-full"
          />
        </Label>
      </div>
      <div className="flex gap-4 w-full mt-2">
        <Label className="w-full">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              Y-Axis Legend
              <Checkbox
                checked={chartConfig.axisLeft.legend !== null}
                onCheckedChange={(e) => {
                  // e is a boolean
                  if (e) {
                    handleConfigChange('axisLeft', {
                      ...chartConfig.axisLeft,
                      legend: initialChartConfig.axisLeft.legend
                    })
                  } else {
                    handleConfigChange('axisLeft', {
                      ...chartConfig.axisLeft,
                      legend: null
                    })
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              Y-Axis Grid
              <Checkbox
                checked={chartConfig.enableGridY}
                onCheckedChange={(e) => {
                  // e is a boolean
                  handleConfigChange('enableGridY', e)
                }}
              />
            </div>
          </div>
          <Input
            type="text"
            disabled={chartConfig.axisLeft == null}
            placeholder={(chartConfig.axisLeft?.legend as string) || ''}
            onChange={(e) =>
              handleConfigChange('axisLeft', {
                ...chartConfig.axisLeft,
                legend: e.target.value
              })
            }
            className="w-full"
          />
        </Label>
      </div>
      <div className="flex gap-4 w-1/2 mt-2">
        <Label>
          Point Size
          <div className="flex items-center">
            <Button onClick={() => handleConfigChange('pointSize', Math.max(chartConfig.pointSize - 1, 0))} variant={'destructive'} size={'icon'} className="flex items-center justify-center">
              <IoRemove />
            </Button>
            <Input type="number" value={chartConfig.pointSize} onChange={(e) => handleConfigChange('pointSize', Number(e.target.value))} />
            <Button onClick={() => handleConfigChange('pointSize', chartConfig.pointSize + 1)} variant={'green'} size={'icon'} className="flex items-center justify-center">
              <IoAdd />
            </Button>
          </div>
        </Label>
      </div>
      <div className="flex gap-4 w-full mt-2">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Tooltip options</AccordionTrigger>
            <AccordionContent className="w-full flex gap-4">
              {/* X and Y tooltip names */}
              <Label className="w-full">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">X-Axis Tooltip Name</div>
                </div>
                <Input
                  type="text"
                  placeholder={chartConfig.toolTip.x}
                  className="w-full"
                  onChange={(e) =>
                    handleConfigChange('toolTip', {
                      ...chartConfig.toolTip,
                      x: e.target.value
                    })
                  }
                />
              </Label>
              <Label className="w-full">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">Y-Axis Tooltip Name</div>
                </div>
                <Input
                  type="text"
                  placeholder={chartConfig.toolTip.y}
                  className="w-full"
                  onChange={(e) =>
                    handleConfigChange('toolTip', {
                      ...chartConfig.toolTip,
                      y: e.target.value
                    })
                  }
                />
              </Label>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <div className="flex justify-end mt-2">
        <Button onClick={() => onDataSubmit(chartConfig)} size={'default'}>
          Submit
        </Button>
      </div>
    </div>
  )
}
