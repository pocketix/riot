import { Card } from '@/components/ui/card'
import { SdParameterType } from '@/generated/graphql'
import { EntityCardConfig } from '@/schemas/dashboard/visualizations/EntityCardBuilderSchema'
import { ResponsiveLineChart } from '../visualizations/ResponsiveLineChart'
import { ResponsiveBulletChart } from '../visualizations/ResponsiveBulletChart'
import { SwitchVisualization } from '../visualizations/SwitchVisualization'
import { ResponsiveEntityTable } from '../visualizations/ResponsiveEntityTable'
import { getCustomizableIcon } from '@/utils/getCustomizableIcon'
import { SequentialStatesVisualization } from '../devices/components/SequentialStatesVisualization'

export interface VisualizationGalleryProps {
  setSelectedVisualization: (Visualization: 'line' | 'switch' | 'table' | 'bullet' | 'entitycard' | 'seqstates') => void
  selectedVisualization: string | null
}

export function VisualizationGallery({ setSelectedVisualization, selectedVisualization }: VisualizationGalleryProps) {
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

  const seqStatesData = [
    {
      x: new Date(new Date(new Date().getTime() - 1000 * 60 * 60).toISOString().split('.')[0] + 'Z'),
      y: 'ON'
    },
    {
      x: new Date(new Date(new Date().getTime() - 1000 * 60 * 60 * 2).toISOString().split('.')[0] + 'Z'),
      y: 'OFF'
    },
    {
      x: new Date(new Date(new Date().getTime() - 1000 * 60 * 60 * 3).toISOString().split('.')[0] + 'Z'),
      y: 'OFF'
    },
    {
      x: new Date(new Date(new Date().getTime() - 1000 * 60 * 60 * 4).toISOString().split('.')[0] + 'Z'),
      y: 'OFF'
    },
    {
      x: new Date(new Date(new Date().getTime() - 1000 * 60 * 60 * 5).toISOString().split('.')[0] + 'Z'),
      y: 'ON'
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
        visualization: 'immediate',
        valueSymbol: '°C'
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
  const IconComponent = getCustomizableIcon('TbBulb')

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <Card
        className={`${selectedVisualization === 'line' ? 'border-2 border-blue-500' : 'border-2'} h-[150px] w-full cursor-pointer`}
        onClick={() => setSelectedVisualization('line')}
      >
        <div className="relative h-[150px] w-full overflow-hidden">
          <div className="absolute inset-0 pb-2">
            <ResponsiveLineChart data={dataLine} />
            {/* overlay to disable tooltips, same with bulletchart below */}
            <div className="z-2 absolute inset-0" />
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
            <div className="z-2 absolute inset-0" />
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
        className={`${selectedVisualization === 'entitycard' ? 'border-2 border-blue-500' : 'border-2'} relative box-border h-fit cursor-pointer p-1`}
        onClick={() => setSelectedVisualization('entitycard')}
      >
        <div className="absolute inset-0 z-10" />
        <ResponsiveEntityTable
          config={{
            ...entityCardConfig,
            rows: entityCardConfig.rows.map((row) => ({
              ...row,
              instance: {
                uid: row.instance.uid,
                id: row.instance.id
              },
              parameter: {
                id: row.parameter.id,
                denotation: row.parameter.denotation
              }
            }))
          }}
          mock={true}
          sparklineData={dataLine}
        />
      </Card>
      <Card
        className={`${selectedVisualization === 'switch' ? 'border-2 border-blue-500' : 'border-2'} relative box-border h-fit cursor-pointer p-1`}
        onClick={() => setSelectedVisualization('switch')}
      >
        <div className="absolute inset-0 z-10" />
        <SwitchVisualization isOn={true} percentage={50} title="Spotlight" icon={IconComponent} />
      </Card>
      <Card
        className={`${selectedVisualization === 'seqstates' ? 'border-2 border-blue-500' : 'border-2'} relative box-border h-[70px] cursor-pointer p-1`}
        onClick={() => setSelectedVisualization('seqstates')}
      >
        <div className="absolute inset-0 z-10" />
        <SequentialStatesVisualization data={seqStatesData} />
      </Card>
    </div>
  )
}
