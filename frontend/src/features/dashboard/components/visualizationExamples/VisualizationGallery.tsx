import { ResponsiveLine } from '@nivo/line'
import { Card } from '@/components/ui/card'
import { useDarkMode } from '@/context/DarkModeContext'
import { darkTheme, lightTheme } from '../cards/components/ChartThemes'
import { SdParameterType } from '@/generated/graphql'
import { Switch } from '@/components/ui/switch'
import { EntityCardConfig } from '@/schemas/dashboard/EntityCardBuilderSchema'
import { ResponsiveLineChart } from '../visualizations/ResponsiveLineChart'
import { ResponsiveBulletChart } from '../visualizations/ResponsiveBulletChart'

export interface VisualizationGalleryProps {
  setSelectedVisualization: (Visualization: 'line' | 'switch' | 'table' | 'bullet' | 'entitycard') => void
  selectedVisualization: string | null
}

export function VisualizationGallery({ setSelectedVisualization, selectedVisualization }: VisualizationGalleryProps) {
  const { isDarkMode } = useDarkMode()

  const sparkLineData = [
    {
      x: new Date(new Date(new Date().getTime() - 1000 * 60 * 60).toISOString().split('.')[0] + 'Z'),
      y: 15.1
    },
    {
      x: new Date(new Date(new Date().getTime() - 1000 * 60 * 60 * 2).toISOString().split('.')[0] + 'Z'),
      y: 23.1
    },
    {
      x: new Date(new Date(new Date().getTime() - 1000 * 60 * 60 * 3).toISOString().split('.')[0] + 'Z'),
      y: 20.8
    },
    {
      x: new Date(new Date(new Date().getTime() - 1000 * 60 * 60 * 4).toISOString().split('.')[0] + 'Z'),
      y: 26.5
    },
    {
      x: new Date(new Date(new Date().getTime() - 1000 * 60 * 60 * 5).toISOString().split('.')[0] + 'Z'),
      y: 30.3
    }
  ]

  const dataLine = [
    {
      id: 'linkquality zighbee2mqtt/CC2530.ROUTER/0x00124b00096dfca7',
      data: sparkLineData
    }
  ]

  const dataTable: any = {
    _cardID: 'exampleCardID',
    title: 'Table',
    icon: 'temperature-icon',
    aggregatedTime: '1h',
    instances: [
      {
        order: 1,
        instance: {
          uid: 'instance1',
          id: 'instance1-id',
          userIdentifier: 'example-user'
        },
        params: [
          {
            denotation: 'temperature',
            id: '1',
            type: SdParameterType.Number
          }
        ]
      }
    ],
    columns: [
      {
        header: 'Mean',
        function: 'MEAN'
      },
      {
        header: 'Min',
        function: 'MIN'
      },
      {
        header: 'Max',
        function: 'MAX'
      }
    ],
    rows: [
      {
        name: 'Sensor1',
        values: [
          {
            value: '22.5'
          },
          {
            value: '20.5'
          },
          {
            value: '24.5'
          }
        ]
      },
      {
        name: 'Sensor2',
        values: [
          {
            value: '23.1'
          },
          {
            value: '21.5'
          },
          {
            value: '24.5'
          }
        ]
      },
      {
        name: 'Bathroom',
        values: [
          {
            value: '21.8'
          },
          {
            value: '19.5'
          },
          {
            value: '24.3'
          }
        ]
      }
    ]
  }

  const dataBullet = {
    id: '',
    ranges: [20, 54, 94, 0, 120],
    measures: [106],
    markers: [110]
  }

  const entityCardConfig: EntityCardConfig = {
    title: 'Entity Card',
    rows: [
      {
        name: 'Sensor2',
        instance: {
          uid: 'sensor2',
          id: -1
        },
        parameter: {
          id: 1,
          denotation: 'temperature'
        },
        visualization: 'sparkline'
      },
      {
        name: 'Bathroom',
        instance: {
          uid: 'sensor2',
          id: -1
        },
        parameter: {
          id: 1,
          denotation: 'temperature'
        },
        visualization: 'immediate'
      },
      {
        name: 'Sensor1',
        instance: {
          uid: 'sensor2',
          id: -1
        },
        parameter: {
          id: 1,
          denotation: 'temperature'
        },
        visualization: 'switch'
      }
    ]
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <Card
        className={`${selectedVisualization === 'line' ? 'border-2 border-blue-500' : 'border-2'} h-[150px] w-full cursor-pointer`}
        onClick={() => setSelectedVisualization('line')}
      >
        <div className="relative h-[150px] w-full overflow-hidden">
          <div className="absolute inset-0 pb-2">
            <ResponsiveLineChart data={dataLine} />
            <div className="absolute inset-0 z-10" />
          </div>
        </div>
      </Card>
      <Card
        className={`${selectedVisualization === 'bullet' ? 'border-2 border-blue-500' : 'border-2'} box-border h-[70px] min-w-0 cursor-pointer`}
        onClick={() => setSelectedVisualization('bullet')}
      >
        <div className="relative h-[80px] w-full overflow-hidden">
          <div className="absolute inset-0 p-2 px-2">
            <ResponsiveBulletChart data={dataBullet} />
          </div>
        </div>
      </Card>
      <Card
        className={`${selectedVisualization === 'table' ? 'border-2 border-blue-500' : 'border-2'} box-border h-fit cursor-pointer p-1`}
        onClick={() => setSelectedVisualization('table')}
      >
        <table className="m-1 h-fit w-full">
          <thead className="border-b-[2px]">
            <tr>
              <th className="text-md text-left">{dataTable.title}</th>
              {dataTable.columns.map((column: any, index: any) => (
                <th key={index} className="text-center text-xs">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataTable.rows.map((row: any, rowIndex: any) => (
              <tr key={rowIndex}>
                <td className="text-sm">{row.name}</td>
                {row.values.map((value: any, valueIndex: any) => (
                  <td key={valueIndex} className="text-center text-sm">
                    {value.value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card
        className={`${selectedVisualization === 'entitycard' ? 'border-2 border-blue-500' : 'border-2'} box-border h-fit cursor-pointer p-1`}
        onClick={() => setSelectedVisualization('entitycard')}
      >
        <table className="m-1 h-fit w-full">
          <thead className="border-b-[2px]">
            <tr>
              <th className="text-md text-left">Area</th>
              <th className="text-md text-center"></th>
            </tr>
          </thead>
          <tbody>
            {entityCardConfig.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="mt-2 h-[24px]">
                <td className="text-sm">{row.name}</td>
                {row.visualization === 'sparkline' && (
                  <td className="h-[24px] w-[75px] text-center text-sm">
                    <ResponsiveLine
                      data={[
                        {
                          id: 'temperature',
                          data: sparkLineData
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
                {row.visualization === 'immediate' && <td className="text-center text-sm">23</td>}
                {row.visualization === 'switch' && (
                  <td className="text-center text-sm">
                    <Switch checked={true} />
                  </td>
                )}
                {row.visualization !== 'sparkline' &&
                  row.visualization !== 'immediate' &&
                  row.visualization !== 'switch' && <td className="text-center text-sm">{row.visualization}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
