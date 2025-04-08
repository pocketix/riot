import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useDeviceDetail } from '@/context/DeviceDetailContext'
import { InstanceWithKPIs } from '@/context/stores/kpiStore'

interface GroupDeviceCardProps {
  instance: InstanceWithKPIs
  displayMode?: 'all' | 'failing'
}

export const GroupDeviceCard = ({ instance, displayMode = 'all' }: GroupDeviceCardProps) => {
  const { setDetailsSelectedDevice } = useDeviceDetail()

  const allKpis = instance.kpis || []
  const failingKPIs = allKpis.filter((kpi) => kpi.fulfilled === false)
  const hasKpis = allKpis.length > 0
  const hasFailingKpis = failingKPIs.length > 0

  const fulfillmentPercentage = hasKpis
    ? Math.round((allKpis.filter((kpi) => kpi.fulfilled === true).length / allKpis.length) * 100)
    : 0

  const kpisToDisplay = displayMode === 'failing' ? failingKPIs : allKpis

  return (
    <Card className={`${hasFailingKpis ? 'border-2 border-destructive/50' : ''} w-full`}>
      <CardHeader className="pb-2">
        <div className="flex w-full flex-wrap items-center justify-between gap-1">
          <CardTitle className="text-lg">
            <Button
              variant="link"
              className="block w-full p-0 text-left text-lg"
              onClick={() => setDetailsSelectedDevice(instance.id, null)}
              title={instance.userIdentifier}
            >
              {instance.userIdentifier}
            </Button>
          </CardTitle>
          {hasKpis && (
            <Badge variant={hasFailingKpis ? 'destructive' : 'success'} className="flex-shrink-0 whitespace-nowrap">
              {hasFailingKpis ? `${failingKPIs.length} failing` : 'All good'}
            </Badge>
          )}
          {!hasKpis && (
            <Badge variant="secondary" className="flex-shrink-0 whitespace-nowrap">
              No KPIs
            </Badge>
          )}
        </div>

        {hasKpis && (
          <>
            <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
              <span>KPI fulfillment</span>
              <span>{fulfillmentPercentage}%</span>
            </div>
            <Progress
              value={fulfillmentPercentage}
              className="h-1.5"
              variant={fulfillmentPercentage === 100 ? 'default' : 'destructive'}
            />
          </>
        )}
      </CardHeader>

      <CardContent className="pt-2">
        {hasKpis && (
          <>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <h4 className="text-sm font-medium">{displayMode === 'failing' ? 'Failing KPIs:' : 'KPIs:'}</h4>
              {kpisToDisplay.map((kpi) => (
                <Badge
                  key={kpi.userIdentifier}
                  variant={
                    displayMode === 'failing'
                      ? 'destructive'
                      : kpi.fulfilled === true
                        ? 'success'
                        : kpi.fulfilled === false
                          ? 'destructive'
                          : 'outline'
                  }
                  className="flex items-center gap-1"
                >
                  <span>{kpi.userIdentifier}</span>
                </Badge>
              ))}
            </div>
          </>
        )}

        {!hasKpis && <p className="text-sm text-muted-foreground">This device has no KPIs configured.</p>}
      </CardContent>
    </Card>
  )
}
