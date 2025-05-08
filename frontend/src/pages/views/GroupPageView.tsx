import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowDownIcon, ArrowUpIcon, SearchIcon, CheckCircleIcon, XCircleIcon, X, PlusIcon, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TbDeviceTablet } from 'react-icons/tb'
import { WholeKPIGroupDetails } from '@/pages/controllers/GroupPageController'
import { useNavigate } from 'react-router-dom'
import { AddEditGroupDialogController } from './components/AddEditGroupController'

interface GroupPageViewProps {
  groups: WholeKPIGroupDetails[]
  isLoading: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortBy: 'kpis' | 'name' | 'size'
  setSortBy: (sort: 'kpis' | 'name' | 'size') => void
  sortDirection: 'asc' | 'desc'
  setSortDirection: (direction: 'asc' | 'desc') => void
}

export const GroupPageView = ({
  groups,
  isLoading,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection
}: GroupPageViewProps) => {
  const [activeTab, setActiveTab] = useState<'all' | 'issues'>('all')
  console.log('groups', groups)

  const displayedGroups = activeTab === 'issues' ? groups.filter((group) => group.kpiStats.notFulfilled > 0) : groups

  return (
    <div className="container mx-auto space-y-3">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={'Search groups...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[--color-grey-200] pl-9 pr-10"
          />
          {searchQuery && (
            <Button
              onClick={() => setSearchQuery('')}
              type="button"
              variant={'link'}
              className="absolute right-1 top-1/2 -translate-y-1/2"
            >
              <X className="h-5 w-5 text-xl text-[--color-white]" />
            </Button>
          )}
        </div>
        <div className="flex justify-center gap-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'kpis' | 'name' | 'size')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kpis">Sort by KPI Issues</SelectItem>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="size">Sort by Device Count</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-between">
        <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'issues')}>
          <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All Groups
              <Badge variant="outline">{groups.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="issues" className="flex items-center gap-2">
              With Issues
              <Badge variant="outline">{groups.filter((g) => g.kpiStats.notFulfilled > 0).length}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="hidden sm:block">
          <AddEditGroupDialogController>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </AddEditGroupDialogController>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-28 w-full" />
            </div>
          ))}
        </div>
      ) : displayedGroups.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayedGroups.map((group) => (
            <GroupCard key={group.groupID} group={group} />
          ))}
          <div className="block w-full sm:hidden">
            <AddEditGroupDialogController>
              <Button className="mx-auto flex">
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            </AddEditGroupDialogController>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <SearchIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No groups found</h3>
          <p className="mt-1 text-muted-foreground">
            {searchQuery
              ? 'Try adjusting your search query'
              : activeTab === 'issues'
                ? 'No groups with issues'
                : 'Create your first device group'}
          </p>
        </div>
      )}
    </div>
  )
}

interface GroupCardProps {
  group: WholeKPIGroupDetails
}

const GroupCard = ({ group }: GroupCardProps) => {
  const hasIssues = group.kpiStats.notFulfilled > 0
  const fulfillmentPercentage = group.kpiStats.fulfillmentPercentage
  const navigate = useNavigate()

  return (
    <Card
      className={`relative h-full overflow-hidden transition-all hover:shadow-md ${
        hasIssues ? 'border-red-500' : 'border-green-500'
      }`}
    >
      <div
        className={`absolute inset-0 right-auto z-0 ${hasIssues ? 'bg-destructive/30' : 'bg-destructive/50'}`}
        style={{ width: `${100 - fulfillmentPercentage}%` }}
      />

      <CardContent className="z-2 relative flex h-full flex-col px-2 pb-1 pt-2">
        <div className="mb-3 flex flex-col items-center justify-between sm:flex-row">
          <Button
            variant="link"
            onClick={() => navigate(`/group/${group.groupID}`)}
            className="truncate p-0 text-lg font-semibold"
          >
            {group.userIdentifier}
          </Button>
          <div className="flex items-center gap-1">
            {hasIssues && (
              <Badge variant="destructive" className="w-fit whitespace-nowrap sm:ml-2">
                {group.kpiStats.notFulfilled} Issue
                {group.kpiStats.notFulfilled !== 1 ? 's' : ''}
              </Badge>
            )}

            <AddEditGroupDialogController
              initial={{
                userIdentifier: group.userIdentifier,
                sdInstanceIDs: group.instances.map((i) => i.id),
                groupID: group.groupID
              }}
            >
              <Button type="button" size="icon" variant="ghost" className="m-0 p-0">
                <Pencil className="h-4 w-4" />
              </Button>
            </AddEditGroupDialogController>
          </div>
        </div>

        <div className="flex flex-col gap-2 px-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Devices:</span>
            <span className="font-medium">{group.instances.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">KPIs:</span>
            <div className="flex items-center gap-1">
              <span className={`${hasIssues ? 'text-red-500' : 'text-green-500'} font-medium`}>
                {group.kpiStats.fulfilled}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{group.kpiStats.total}</span>
              <span className="ml-1 text-muted-foreground">({fulfillmentPercentage}%)</span>
            </div>
          </div>
          <Separator />
          <div className="flex flex-wrap items-center gap-1 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TbDeviceTablet className="h-4 w-4" />
              <span>Devices:</span>
            </div>

            {group.instances.slice(0, 3).map((instance, i) => (
              <div key={i} className="max-w-[150px] truncate rounded-md bg-muted px-2 py-1 text-xs">
                {instance.userIdentifier}
              </div>
            ))}
            {group.instances.length > 3 && (
              <Badge variant="outline" className="whitespace-nowrap rounded-md bg-muted text-xs">
                +{group.instances.length - 3} more
              </Badge>
            )}
            {group.instances.length === 0 && (
              <span className="text-xs italic text-muted-foreground">No devices in group</span>
            )}
          </div>
        </div>

        <div className="mt-auto flex items-end justify-center gap-1 pt-3 text-sm">
          {group.kpiStats.total > 0 && (
            <div className="flex items-center gap-3">
              {group.kpiStats.fulfilled > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">{group.kpiStats.fulfilled} OK</span>
                </div>
              )}
              {group.kpiStats.notFulfilled > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <XCircleIcon className="h-4 w-4 text-red-500" />
                  <span className="text-muted-foreground">{group.kpiStats.notFulfilled} Failed</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
