import { createContext, useContext, useState, ReactNode } from 'react'

interface DeviceDetailContextType {
  selectedDevice: { uid: string; parameter: string } | null
  setDetailsSelectedDevice: (device: { uid: string; parameter: string } | null) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const DeviceDetailContext = createContext<DeviceDetailContextType | undefined>(undefined)

interface DeviceDetailProviderProps {
  children: ReactNode
}

export const DeviceDetailProvider = ({ children }: DeviceDetailProviderProps) => {
  const [selectedDevice, setDetailsSelectedDevice] = useState<{ uid: string; parameter: string } | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const handleSetDevice = (device: { uid: string; parameter: string } | null) => {
    setDetailsSelectedDevice(device)
    setIsOpen(!!device)
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
