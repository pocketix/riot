import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Power } from 'lucide-react'
import { useMediaQuery } from '@uidotdev/usehooks'
import { useDebouncedCallback } from 'use-debounce'
import { useDeviceDetail } from '@/context/DeviceDetailContext'
import { GoLinkExternal } from 'react-icons/go'

interface SwitchDetailDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  initialValue?: number
  isOn?: boolean
  deviceDetail?: {
    instanceID: number
    parameterID: number
  }
  onPercentualChange?: (value: number) => void
  onStateChange?: (isOn: boolean) => void
}

export function SwitchDetailDialog(props: SwitchDetailDialogProps) {
  const { setDetailsSelectedDevice } = useDeviceDetail()
  const [sliderValue, setSliderValue] = useState(0)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  useEffect(() => {
    setSliderValue(props.isOn ? props.initialValue! : 0)
  }, [props.isOn, props.initialValue])

  const handleSliderChange = useDebouncedCallback((value: number) => {
    if (props.onPercentualChange) props.onPercentualChange(value)
  }, 300)

  const content = (
    <div className="flex flex-col items-center justify-center gap-2 p-2">
      <div className="text-center">
        <div className="text-2xl font-semibold">{sliderValue}%</div>
      </div>
      <div className="flex h-48 w-full items-center justify-center">
        <Slider
          data-vaul-no-drag
          orientation="vertical"
          min={0}
          max={100}
          step={1}
          value={[sliderValue]}
          onValueChange={(value) => {
            const val = value[0]
            setSliderValue(val)
            handleSliderChange(val)
          }}
          className="h-full w-full max-w-[100px]"
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          const newValue = sliderValue === 0 ? (props.initialValue! > 0 ? props.initialValue! : 50) : 0
          setSliderValue(newValue)
          if (props.onStateChange) props.onStateChange(newValue > 0)
        }}
      >
        <Power
          className={`h-6 w-6 ${sliderValue === 0 ? 'text-destructive' : 'text-primary'} transition-colors duration-300 ease-in-out`}
        />
      </Button>
      <Button
        variant="link"
        onClick={() => setDetailsSelectedDevice(props.deviceDetail?.instanceID!, props.deviceDetail?.parameterID!)}
        className={`flex w-full gap-1 whitespace-nowrap ${isDesktop ? 'justify-end' : 'justify-center'}`}
      >
        View history
        <GoLinkExternal className="h-3 w-3 text-xs" />
      </Button>
    </div>
  )

  return isDesktop ? (
    <Dialog open={props.open} onOpenChange={props.setOpen}>
      <DialogContent>
        <DialogTitle className="text-center">Switch Detail</DialogTitle>
        <DialogDescription className="text-center text-sm">
          Adjust the slider to set the switch percentage.
        </DialogDescription>
        {content}
      </DialogContent>
    </Dialog>
  ) : (
    <Drawer open={props.open} onOpenChange={props.setOpen}>
      <DrawerContent>
        <DrawerTitle className="text-center">Switch Detail</DrawerTitle>
        <DrawerDescription className="text-center text-sm">
          Adjust the slider to set the switch percentage.
        </DrawerDescription>
        {content}
      </DrawerContent>
    </Drawer>
  )
}
