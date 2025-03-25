import { SequentialStatesVisualization } from './components/SequentialStatesVisualization'

const StatusTimeline = () => {
  const timelineData = [
    { time: '2025-03-23T01:30:00.000Z', value: 'Offline' },
    { time: '2025-03-23T03:00:00.000Z', value: 'Maintenance' },
    { time: '2025-03-23T04:30:00.000Z', value: 'Online' },
    { time: '2025-03-24T06:40:00.000Z', value: 'Maintenance' }
  ]

  return (
    <div>
      <SequentialStatesVisualization data={timelineData} />
    </div>
  )
}

export default StatusTimeline
