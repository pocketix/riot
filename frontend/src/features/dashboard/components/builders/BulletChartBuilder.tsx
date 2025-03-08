import { useEffect, useRef, useState } from 'react'
import { ResponsiveBullet } from '@nivo/bullet'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useDarkMode } from '@/context/DarkModeContext'
import { darkTheme, lightTheme } from '../cards/ChartThemes'

export interface BulletChartBuilderProps {
  onDataSubmit: (data: any) => void
  parameterName: string
}

export function BulletChartBuilder({ onDataSubmit, parameterName }: BulletChartBuilderProps) {
  const parameterNameMock = useRef<HTMLSpanElement | null>(null)
  const { isDarkMode } = useDarkMode()

  const initialChartConfig = {
    margin: { top: 10, right: 10, bottom: 30, left: 50 },
    titleAlign: 'start',
    titleOffsetX: -20,
    measureSize: 0.2,
    animate: true,
    minValue: 0,
    id: parameterName,
    ranges: [20, 54, 94, 0, 5, 120],
    markers: [110]
  }

  const [chartConfig, setChartConfig] = useState(initialChartConfig)
  const [previousId, setPreviousId] = useState('')
  const [newRange, setNewRange] = useState({ lower: '', upper: '' })
  const [newMarker, setNewMarker] = useState('')

  const handleConfigChange = (property: string, value: any) => {
    setChartConfig((prevConfig) => ({
      ...prevConfig,
      [property]: value
    }))
  }

  // Calculate the parameter name width and adjust the left margin accordingly
  function calculateOffset() {
    if (parameterNameMock) {
      const width = parameterNameMock.current!.offsetWidth
      console.log('Calculating width', width)
      setChartConfig((prevConfig) => {
        const newOffsetX = 0 - (width * 1.1) / 2
        const newMargin = { ...prevConfig.margin, left: 20 + width }
        return {
          ...prevConfig,
          titleOffsetX: newOffsetX,
          margin: newMargin
        }
      })
    }
  }

  useEffect(() => {
    calculateOffset()
  }, [chartConfig.id, parameterNameMock])

  useEffect(() => {
    calculateOffset()
  }, [parameterName])

  const handleAddRange = () => {
    const lower = parseFloat(newRange.lower)
    const upper = parseFloat(newRange.upper)
    if (!isNaN(lower) && !isNaN(upper)) {
      setChartConfig((prevConfig) => ({
        ...prevConfig,
        ranges: [...prevConfig.ranges, lower, upper]
      }))
      setNewRange({ lower: '', upper: '' })
    }
  }

  const handleRemoveRange = (index: number) => {
    setChartConfig((prevConfig) => ({
      ...prevConfig,
      ranges: prevConfig.ranges.filter((_, i) => i !== index * 2 && i !== index * 2 + 1)
    }))
  }

  const handleAddMarker = () => {
    const marker = parseFloat(newMarker)
    if (!isNaN(marker)) {
      setChartConfig((prevConfig) => ({
        ...prevConfig,
        markers: [...prevConfig.markers, marker]
      }))
      setNewMarker('')
    }
  }

  const handleRemoveMarker = (index: number) => {
    setChartConfig((prevConfig) => ({
      ...prevConfig,
      markers: prevConfig.markers.filter((_, i) => i !== index)
    }))
  }

  const dataBullet = [
    {
      id: chartConfig.id,
      ranges: chartConfig.ranges,
      measures: [106],
      markers: chartConfig.markers
    }
  ]

  return (
    <div className="w-full">
      <span className="absolute top-0 left-1/2 transform -translate-x-1/2 text-[11px] font-semibold invisible" ref={parameterNameMock}>
        {chartConfig.id}
      </span>
      <Card className="h-[75px] w-full">
        <div className="h-full w-full scale-[0.9] sm:scale-100">
          <ResponsiveBullet
            data={dataBullet}
            margin={chartConfig.margin}
            animate={chartConfig.animate}
            titleOffsetX={chartConfig.titleOffsetX}
            measureSize={chartConfig.measureSize}
            minValue={chartConfig.minValue}
            theme={isDarkMode ? darkTheme : lightTheme}
          />
        </div>
      </Card>
      <div className="w-full grid sm:grid-cols-2 gap-4 mt-2">
        <Label>
          <div className="flex items-center gap-2">
            Display
            <Checkbox
              checked={chartConfig.id.length > 0}
              onCheckedChange={(e) => {
                if (e) {
                  handleConfigChange('id', previousId)
                } else {
                  setPreviousId(chartConfig.id)
                  handleConfigChange('id', '')
                }
              }}
            />
          </div>
          <Input type="text" placeholder={chartConfig.id} value={chartConfig.id} onChange={(e) => handleConfigChange('id', e.target.value)} className="w-full" />
        </Label>
      </div>
      <div className="w-full mt-2">
        <h3 className="font-semibold">Ranges</h3>
        <div className="w-full flex flex-row grow items-center gap-2 mt-1">
          {chartConfig.ranges
            .reduce<number[][]>((acc, _, i, arr) => {
              if (i % 2 === 0) {
                const range = arr.slice(i, i + 2)
                if (range[0] > range[1]) {
                  ;[range[0], range[1]] = [range[1], range[0]]
                }
                acc.push(range)
              }
              return acc
            }, [])
            .map((range, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-200 p-2 pt-0 pb-0 rounded-xl">
                <span className="font-semibold">{range[0]}</span> - <span className="font-semibold">{range[1]}</span>{' '}
                <Button onClick={() => handleRemoveRange(index)} className="p-1 h-7 text-red-600 font-bold" variant={'ghost'} size={'sm'}>
                  x
                </Button>
              </div>
            ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Input type="number" placeholder="Lower bound" value={newRange.lower} onChange={(e) => setNewRange({ ...newRange, lower: e.target.value })} />
          <Input type="number" placeholder="Upper bound" value={newRange.upper} onChange={(e) => setNewRange({ ...newRange, upper: e.target.value })} />
          <Button onClick={handleAddRange}>Add Range</Button>
        </div>
      </div>
      <div className="w-full mt-2">
        <h3 className="font-semibold">Targets</h3>
        <div className="flex flex-row grow items-center gap-2 mt-1">
          {chartConfig.markers.map((marker, index) => (
            <div key={index} className="flex items-center bg-gray-200 p-2 pt-0 pb-0 rounded-xl">
              <span className="font-semibold">{marker}</span>{' '}
              <Button onClick={() => handleRemoveMarker(index)} className="p-1 h-7 text-red-600 font-bold" variant={'ghost'} size={'sm'}>
                x
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Input type="number" placeholder="Marker" value={newMarker} onChange={(e) => setNewMarker(e.target.value)} />
          <Button onClick={handleAddMarker}>Add Target</Button>
        </div>
      </div>
      <Button className="flex justify-center mt-4 w-3/4 mx-auto" onClick={() => onDataSubmit(chartConfig)}>
        Submit
      </Button>
    </div>
  )
}
