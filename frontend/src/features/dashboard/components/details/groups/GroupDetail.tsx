import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { KPIGroup } from '../../groups/GroupsController'
import { RiAlertFill } from 'react-icons/ri'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useDeviceDetail } from '@/context/DeviceDetailContext'
import { DeviceWithFailingKPIs } from '../../groups/components/GroupCard'

interface GroupDetailProps {
  failingDevices: DeviceWithFailingKPIs[]
  group: KPIGroup
  fullFilledKPIs: number
  totalKPIs: number
  open: boolean
  setOpen: (open: boolean) => void
}

export const GroupDetail = ({ group, failingDevices, fullFilledKPIs, totalKPIs, open, setOpen }: GroupDetailProps) => {
  const { setDetailsSelectedDevice } = useDeviceDetail()
  const numberOfDevices = group.instances.length

  return (
    <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="break-words text-lg sm:text-xl">{group.userIdentifier}</DialogTitle>
          <DialogDescription className="mt-2 flex flex-col space-y-1">
            <span className="text-sm">
              {numberOfDevices}
              {numberOfDevices > 1 ? ' Devices' : ' Device'}
              {' - '}
              {failingDevices.length} with fulfilled KPIs
              {' ('}
              {numberOfDevices > 0 ? Math.round((failingDevices.length / numberOfDevices) * 100) : 0}%{')'}
            </span>
            <span className="text-sm">
              {totalKPIs}
              {totalKPIs > 1 ? ' KPIs' : ' KPI'}
              {' - '}
              {fullFilledKPIs} fulfilled
              {' ('}
              {totalKPIs > 0 ? Math.round((fullFilledKPIs / totalKPIs) * 100) : 0}%{')'}
            </span>
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-4" />

        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-medium">
            <RiAlertFill className="text-destructive" />
            <span>Devices with Fulfilled KPIs ({failingDevices.length})</span>
          </h3>

          {failingDevices.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-1">
              {failingDevices.map((device) => (
                <Card key={device.instance.id} className="border border-muted p-1">
                  <CardHeader className="p-1">
                    <CardTitle className="text-base">
                      <Button
                        variant={'link'}
                        className="p-1 pb-0"
                        onClick={() => setDetailsSelectedDevice({ uid: device.instance.uid, parameter: '' })}
                      >
                        {device.instance.userIdentifier}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* <h4 className="text-sm text-muted-foreground">Failing KPIs:</h4> */}
                      {device.failingKPIs.map((kpi) => (
                        <Badge key={kpi.id} variant="destructive" className="flex items-center gap-1.5">
                          <span>{kpi.userIdentifier}</span>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-muted-foreground">No devices with fulfilled KPIs</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
