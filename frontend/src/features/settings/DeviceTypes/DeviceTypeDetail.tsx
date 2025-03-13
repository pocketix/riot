import { useMemo, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { GET_PARAMETERS } from '@/graphql/Queries'
import { SdTypeQuery, SdTypeQueryVariables } from '@/generated/graphql'
import Spinner from '@/ui/Spinner'
import styled from 'styled-components'
import { Button } from '@/components/ui/button'
import { TbCircleCheck, TbEdit, TbPlus, TbTrash } from 'react-icons/tb'
import { getIcon } from '@/utils/getIcon'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import IconPicker from '@/ui/IconPicker'
import { useForm } from 'react-hook-form'

const PageContainer = styled.form`
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
  min-height: 100px;
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

export default function DeviceTypeDetail() {
  const { id: sdTypeId } = useParams<{ id: string }>()
  const location = useLocation()
  const isAddingNew = location.pathname.endsWith('/addNewType')
  const [editMode, setEditMode] = useState(isAddingNew)

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitted, isSubmitting }
  } = useForm({
    defaultValues: {
      label: '',
      denotation: '',
      icon: '',
      parameters: [] as { denotation: string; type: string }[]
    },
    mode: 'onSubmit'
  })

  // Fetch data and update form state dynamically
  const { loading, error } = useQuery<SdTypeQuery, SdTypeQueryVariables>(GET_PARAMETERS, {
    variables: { sdTypeId: sdTypeId! },
    skip: !sdTypeId || isAddingNew,
    onCompleted: (fetchedData) => {
      if (fetchedData?.sdType) {
        setValue('label', fetchedData.sdType.label || '')
        setValue('denotation', fetchedData.sdType.denotation || '')
        setValue('icon', fetchedData.sdType.icon || '')
        setValue(
          'parameters',
          fetchedData.sdType.parameters.map((param) => ({
            denotation: param.denotation,
            type: param.type
          })) || []
        )
      }
    }
  })

  const IconComponent = useMemo(() => getIcon(watch('icon') || 'TbQuestionMark'), [watch('icon')])

  const onSubmit = async (data: any) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log('Form Submitted:', data)

      setEditMode(false) // Only after successful submit
    } catch (error) {
      console.error('Submission failed:', error)
    }
  }
  const addParameter = () => {
    setValue('parameters', [{ denotation: '', type: 'NUMBER' }, ...getValues('parameters')])
  }

  if (loading) return <Spinner />
  if (error) return <p>Error: {error.message}</p>

  return (
    <PageContainer onSubmit={handleSubmit(onSubmit)}>
      {/* HEADER */}
      <Header>
        <TitleWrapper>
          {editMode ? (
            <div>
              <Label htmlFor="icon">Icon</Label>
              <IconPicker icon={watch('icon')} setIcon={(icon) => setValue('icon', icon)} />
            </div>
          ) : (
            <IconWrapper>{IconComponent && <IconComponent />}</IconWrapper>
          )}

          {editMode ? (
            <div>
              <Label htmlFor="device-name">Device Type Name</Label>
              <Input {...register('label', { required: 'Device type name is required' })} placeholder="Enter device type name..." />
              {isSubmitted && errors.label && <p className="text-red-500 text-sm">{errors.label.message}</p>}
            </div>
          ) : (
            <Title>{watch('label')}</Title>
          )}
        </TitleWrapper>

        {/* Buttons */}
        {editMode ? (
          <Button type="submit" variant="green" disabled={isSubmitting}>
            <TbCircleCheck /> {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        ) : (
          <Button
            onClick={(e) => {
              e.preventDefault() // Ensure it doesn't trigger form submit
              setEditMode(true)
            }}
            variant="default"
            type="button"
          >
            <TbEdit /> Edit
          </Button>
        )}
      </Header>

      {/* Denotation */}
      <TableItem>
        {editMode ? (
          <div className="flex items-center justify-center gap-2 pr-3">
            <strong>Denotation:</strong>
            <div className="w-full">
              <Input {...register('denotation', { required: 'Denotation is required' })} placeholder="Enter denotation..." />
              {isSubmitted && errors.denotation && <p className="text-red-500 text-sm">{errors.denotation.message}</p>}
            </div>
          </div>
        ) : (
          <div>
            <strong>Denotation:</strong> {watch('denotation') || 'Not set'}
          </div>
        )}
      </TableItem>

      {/* PARAMETERS SECTION */}
      <TableItem>
        <strong>Parameters</strong> ({watch('parameters').length}):
      </TableItem>

      {/* ADD PARAMETER BUTTON */}
      {editMode && (
        <Button
          onClick={(e) => {
            e.preventDefault()
            addParameter()
          }}
          className="ml-4 mr-4"
        >
          <TbPlus /> Add Parameter
        </Button>
      )}

      <ParametersContainer>
        {watch('parameters').map((param, index) => (
          <div key={index} className="flex gap-4 p-1">
            {editMode ? (
              <>
                <div className="w-full flex flex-col gap-2">
                  <Input {...register(`parameters.${index}.denotation`, { required: 'Denotation is required' })} placeholder="Denotation" />
                  {isSubmitted && errors.parameters?.[index]?.denotation && <p className="text-red-500 text-sm">{errors.parameters[index].denotation.message}</p>}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">{param.type}</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {['NUMBER', 'STRING', 'BOOLEAN'].map((option) => (
                      <DropdownMenuItem key={option} onClick={() => setValue(`parameters.${index}.type`, option)}>
                        {option}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="destructive"
                  onClick={(e) => {
                    e.preventDefault()
                    setValue(
                      'parameters',
                      watch('parameters').filter((_, i) => i !== index)
                    )
                  }}
                >
                  <TbTrash />
                </Button>
              </>
            ) : (
              <span>
                {param.denotation} - {param.type}
              </span>
            )}
          </div>
        ))}
      </ParametersContainer>
    </PageContainer>
  )
}
