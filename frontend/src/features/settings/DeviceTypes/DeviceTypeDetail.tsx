import { useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { GET_PARAMETERS } from '@/graphql/Queries'
import { SdTypeQuery, SdTypeQueryVariables } from '@/generated/graphql'
import Spinner from '@/ui/Spinner'
import styled from 'styled-components'
import { Button } from '@/components/ui/button'
import { TbEdit, TbPlus, TbTrash } from 'react-icons/tb'
import { getIcon } from '@/utils/getIcon'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Styled Components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  height: max-content;
  margin: 0 auto;
  border-radius: 8px;
  background-color: var(--color-grey-100);
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-grey-0);
  padding: 1rem;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  box-shadow: 0px 2px 6px var(--color-grey-200);
`

const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const Title = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
`

const IconWrapper = styled.div`
  width: 50px;
  height: 50px;
  aspect-ratio: 1/1;
  background: var(--color-grey-200);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
`

const TableItem = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-white);
  padding-left: 2rem;
`

const ParametersContainer = styled.div`
  background: var(--color-grey-50);
  padding: 0.5rem;
  margin: 0 1rem 1rem 1rem;
  border-radius: 8px;
  overflow-y: auto;
  max-height: 100vh;
`

const ParameterItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem;
  gap: 1rem;
  border-bottom: 1px solid var(--color-grey-300);
`

export default function DeviceTypeDetail() {
  const { id: sdTypeId } = useParams<{ id: string }>()
  const location = useLocation()
  const isAddingNew = location.pathname.endsWith('/addNewType')
  const [editMode, setEditMode] = useState(isAddingNew)

  // Default state for new device type
  const [deviceType, setDeviceType] = useState({
    label: '',
    denotation: '',
    icon: '',
    parameters: [] as { label: string | null; denotation: string; type: string }[]
  })

  const { data, loading, error } = useQuery<SdTypeQuery, SdTypeQueryVariables>(GET_PARAMETERS, {
    variables: { sdTypeId: sdTypeId! },
    skip: !sdTypeId || isAddingNew,
    onCompleted: (fetchedData) => {
      if (fetchedData?.sdType) {
        setDeviceType({
          label: fetchedData.sdType.label || '',
          denotation: fetchedData.sdType.denotation || '',
          icon: fetchedData.sdType.icon || '',
          parameters:
            fetchedData.sdType.parameters.map((param) => ({
              id: param.id,
              label: param.label ?? '',
              denotation: param.denotation,
              type: param.type
            })) || []
        })
      }
    }
  })

  if (loading) return <Spinner />
  if (error) return <p>Error: {error.message}</p>

  const IconComponent = getIcon(deviceType.icon)

  const handleSave = () => {
    if (isAddingNew) {
      console.log('Creating new device type:', deviceType)
    } else {
      console.log('Saving changes:', deviceType)
    }
  }

  return (
    <PageContainer>
      {/* HEADER */}
      <Header>
        <TitleWrapper>
          {editMode ? (
            <div>
              <Label htmlFor="icon">Icon</Label>
              <Input id="icon" type="text" value={deviceType.icon} placeholder="Enter Icon Name" onChange={(e) => setDeviceType({ ...deviceType, icon: e.target.value })} />
            </div>
          ) : (
            <IconWrapper>{IconComponent && <IconComponent />}</IconWrapper>
          )}

          {editMode ? (
            <div>
              <Label htmlFor="device-name">Device Type Name</Label>
              <Input id="device-name" type="text" value={deviceType.label} placeholder="Enter device type name..." onChange={(e) => setDeviceType({ ...deviceType, label: e.target.value })} />
            </div>
          ) : (
            <Title>{deviceType.label}</Title>
          )}
        </TitleWrapper>
        <Button
          onClick={() => {
            setEditMode(!editMode)
            handleSave()
          }}
          variant={editMode ? 'green' : 'default'}
        >
          <TbEdit /> {editMode ? 'Save' : 'Edit'}
        </Button>
      </Header>

      {/* Denotation */}
      <TableItem>
        {editMode ? (
          <div className="flex items-center justify-center gap-2 pr-3">
            <strong>Denotation:</strong>{' '}
            <Input type="text" value={deviceType.denotation} placeholder="Enter denotation..." onChange={(e) => setDeviceType({ ...deviceType, denotation: e.target.value })} />
          </div>
        ) : (
          <div>
            <strong>Denotation:</strong> {deviceType.denotation || 'Not set'}
          </div>
        )}
      </TableItem>

      {/* PARAMETERS SECTION */}
      <TableItem>
        <strong>Parameters</strong> ({deviceType.parameters.length}):
      </TableItem>

      {/* ADD PARAMETER BUTTON */}
      {editMode && (
        <Button
          onClick={() =>
            setDeviceType({
              ...deviceType,
              parameters: [{ label: '', denotation: '', type: 'NUMBER' }, ...deviceType.parameters]
            })
          }
          className="ml-3 mr-3"
        >
          <TbPlus /> Add Parameter
        </Button>
      )}

      <ParametersContainer>
        {deviceType.parameters.map((param, index) => (
          <ParameterItem key={index}>
            {editMode ? (
              <>
                {/* Denotation Input */}
                <Input
                  type="text"
                  placeholder="Denotation"
                  value={param.denotation}
                  onChange={(e) => {
                    const updatedParams = [...deviceType.parameters]
                    updatedParams[index].denotation = e.target.value
                    setDeviceType({ ...deviceType, parameters: updatedParams })
                  }}
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">{param.type}</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {['NUMBER', 'STRING', 'BOOLEAN'].map((option) => (
                      <DropdownMenuItem
                        key={option}
                        onClick={() => {
                          const updatedParams = [...deviceType.parameters]
                          updatedParams[index].type = option
                          setDeviceType({ ...deviceType, parameters: updatedParams })
                        }}
                      >
                        {option}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Delete Button */}
                <Button
                  variant="destructive"
                  onClick={() =>
                    setDeviceType({
                      ...deviceType,
                      parameters: deviceType.parameters.filter((_, i) => i !== index)
                    })
                  }
                >
                  <TbTrash />
                </Button>
              </>
            ) : (
              <span>
                {param.denotation} - {param.type}
              </span>
            )}
          </ParameterItem>
        ))}
      </ParametersContainer>
    </PageContainer>
  )
}
