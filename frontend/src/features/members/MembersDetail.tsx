import styled from 'styled-components'
import { useParams, useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { breakpoints } from '@/styles/Breakpoints'
import { toast } from 'sonner'
import { IoCopy } from 'react-icons/io5'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem;
  align-items: center;

  @media (min-width: ${breakpoints.sm}) {
    padding: 2rem;
  }
`

const Card = styled.div`
  background: var(--color-grey-0);
  padding: 2rem;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  box-shadow: 0px 2px 8px var(--color-grey-200);
`

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;

  @media (min-width: ${breakpoints.sm}) {
    flex-direction: row;
  }
`

const ProfileImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--color-grey-200);

  @media (min-width: ${breakpoints.sm}) {
    width: 100px;
    height: 100px;
  }
`

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const InfoRow = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.95rem;
  span:first-child {
    font-weight: 600;
    min-width: 100px;
    color: var(--color-grey-500);
  }
`

const Subsection = styled.div`
  margin-top: 1.5rem;
`

const List = styled.ul`
  list-style: disc;
  padding-left: 1.5rem;
`

const mockedUsers = [
  {
    id: '1',
    username: 'john_doe',
    name: 'John Doe',
    email: 'john@example.com',
    profileImageURL: '/placeholders/avatar1.webp',
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    roles: ['Admin'],
    permissions: ['read:all', 'write:config'],
    userConfig: {
      userId: 1,
      config: {
        riot: {
          layout: {
            lg: [
              { h: 2, i: '1', w: 4, x: 0, y: 0, minH: 2, minW: 0, moved: false, static: false },
              { h: 2, i: '2', w: 2, x: 0, y: 2, minH: 2, minW: 0, moved: false, static: false },
              { h: 3, i: '3', w: 2, x: 0, y: 4, minH: 0, minW: 0, moved: false, static: false },
              { h: 1, i: '4', w: 1, x: 2, y: 2, minH: 0, minW: 0, moved: false, static: false },
              { h: 2, i: '5', w: 2, x: 0, y: 7, minH: 2, minW: 0, moved: false, static: false },
              { h: 1, i: '6', w: 2, x: 0, y: 9, minH: 0, minW: 0, moved: false, static: false },
              { h: 1.5, i: '7', w: 1, x: 2, y: 3, minH: 0, minW: 0, moved: false, static: false }
            ],
            md: [
              { h: 2, i: '1', w: 2, x: 0, y: 0, minH: 2, minW: 0, moved: false, static: false },
              { h: 2, i: '2', w: 2, x: 0, y: 10.5, minH: 2, minW: 0, moved: false, static: false },
              { h: 3, i: '3', w: 2, x: 0, y: 7.5, minH: 0, minW: 0, moved: false, static: false },
              { h: 1, i: '4', w: 1, x: 0, y: 6.5, minH: 0, minW: 0, moved: false, static: false },
              { h: 2, i: '5', w: 2, x: 0, y: 4.5, minH: 2, minW: 0, moved: false, static: false },
              { h: 1, i: '6', w: 2, x: 0, y: 3.5, minH: 0, minW: 0, moved: false, static: false },
              { h: 1.5, i: '7', w: 1, x: 0, y: 2, minH: 0, minW: 0, moved: false, static: false }
            ],
            xs: [
              { h: 2, i: '1', w: 2, x: 0, y: 0, minH: 2, minW: 0, moved: false, static: false },
              { h: 2, i: '2', w: 2, x: 0, y: 10.5, minH: 2, minW: 0, moved: false, static: false },
              { h: 3, i: '3', w: 2, x: 0, y: 7.5, minH: 0, minW: 0, moved: false, static: false },
              { h: 1, i: '4', w: 1, x: 0, y: 6.5, minH: 0, minW: 0, moved: false, static: false },
              { h: 2, i: '5', w: 2, x: 0, y: 4.5, minH: 2, minW: 0, moved: false, static: false },
              { h: 1, i: '6', w: 2, x: 0, y: 3.5, minH: 0, minW: 0, moved: false, static: false },
              { h: 1.5, i: '7', w: 1, x: 0, y: 2, minH: 0, minW: 0, moved: false, static: false }
            ],
            xxs: [
              { h: 2, i: '1', w: 1, x: 0, y: 7.5, minH: 2, minW: 0, moved: false, static: false },
              { h: 2, i: '2', w: 1, x: 0, y: 5.5, minH: 2, minW: 0, moved: false, static: false },
              { h: 3, i: '3', w: 1, x: 0, y: 9.5, minH: 0, minW: 0, moved: false, static: false },
              { h: 1, i: '4', w: 1, x: 0, y: 0, minH: 0, minW: 0, moved: false, static: false },
              { h: 2, i: '5', w: 1, x: 0, y: 3.5, minH: 2, minW: 0, moved: false, static: false },
              { h: 1, i: '6', w: 1, x: 0, y: 2.5, minH: 0, minW: 0, moved: false, static: false },
              { h: 1.5, i: '7', w: 1, x: 0, y: 1, minH: 0, minW: 0, moved: false, static: false }
            ]
          },
          details: {
            '1': {
              layoutID: '1',
              visualization: 'line',
              visualizationConfig: {
                margin: { top: 10, left: 51, right: 20, bottom: 30 },
                yScale: { max: 'auto', min: 'auto', type: 'linear', format: '>-.1~f', stacked: false },
                toolTip: { x: 'Time', y: 'Value', yFormat: '>-.1~f' },
                axisLeft: { legend: '', legendOffset: -51, legendPosition: 'middle' },
                cardTitle: 'Router',
                instances: [
                  {
                    uid: 'zighbee2mqtt/CC2530.ROUTER/0x00124b00096dfca7',
                    parameters: [
                      { id: 43, denotation: 'linkquality' },
                      { id: 44, denotation: 'rssi' }
                    ]
                  },
                  {
                    uid: 'zighbee2mqtt/WSD500A/0xa4c138f78d4295ae',
                    parameters: [{ id: 47, denotation: 'temperature' }]
                  }
                ],
                pointSize: 3,
                timeFrame: '10080',
                axisBottom: { format: '%H:%M', legend: '', tickValues: 6, legendOffset: 36, legendPosition: 'middle' },
                enableGridX: true,
                enableGridY: true,
                decimalPlaces: 1,
                aggregateMinutes: 315
              }
            },
            '2': {
              layoutID: '2',
              visualization: 'line',
              visualizationConfig: {
                margin: { top: 10, left: 65, right: 20, bottom: 30 },
                yScale: { max: 'auto', min: 'auto', type: 'linear', format: '>-.1~f', stacked: false },
                toolTip: { x: 'Time', y: 'Value', yFormat: '>-.1~f' },
                axisLeft: { legend: 'value', legendOffset: -45, legendPosition: 'middle' },
                cardTitle: 'Line Chart',
                instances: [
                  { uid: 'zighbee2mqtt/CC2530.ROUTER/0x00124b00096dfca7', parameters: [{ id: 44, denotation: 'rssi' }] }
                ],
                pointSize: 3,
                timeFrame: '60',
                axisBottom: { format: '%H:%M', legend: '', tickValues: 6, legendOffset: 36, legendPosition: 'middle' },
                enableGridX: true,
                enableGridY: true,
                decimalPlaces: 1,
                aggregateMinutes: 2
              }
            },
            '3': {
              layoutID: '3',
              visualization: 'bullet',
              visualizationConfig: {
                rows: [
                  {
                    config: {
                      name: 'linkquality',
                      margin: { top: 10, left: 62, right: 10, bottom: 30 },
                      markers: [100],
                      function: 'last',
                      timeFrame: '1440',
                      colorScheme: 'nivo',
                      measureSize: 0.2,
                      titleOffsetX: -28.5
                    },
                    instance: { uid: 'zighbee2mqtt/CC2530.ROUTER/0x00124b00096dfca7' },
                    parameter: { id: 43, denotation: 'linkquality' }
                  },
                  {
                    config: {
                      name: 'temp 2',
                      margin: { top: 10, left: 45, right: 10, bottom: 30 },
                      markers: [22],
                      function: 'min',
                      maxValue: 40,
                      minValue: 'auto',
                      timeFrame: '4320',
                      measureSize: 0.2,
                      titleOffsetX: -20
                    },
                    instance: { uid: 'zighbee2mqtt/ZG-227Z/0xa4c138c94b19b05e' },
                    parameter: { id: 45, denotation: 'humidity' }
                  },
                  {
                    config: {
                      name: 'Humidity',
                      margin: { top: 10, left: 56, right: 10, bottom: 30 },
                      markers: [50],
                      function: 'min',
                      maxValue: 'auto',
                      minValue: 'auto',
                      timeFrame: '10080',
                      measureSize: 0.2,
                      titleOffsetX: -25.5
                    },
                    instance: { uid: 'zighbee2mqtt/GW1100A_V2.2.7/DB96213EF363D6EB059363B120DB957E' },
                    parameter: { id: 3, denotation: 'tempin' }
                  }
                ],
                cardTitle: 'Bullet Charts'
              }
            },
            '4': {
              layoutID: '4',
              visualization: 'entitycard',
              visualizationConfig: {
                rows: [
                  {
                    name: '123',
                    instance: { uid: 'zighbee2mqtt/ZG-227Z/0xa4c138c94b19b05e' },
                    parameter: { id: 52, denotation: 'linkquality' },
                    timeFrame: '4320',
                    visualization: 'sparkline'
                  },
                  {
                    name: 'Router RSSI',
                    instance: { uid: 'zighbee2mqtt/CC2530.ROUTER/0x00124b00096dfca7' },
                    parameter: { id: 44, denotation: 'rssi' },
                    timeFrame: '',
                    visualization: 'immediate'
                  }
                ],
                title: 'Entity Card'
              }
            },
            '5': {
              layoutID: '5',
              visualization: 'line',
              visualizationConfig: {
                margin: { top: 10, left: 51, right: 20, bottom: 30 },
                yScale: { max: 'auto', min: 'auto', type: 'linear', format: '>-.1~f', stacked: false },
                toolTip: { x: 'Time', y: 'Value', yFormat: '>-.1~f' },
                axisLeft: { legend: '', legendOffset: -51, legendPosition: 'middle' },
                cardTitle: 'Line Chart',
                instances: [
                  {
                    uid: 'zighbee2mqtt/CC2530.ROUTER/0x00124b00096dfca7',
                    parameters: [
                      { id: 43, denotation: 'linkquality' },
                      { id: 44, denotation: 'rssi' }
                    ]
                  }
                ],
                pointSize: 3,
                timeFrame: '4320',
                axisBottom: { format: '%H:%M', legend: '', tickValues: 6, legendOffset: 36, legendPosition: 'middle' },
                enableGridX: true,
                enableGridY: true,
                decimalPlaces: 1,
                aggregateMinutes: 135
              }
            },
            '6': {
              layoutID: '6',
              visualization: 'table',
              visualizationConfig: {
                rows: [
                  {
                    name: 'Sensor1',
                    instance: { uid: 'zighbee2mqtt/WSD500A/0xa4c138f78d4295ae' },
                    parameter: { id: 47, denotation: 'temperature' }
                  }
                ],
                title: 'Area',
                columns: [
                  { header: 'Min', function: 'min' },
                  { header: 'Max', function: 'max' }
                ],
                timeFrame: '1440',
                tableTitle: 'Sensors',
                decimalPlaces: 1
              }
            },
            '7': {
              layoutID: '7',
              visualization: 'entitycard',
              visualizationConfig: {
                rows: [
                  {
                    name: 'Event rain',
                    instance: { uid: 'zighbee2mqtt/GW1100A_V2.2.7/DB96213EF363D6EB059363B120DB957E' },
                    parameter: { id: 17, denotation: 'eventrain' },
                    timeFrame: '',
                    visualization: 'immediate'
                  },
                  {
                    name: 'Frost risk',
                    instance: { uid: 'zighbee2mqtt/GW1100A_V2.2.7/DB96213EF363D6EB059363B120DB957E' },
                    parameter: { id: 29, denotation: 'frostrisk' },
                    timeFrame: '',
                    visualization: 'immediate'
                  },
                  {
                    name: 'Relay temp',
                    instance: { uid: 'zighbee2mqtt/GW1100A_V2.2.7/DB96213EF363D6EB059363B120DB957E' },
                    parameter: { id: 10, denotation: 'relay_0_temperature' },
                    timeFrame: '',
                    visualization: 'immediate'
                  }
                ],
                title: 'Weather Station'
              }
            }
          }
        }
      }
    }
  },
  {
    id: '2',
    username: 'alice_wonder',
    name: 'Alice Wonder',
    email: 'alice@example.com',
    profileImageURL: '/placeholders/avatar2.webp',
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    roles: ['Viewer'],
    permissions: ['read:all'],
    userConfig: {
      theme: 'light',
      language: 'fr',
      shortcuts: true
    }
  },
  {
    id: '3',
    username: 'tech_wizard',
    name: 'Lucas Sky',
    email: 'lucas@example.com',
    profileImageURL: '/placeholders/avatar3.webp',
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 30),
    roles: ['Editor'],
    permissions: ['read:all', 'edit:devices'],
    userConfig: {
      autoSave: true,
      theme: 'system',
      tools: ['inspector', 'terminal']
    }
  },
  {
    id: '4',
    username: 'greenfox',
    name: 'Anna Fox',
    email: 'anna@example.com',
    profileImageURL: '/placeholders/avatar4.webp',
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    roles: ['Viewer'],
    permissions: ['read:devices'],
    userConfig: {
      theme: 'dark',
      favoriteDevices: ['Sensor A', 'Camera 5']
    }
  },
  {
    id: '5',
    username: 'admin_max',
    name: 'Max Power',
    email: 'max@example.com',
    profileImageURL: '/placeholders/avatar5.webp',
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 15),
    roles: ['Admin'],
    permissions: ['*'],
    userConfig: {
      devMode: true,
      logging: 'verbose',
      accessLevel: 10
    }
  }
]

