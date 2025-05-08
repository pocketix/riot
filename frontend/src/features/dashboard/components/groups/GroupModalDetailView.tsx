import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription
} from '@/components/ui/drawer'
import { RiAlertFill } from 'react-icons/ri'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useDeviceDetail } from '@/context/DeviceDetailContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { GroupDetailWithKPIs } from '@/pages/controllers/details/GroupDetailPageController'
import { InstanceWithKPIs } from '@/context/stores/kpiStore'
import { useNavigate } from 'react-router-dom'
import { GoLinkExternal } from 'react-icons/go'

interface GroupDetailProps {
  group: GroupDetailWithKPIs
  open: boolean
  setOpen: (open: boolean) => void
}

export const GroupModalDetailView = ({ group, open, setOpen }: GroupDetailProps) => {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const failingInstances = group.instances.filter((instance) => instance.kpiStats.notFulfilled > 0)

  return isDesktop ? (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[80vh] gap-1 overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="break-words text-lg sm:text-xl">{group.userIdentifier}</DialogTitle>
          <DialogDescription className="mt-2">
            <GroupDescription
              numberOfDevices={group.instances.length}
              failingInstances={failingInstances}
              fullFilledKPIs={group.kpiStats.fulfilled}
              totalKPIs={group.kpiStats.total}
            />
          </DialogDescription>
        </DialogHeader>
        <Separator className="my-4" />
        <GroupContent failingInstances={failingInstances} groupID={group.groupID} isDesktop={isDesktop} />
      </DialogContent>
    </Dialog>
  ) : (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="break-words text-lg">{group.userIdentifier}</DrawerTitle>
          <DrawerDescription className="mt-2">
            <GroupDescription
              numberOfDevices={group.instances.length}
              failingInstances={failingInstances}
              fullFilledKPIs={group.kpiStats.fulfilled}
              totalKPIs={group.kpiStats.total}
            />
          </DrawerDescription>
        </DrawerHeader>
        <div className="max-h-[80vh] overflow-y-auto px-2">
          <Separator className="my-1" />
          <GroupContent failingInstances={failingInstances} groupID={group.groupID} isDesktop={isDesktop} />
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

// reusable for both drawer and dialog
function GroupDescription({
  numberOfDevices,
  failingInstances,
  fullFilledKPIs,
  totalKPIs
}: {
  numberOfDevices: number
  failingInstances: InstanceWithKPIs[]
  fullFilledKPIs: number
  totalKPIs: number
}) {
  return (
    <div className="flex flex-col">
      <span className="text-sm">
        {numberOfDevices}
        {numberOfDevices > 1 ? ' Devices' : ' Device'}
        {' - '}
        {failingInstances.length} with not fulfilled KPIs
        {' ('}
        {numberOfDevices > 0 ? Math.round((failingInstances.length / numberOfDevices) * 100) : 0}%{')'}
      </span>
      <span className="text-sm">
        {totalKPIs}
        {totalKPIs > 1 ? ' KPIs' : ' KPI'}
        {' - '}
        {fullFilledKPIs} fulfilled
        {' ('}
        {totalKPIs > 0 ? Math.round((fullFilledKPIs / totalKPIs) * 100) : 0}%{')'}
      </span>
    </div>
  )
}

const GroupContent = (props: { failingInstances: InstanceWithKPIs[]; groupID: number; isDesktop: boolean }) => {
  const navigate = useNavigate()
  const { setDetailsSelectedDevice } = useDeviceDetail()

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-lg font-medium">
        <RiAlertFill className="text-destructive" />
        <span>Devices with Not Fulfilled KPIs ({props.failingInstances.length})</span>
      </h3>

      {props.failingInstances.length > 0 ? (
        <div className="grid gap-1 sm:grid-cols-1">
          {props.failingInstances.map((device) => (
            <Card key={device.userIdentifier} className="border border-muted p-1">
              <CardContent className="flex flex-wrap items-center gap-1 p-0 px-1">
                <CardTitle className="flex items-center text-base">
                  <Button variant={'link'} className="p-0" onClick={() => setDetailsSelectedDevice(device.id, null)}>
                    {device.userIdentifier}
                  </Button>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                </CardTitle>
                {device.kpis
                  .filter((kpi) => !kpi.fulfilled)
                  .map((kpi) => (
                    <Badge key={kpi.id} variant="destructive" className="flex items-center gap-1.5">
                      <span>{kpi.userIdentifier}</span>
                    </Badge>
                  ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-muted-foreground">No devices with unfulfilled KPIs</p>
      )}
      <Button
        variant="link"
        onClick={() => navigate(`/group/${props.groupID}`)}
        className={`flex w-full gap-1 whitespace-nowrap ${props.isDesktop ? 'justify-end' : 'justify-center'}`}
      >
        View all details
        <GoLinkExternal className="h-3 w-3 text-xs" />
      </Button>
    </div>
  )
}
