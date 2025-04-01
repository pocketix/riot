import { GroupCard } from './components/GroupCard'
import { KPIGroup } from './GroupsController'

interface GroupsViewProps {
  groups: KPIGroup[]
}

export const GroupsView = ({ groups }: GroupsViewProps) => {
  // sort the groups based on the number of fullfilled KPIfulfillments
  const sortedGroups = groups.sort((a, b) => {
    const aFulfilled = a.KPIfulfillments.filter((fulfillment) => fulfillment.fulfilled === true).length
    const bFulfilled = b.KPIfulfillments.filter((fulfillment) => fulfillment.fulfilled === true).length
    return bFulfilled - aFulfilled
  })

  console.log('Sorted groups:', sortedGroups)

  // only display groups that have at least one KPI fulfillment
  const filteredGroups = sortedGroups.filter((group) => group.KPIfulfillments.length > 0)

  return (
    <div className="flex flex-wrap gap-2 p-2 py-0">
      {filteredGroups.map((group) => (
        <GroupCard key={group.groupID} group={group} />
      ))}
    </div>
  )
}
