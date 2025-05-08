import { SmallGroupCard } from './components/SmallGroupCard'
import { GroupDetailWithKPIs } from '@/pages/controllers/details/GroupDetailPageController'

interface GroupsViewProps {
  groups: GroupDetailWithKPIs[]
}

export const GroupsView = ({ groups }: GroupsViewProps) => {
  const sortedGroups = groups.sort((a, b) => {
    if (a.kpiStats.notFulfilled !== b.kpiStats.notFulfilled) {
      return b.kpiStats.notFulfilled - a.kpiStats.notFulfilled
    }
    return a.kpiStats.fulfillmentPercentage - b.kpiStats.fulfillmentPercentage
  })

  const filteredGroups = sortedGroups.filter((group) => group.kpiStats.total > 0)

  return (
    <div className="flex flex-wrap gap-2 p-2 py-0">
      {filteredGroups.map((group) => (
        <SmallGroupCard key={group.groupID} group={group} />
      ))}
    </div>
  )
}
