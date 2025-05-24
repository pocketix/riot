// Based on Marek Joukl's IconPicker, this one is used within shadcn/ui forms, which require forwardRef due to Radix UI slots.
// Also uses shadcn scroll-area and more human-readable icon names.

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { forwardRef } from 'react'
import { getCustomizableIcon } from '@/utils/getCustomizableIcon'
import { ScrollArea } from '@/components/ui/scroll-area'

const iconNames: Record<string, string> = {
  // Devices & Connectivity
  TbDeviceDesktop: 'Desktop',
  TbDeviceMobile: 'Mobile Phone',
  TbDeviceTablet: 'Tablet',
  TbDeviceWatch: 'Smart Watch',
  TbDevices: 'Devices',
  TbRouter: 'Router',
  TbSatellite: 'Satellite',
  TbAntennaBars5: 'Signal Strength',
  TbWifi: 'WiFi',
  TbBluetooth: 'Bluetooth',

  // Sensors & Measurements
  TbTemperature: 'Temperature',
  TbThermometer: 'Thermometer',
  TbGauge: 'Gauge',
  TbTestPipe2Filled: 'Test Sensor',
  TbDashboard: 'Dashboard',
  TbBrandSpeedtest: 'Speed Test',

  // Home Automation
  TbBulb: 'Light Bulb',
  TbPlug: 'Power Plug',
  TbSwitch: 'Switch',
  TbHome: 'Home',
  TbLock: 'Lock',
  TbKey: 'Key',

  // Networking & Cloud
  TbCloud: 'Cloud',
  TbCloudUpload: 'Cloud Upload',
  TbCloudDownload: 'Cloud Download',
  TbServer: 'Server',
  TbDatabase: 'Database',
  TbNetwork: 'Network',

  // Security & Alerts
  TbShield: 'Shield',
  TbShieldLock: 'Security',
  TbAlertCircle: 'Alert',
  TbBell: 'Notification',
  TbAlarm: 'Alarm',

  // Automation & Control
  TbSettings: 'Settings',
  TbAdjustments: 'Adjustments',
  TbSettingsAutomation: 'Automation',
  TbSwitchHorizontal: 'Switch Horizontal',
  TbSwitchVertical: 'Switch Vertical',

  // Energy & Power
  TbBattery: 'Battery',
  TbBatteryCharging: 'Charging',
  TbBatteryFilled: 'Full Battery',
  TbBattery1: 'Low Battery',
  TbPlugConnected: 'Connected'
}

// Subset of available icons
const iconOptions = [
  {
    category: 'Devices & Connectivity',
    icons: [
      'TbDeviceDesktop',
      'TbDeviceMobile',
      'TbDeviceTablet',
      'TbDeviceWatch',
      'TbDevices',
      'TbRouter',
      'TbSatellite',
      'TbAntennaBars5',
      'TbWifi',
      'TbBluetooth'
    ]
  },
  {
    category: 'Sensors & Measurements',
    icons: ['TbTemperature', 'TbThermometer', 'TbGauge', 'TbTestPipe2Filled', 'TbDashboard', 'TbBrandSpeedtest']
  },
  { category: 'Home Automation', icons: ['TbBulb', 'TbPlug', 'TbSwitch', 'TbHome', 'TbLock', 'TbKey'] },
  {
    category: 'Networking & Cloud',
    icons: ['TbCloud', 'TbCloudUpload', 'TbCloudDownload', 'TbServer', 'TbDatabase', 'TbNetwork']
  },
  { category: 'Security & Alerts', icons: ['TbShield', 'TbShieldLock', 'TbAlertCircle', 'TbBell', 'TbAlarm'] },
  {
    category: 'Automation & Control',
    icons: ['TbSettings', 'TbAdjustments', 'TbSettingsAutomation', 'TbSwitchHorizontal', 'TbSwitchVertical']
  },
  {
    category: 'Energy & Power',
    icons: ['TbBattery', 'TbBatteryCharging', 'TbBatteryFilled', 'TbBattery1', 'TbPlugConnected']
  }
]

interface IconPickerProps {
  icon: string
  setIcon: (icon: string) => void
  className?: string
}

export const IconPicker = forwardRef<HTMLButtonElement, IconPickerProps>(({ icon, setIcon, className }, ref) => {
  const IconComponent = getCustomizableIcon(icon)

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button ref={ref} variant="outline" className={`flex items-center gap-2 ${className}`}>
            {IconComponent ? <IconComponent /> : 'Select Icon'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <ScrollArea>
            <div className="max-h-60 w-56">
              {iconOptions.map((group) => (
                <div key={group.category}>
                  <DropdownMenuItem disabled className="font-bold text-gray-500">
                    {group.category}
                  </DropdownMenuItem>
                  {group.icons.map((iconName) => {
                    const Icon = getCustomizableIcon(iconName)
                    return (
                      <DropdownMenuItem
                        key={iconName}
                        onClick={() => setIcon(iconName)}
                        className="flex items-center gap-2"
                      >
                        {Icon && <Icon />} {iconNames[iconName] || iconName}
                      </DropdownMenuItem>
                    )
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
})
