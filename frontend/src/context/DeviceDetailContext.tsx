import { createContext, useContext, useState, ReactNode } from 'react'

interface DeviceDetailContextType {
  selectedDevice: { instanceID: number; parameterID: number | null } | null
  setDetailsSelectedDevice: (deviceId: number, parameterId: number | null) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const DeviceDetailContext = createContext<DeviceDetailContextType | undefined>(undefined)

interface DeviceDetailProviderProps {
  children: ReactNode
}

export const DeviceDetailProvider = ({ children }: DeviceDetailProviderProps) => {
  const [selectedDevice, setDetailsSelectedDevice] = useState<{
    instanceID: number
    parameterID: number | null
  } | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const handleSetDevice = (deviceId: number, parameterId: number | null) => {
    setDetailsSelectedDevice({ instanceID: deviceId, parameterID: parameterId })
    setIsOpen(true)
  }

  const handleSetOpen = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setDetailsSelectedDevice(null)
    }
  }

  return (
    <DeviceDetailContext.Provider
      value={{
        selectedDevice,
        isOpen,
        setDetailsSelectedDevice: handleSetDevice,
        setIsOpen: handleSetOpen
      }}
    >
      {children}
    </DeviceDetailContext.Provider>
  )
}

export const useDeviceDetail = () => {
  const context = useContext(DeviceDetailContext)
  if (context === undefined) {
    throw new Error('useDeviceDetail must be used within a DeviceDetailProvider')
  }
  return context
}
