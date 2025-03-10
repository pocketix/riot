import { ResponsiveBullet } from '@nivo/bullet'
import { ResponsiveLine } from '@nivo/line'
import styled from 'styled-components'
import { Card } from '@/components/ui/card'
import { useDarkMode } from '@/context/DarkModeContext'
import { darkTheme, lightTheme } from '../cards/ChartThemes'
import { SdParameterType } from '@/generated/graphql'
import { EntityCardInfo } from '@/types/EntityCardInfo'
import { AutoCleanedStrongCache } from '@apollo/client/utilities'
import { Switch } from '@/components/ui/switch'

export const VisualizationGalleryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  height: fit-content;
`

export interface VisualizationGalleryProps {
  setSelectedVisualization: (Visualization: string) => void
  selectedVisualization: string | null
}

export function VisualizationGallery({ setSelectedVisualization, selectedVisualization }: VisualizationGalleryProps) {
  const { isDarkMode } = useDarkMode()

  const dataLine = [
    {
      id: 'temperature',
      color: 'hsl(118, 70%, 50%)',
      data: [
        {
          x: 10,
          y: 213
        },
        {
          x: 20,
          y: 209
        },
        {
          x: 34,
          y: 126
        },
        {
          x: 40,
          y: 207
        },
        {
          x: -4,
          y: 83
        },
        {
          x: 12,
          y: 101
        },
        {
          x: 4,
          y: 63
        },
        {
          x: 8,
          y: 67
        }
      ]
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

  const dataBullet = [
    {
      id: '',
      ranges: [20, 54, 94, 0, 120],
      measures: [106],
      markers: [110]
    }
  ]

  const entityCardConfig: EntityCardInfo = {
    _cardID: 'exampleCardID',
    title: 'Entity Card',
    rows: [
      {
        name: 'Sensor2',
        instance: null,
        parameter: null,
        visualization: 'sparkline',
        sparkLineData: {
          data: [
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
      },
      {
        name: 'Bathroom',
        instance: null,
        parameter: null,
        visualization: 'immediate',
        value: '22.5'
      },
      {
        name: 'Sensor1',
        instance: null,
        parameter: null,
        visualization: 'switch',
        value: 'on'
      }
    ]
  }

  return (
    <VisualizationGalleryContainer>
      <Card className={`${selectedVisualization === 'line' ? 'border-2 border-blue-500' : 'border-2'} h-[150px] box-border`} onClick={() => setSelectedVisualization('line')}>
        <ResponsiveLine
          data={dataLine}
          margin={{ top: 10, right: 20, bottom: 30, left: 35 }}
          xScale={{ type: 'point' }}
          yScale={{
            type: 'linear',
            min: 'auto',
            max: 'auto',
            stacked: true,
            reverse: false
          }}
          animate={false}
          yFormat=" >-.2f"
          pointSize={5}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabel="data.yFormatted"
          pointLabelYOffset={-12}
          enableTouchCrosshair={true}
          useMesh={false}
          theme={isDarkMode ? darkTheme : lightTheme}
        />
      </Card>
      <Card className={`${selectedVisualization === 'bullet' ? 'border-2 border-blue-500' : 'border-2'} h-[70px] box-border`} onClick={() => setSelectedVisualization('bullet')}>
        <ResponsiveBullet
          data={dataBullet}
          margin={{ top: 10, right: 10, bottom: 30, left: 10 }}
          spacing={46}
          titleAlign="start"
          titleOffsetX={-30}
          measureSize={0.2}
          theme={isDarkMode ? darkTheme : lightTheme}
          tooltip={() => null}
        />
      </Card>
      <Card className={`${selectedVisualization === 'table' ? 'border-2 border-blue-500' : 'border-2'} h-fit p-1 box-border`} onClick={() => setSelectedVisualization('table')}>
        <table className="w-full h-fit">
          <thead className="border-b-[2px]">
            <tr>
              <th className="text-left text-md">{dataTable.title}</th>
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
                  <td key={valueIndex} className="text-sm text-center">
                    {value.value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className={`${selectedVisualization === 'entitycard' ? 'border-2 border-blue-500' : 'border-2'} h-fit p-1 box-border`} onClick={() => setSelectedVisualization('entitycard')}>
        <table className="w-full h-fit">
          <thead className="border-b-[2px]">
            <tr>
              <th className="text-left text-md">Area</th>
              <th className="text-center text-md"></th>
            </tr>
          </thead>
          <tbody>
            {entityCardConfig.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="mt-2 h-[24px]">
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
                {row.visualization !== 'sparkline' && row.visualization !== 'immediate' && row.visualization !== 'switch' && <td className="text-sm text-center">{row.visualization}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </VisualizationGalleryContainer>
  )
}