export default function MembersDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = mockedUsers.find((u) => u.id === id)

  if (!user) return <p className="text-red-500">User not found</p>

  return (
    <Container>
      <Card>
        <Header>
          <ProfileImage src={user.profileImageURL || ''} alt={user.username} />
          <InfoSection>
            <InfoRow>
              <span>Username:</span>
              <span>{user.username}</span>
            </InfoRow>
            <InfoRow>
              <span>Name:</span>
              <span>{user.name}</span>
            </InfoRow>
            <InfoRow>
              <span>Email:</span>
              <span>{user.email}</span>
            </InfoRow>
            <InfoRow>
              <span>Last login:</span>
              <span>{formatDistanceToNow(user.lastLoginAt, { addSuffix: true })}</span>
            </InfoRow>
          </InfoSection>
        </Header>

        <Subsection>
          <strong>Roles</strong>
          <List>
            {user.roles.map((role) => (
              <li key={role}>{role}</li>
            ))}
          </List>
        </Subsection>

        <Subsection>
          <strong>Permissions</strong>
          <List>
            {user.permissions.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </List>
        </Subsection>

        <Accordion type="single" collapsible className="mt-4 w-full">
          <AccordionItem value="developer">
            <AccordionTrigger>Developer 🛠️</AccordionTrigger>
            <AccordionContent className="relative">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(user.userConfig, null, 2))
                  toast.success('Copied to clipboard')
                }}
                className="absolute right-2 top-2 z-10 rounded-md bg-[--color-grey-200] p-1 hover:bg-[--color-grey-300]"
                title="Copy JSON"
              >
                <IoCopy className="h-4 w-4 text-[--color-white]" />
              </button>

              <pre className="overflow-auto whitespace-pre-wrap rounded bg-[--color-grey-100] p-3 text-sm">
                {JSON.stringify(user.userConfig, null, 2)}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-6">
          <Button onClick={() => navigate('/members')}>&larr; Back to Members</Button>
        </div>
      </Card>
    </Container>
  )
}
