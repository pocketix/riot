import { SdTypeQuery, SdTypeQueryVariables } from '@/generated/graphql'
import { GET_PARAMETERS } from '@/graphql/Queries'
import Spinner from '@/ui/Spinner'
import { useQuery } from '@apollo/client'
import { useParams } from 'react-router-dom'

export default function DeviceTypeDetail() {
  const { id: sdTypeId } = useParams<{ id: string }>()

  const { data, loading, error } = useQuery<SdTypeQuery, SdTypeQueryVariables>(GET_PARAMETERS, {
    variables: { sdTypeId: sdTypeId! },
    skip: !sdTypeId
  })

  if (loading) return <Spinner />
  if (error) return <p>Error: {error.message}</p>
  if (!data?.sdType) return <p>No data found</p>

  const { denotation, label, icon, parameters } = data.sdType

  return (
    <div>
      <h2>{label}</h2>
      <p>Denotation: {denotation}</p>
      <p>Icon: {icon}</p>
      <h3>Parameters:</h3>
      <ul>
        {parameters.map((param) => (
          <li key={param.id}>
            {param.label} ({param.denotation}) - {param.type}
          </li>
        ))}
      </ul>
    </div>
  )
}
