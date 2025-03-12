import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { getIcon } from '@/utils/getIcon'

// Subset of available icons
const iconOptions = [
  {
    category: 'Devices & Connectivity',
    icons: ['TbDeviceDesktop', 'TbDeviceMobile', 'TbDeviceTablet', 'TbDeviceWatch', 'TbDevices', 'TbRouter', 'TbSatellite', 'TbAntennaBars5', 'TbWifi', 'TbBluetooth']
  },
  { category: 'Sensors & Measurements', icons: ['TbTemperature', 'TbThermometer', 'TbGauge', 'TbBarometer', 'TbDashboard', 'TbSpeedometer'] },
  { category: 'Home Automation', icons: ['TbBulb', 'TbPlug', 'TbSwitch', 'TbHome', 'TbLock', 'TbKey'] },
  { category: 'Networking & Cloud', icons: ['TbCloud', 'TbCloudUpload', 'TbCloudDownload', 'TbServer', 'TbDatabase', 'TbNetwork'] },
  { category: 'Security & Alerts', icons: ['TbShield', 'TbShieldLock', 'TbAlertCircle', 'TbBell', 'TbAlarm'] },
  { category: 'Automation & Control', icons: ['TbSettings', 'TbAdjustments', 'TbSliders', 'TbSwitchHorizontal', 'TbSwitchVertical'] },
  { category: 'Energy & Power', icons: ['TbBattery', 'TbBatteryCharging', 'TbBatteryFull', 'TbBatteryLow', 'TbPlugConnected'] }
]

interface DeviceType {
  label: string
  denotation: string
  icon: string
  parameters: { label: string | null; denotation: string; type: string }[]
}

interface IconPickerProps {
  deviceType: DeviceType
  setDeviceType: React.Dispatch<React.SetStateAction<DeviceType>>
}

export default function IconPicker({ deviceType, setDeviceType }: IconPickerProps) {
  const IconComponent = getIcon(deviceType.icon)

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">{IconComponent ? <IconComponent /> : 'Select Icon'}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 max-h-60 overflow-auto">
          {iconOptions.map((group) => (
            <div key={group.category}>
              <DropdownMenuItem disabled className="font-bold text-gray-500">
                {group.category}
              </DropdownMenuItem>
              {group.icons.map((icon) => {
                const Icon = getIcon(icon)
                return (
                  <DropdownMenuItem key={icon} onClick={() => setDeviceType({ ...deviceType, icon })} className="flex items-center gap-2 ">
                    {Icon && <Icon />} {icon}
                  </DropdownMenuItem>
                )
              })}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
