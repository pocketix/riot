import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GroupDetailWithKPIs } from '@/controllers/details/GroupDetailPageController'
import { RiDashboardLine, RiErrorWarningLine } from 'react-icons/ri'
import { useMemo } from 'react'
import { Separator } from '@/components/ui/separator'
import { GroupDeviceCard } from '@/features/dashboard/components/groups/components/GroupDeviceCard'
import { AddEditGroupDialogController } from './components/AddEditGroupController'
import { Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface GroupDetailPageViewProps {
  groupData: GroupDetailWithKPIs
}

export const GroupDetailPageView = ({ groupData }: GroupDetailPageViewProps) => {
  const navigate = useNavigate()
  const devicesWithFailingKPIs = useMemo(() => {
    return groupData.instances.filter((instance) => instance.kpis.some((kpi) => kpi.fulfilled === false))
  }, [groupData.instances])

  if (!groupData) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto px-6 py-3">
      <div className="mb-2 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold md:text-3xl">{groupData.userIdentifier}</h1>
            <AddEditGroupDialogController
              initial={{
                userIdentifier: groupData.userIdentifier!,
                sdInstanceIDs: groupData.instances.map((instance) => instance.id)!,
                groupID: groupData.groupID!
              }}
              onDelete={() => navigate('/groups')}
            >
              <Settings className="h-5 w-5 cursor-pointer text-muted-foreground transition-colors duration-200 hover:text-primary" />
            </AddEditGroupDialogController>
          </div>
          <div className="flex items-center gap-2">
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              Group ID:
              <code className="break-all rounded-md bg-muted px-2 py-1 text-center text-xs">{groupData.groupID}</code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={groupData.kpiStats.notFulfilled > 0 ? 'destructive' : 'success'}
            className="whitespace-nowrap px-3 py-1"
          >
            {groupData.kpiStats.notFulfilled > 0
              ? `${groupData.kpiStats.notFulfilled} failing KPIs`
              : 'All KPIs fulfilled'}
          </Badge>
          <Badge variant="outline" className="whitespace-nowrap px-3 py-1">
            {groupData.instances.length} {groupData.instances.length === 1 ? 'Device' : 'Devices'}
          </Badge>
        </div>
      </div>

      <Card className="mb-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Group Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Total Devices</span>
              <span className="text-2xl font-semibold">{groupData?.instances?.length}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Devices with Issues</span>
              <span className="text-2xl font-semibold">{devicesWithFailingKPIs?.length}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">KPIs</span>
              <span className="text-2xl font-semibold">
                {groupData.kpiStats.fulfilled} / {groupData.kpiStats.total}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fulfillment Rate</span>
                <span className="text-sm font-semibold">{groupData.kpiStats.fulfillmentPercentage}%</span>
              </div>
              <Progress
                value={groupData.kpiStats.fulfillmentPercentage}
                className="h-2"
                variant={groupData.kpiStats.fulfillmentPercentage === 100 ? 'default' : 'destructive'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="devices">
        <TabsList className="mx-auto flex w-full justify-center md:mx-0 md:w-fit md:max-w-2xl md:justify-start">
          <TabsTrigger
            value="devices"
            className="flex w-full items-center justify-center gap-1 overflow-hidden md:w-auto"
          >
            <RiDashboardLine className="flex-shrink-0" />
            <span className="truncate">{`All (${groupData.instances.length})`}</span>
          </TabsTrigger>
          <TabsTrigger
            value="failing"
            className="flex w-full items-center justify-center gap-1 overflow-hidden md:w-auto"
          >
            <RiErrorWarningLine className="flex-shrink-0" />
            <span className="truncate">{`Failing (${devicesWithFailingKPIs.length})`}</span>
          </TabsTrigger>
        </TabsList>

        <Separator className="my-2" orientation="horizontal" />

        <TabsContent value="devices" className="space-y-2">
          <h2 className="text-xl font-semibold">Devices</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {groupData.instances.map((instance) => (
              <GroupDeviceCard key={instance.id} instance={instance} displayMode="all" />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="failing" className="space-y-2">
          <h2 className="text-xl font-semibold">Devices with Not Fulfilled KPIs ({devicesWithFailingKPIs.length})</h2>
          {devicesWithFailingKPIs.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {devicesWithFailingKPIs.map((instance) => (
                <GroupDeviceCard key={instance.id} instance={instance} displayMode="failing" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <h3 className="mb-1 text-xl font-medium">All KPIs Fulfilled</h3>
              <p className="text-muted-foreground">There are no failing KPIs in this group.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
