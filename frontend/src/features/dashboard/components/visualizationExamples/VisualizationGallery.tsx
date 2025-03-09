import { ResponsiveBullet } from '@nivo/bullet'
import { ResponsiveLine } from '@nivo/line'
import styled from 'styled-components'
import { Card } from '@/components/ui/card'
import { useDarkMode } from '@/context/DarkModeContext'
import { darkTheme, lightTheme } from '../cards/ChartThemes'
import { SdParameterType } from '@/generated/graphql'

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
    </VisualizationGalleryContainer>
  )
}
