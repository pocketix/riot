import { useQuery } from '@apollo/client'
import { GET_PARAMETERS } from '@/graphql/Queries'
import { SdTypeQuery, SdTypeQueryVariables } from '@/generated/graphql'
import { Outlet } from 'react-router-dom'

export default function ProtectedRoute() {
  // TODO: Change the query to a simple query that checks if the user is authenticated
  const {} = useQuery<SdTypeQuery, SdTypeQueryVariables>(GET_PARAMETERS, {
    variables: {
      sdTypeId: 5
    }
  })

  return <Outlet />
}
