import { useMemo, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@apollo/client'
import { GET_PARAMETERS } from '@/graphql/Queries'
import {
  CreateSdTypeMutation,
  CreateSdTypeMutationVariables,
  DeleteSdTypeMutation,
  DeleteSdTypeMutationVariables,
  SdParameterType,
  SdTypeQuery,
  SdTypeQueryVariables
} from '@/generated/graphql'
import Spinner from '@/ui/Spinner'
import styled from 'styled-components'
import { Button } from '@/components/ui/button'
import { TbCircleCheck, TbEdit, TbPlus, TbTrash, TbX } from 'react-icons/tb'
import { getIcon } from '@/utils/getIcon'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import IconPicker from '@/ui/IconPicker'
import { useForm } from 'react-hook-form'
import { breakpoints } from '@/styles/Breakpoints'
import { CREATE_DEVICE_TYPE, DELETE_DEVICE_TYPE } from '@/graphql/Mutations'
import DeleteConfirmationModal from '@/ui/DeleteConfirmationModal'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

const PageContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  height: max-content;
  margin: 0 auto;
  border-radius: 8px;
  background-color: var(--color-grey-200);
`

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--color-grey-400);
  padding: 1rem;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  box-shadow: 0px 2px 6px var(--color-grey-200);
  min-height: 100px;

  @media (min-width: ${breakpoints.sm}) {
    align-items: center;
    justify-content: space-between;
    flex-direction: row;
    gap: 0;
  }
`

const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const Title = styled.h2`
  font-size: 1.2rem;
  font-weight: 600;

  @media (min-width: ${breakpoints.sm}) {
    font-size: 1.8rem;
  }
`

const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  aspect-ratio: 1/1;
  background: var(--color-grey-200);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.8rem;

  @media (min-width: ${breakpoints.sm}) {
    width: 50px;
    height: 50px;
    font-size: 2rem;
  }
`

const TableItem = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-white);
  padding-left: 1rem;

  @media (min-width: ${breakpoints.sm}) {
    font-size: 1.2rem;
    padding-left: 2rem;
  }
`

const ParametersContainer = styled.div`
  background: var(--color-grey-50);
  padding: 0.5rem;
  margin: 0 1rem 1rem 1rem;
  border-radius: 8px;
  overflow-y: auto;
  max-height: 100vh;
`

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  @media (min-width: ${breakpoints.sm}) {
    flex-direction: row;
    gap: 1rem;
  }
`

const ParamTable = styled.div`
  display: table;
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
`

const ParamHeaderRow = styled.div`
  display: table-row;
  background-color: var(--color-grey-300);
  font-weight: 600;
  font-size: 0.95rem;
`

const ParamRow = styled.div`
  width: 100%;
  display: table-row;
  background-color: var(--color-grey-100);
  &:nth-child(even) {
    background-color: var(--color-grey-50);
  }
`

const ParamCell = styled.div`
  width: 100%;
  display: table-cell;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid var(--color-grey-200);
`

export default function DeviceTypeDetail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const sdTypeId = id ? Number(id) : null
  const location = useLocation()
  const isAddingNew = location.pathname.endsWith('/addNewType')
  const [editMode, setEditMode] = useState(isAddingNew)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [initialValues, setInitialValues] = useState({
    label: '',
    denotation: '',
    icon: '',
    parameters: [] as { denotation: string; type: string; label?: string | null }[]
  })

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: initialValues,
    mode: 'onSubmit'
  })

  const { loading, error } = useQuery<SdTypeQuery, SdTypeQueryVariables>(GET_PARAMETERS, {
    variables: { sdTypeId: sdTypeId! },
    skip: !sdTypeId || isAddingNew,
    onCompleted: (fetchedData) => {
      if (fetchedData?.sdType) {
        const fetchedValues = {
          label: fetchedData.sdType.label || '',
          denotation: fetchedData.sdType.denotation || '',
          icon: fetchedData.sdType.icon || 'TbQuestionMark',
          parameters:
            fetchedData.sdType.parameters.map((param) => ({
              denotation: param.denotation,
              type: param.type,
              label: param.label
            })) || []
        }

        setInitialValues(fetchedValues)
        reset(fetchedValues)
      }
    }
  })

  const [deleteSDTypeMutation] = useMutation<DeleteSdTypeMutation, DeleteSdTypeMutationVariables>(DELETE_DEVICE_TYPE)
  const [createSDTypeMutation] = useMutation<CreateSdTypeMutation, CreateSdTypeMutationVariables>(CREATE_DEVICE_TYPE)

  const IconComponent = useMemo(() => getIcon(watch('icon') || 'TbQuestionMark'), [watch('icon')])

  const onSubmit = async (data: any) => {
    try {
      if (isAddingNew) {
        const response = await createSDTypeMutation({
          variables: {
            input: {
              denotation: data.denotation,
              icon: data.icon,
              label: data.label,
              parameters: data.parameters.map((p: any) => ({
                denotation: p.denotation,
                type: p.type as SdParameterType,
                label: p.label
              }))
            }
          }
        })

        const newId = response?.data?.createSDType?.id
        if (newId) {
          toast.success(t('deviceTypeDetail.createdSuccess'))
          navigate(`/settings/device-types/${newId}`)
        }
      } else {
        // TODO: add update mutation
      }

      setEditMode(false)
    } catch (error) {
      console.error('Submission failed:', error)
      toast.error(t('deviceTypeDetail.createdError'))
    }
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      await deleteSDTypeMutation({
        variables: { id: Number(id) },
        update: (cache) => {
          cache.modify({
            fields: {
              sdTypes(existingSDTypes = [], { readField }) {
                return existingSDTypes.filter((sdTypeRef: any) => readField('id', sdTypeRef) !== Number(id))
              }
            }
          })
        }
      })
      toast.success(t('deviceTypeDetail.deletedSuccess'))
      setIsModalOpen(false)
      navigate('/settings/device-types')
    } catch (error) {
      console.error('Deletion failed:', error)
      toast.error(t('deviceTypeDetail.deletedError'))
    }
  }

  const addParameter = () => {
    setValue('parameters', [{ denotation: '', type: 'NUMBER', label: '' }, ...getValues('parameters')])
  }

  if (loading) return <Spinner />
  if (error) return <p>Error: {error.message}</p>

  return (
    <PageContainer onSubmit={handleSubmit(onSubmit)}>
      <Header>
        <TitleWrapper>
          {editMode ? (
            <div>
              <Label htmlFor="icon">Icon</Label>
              <IconPicker icon={watch('icon')} setIcon={(icon) => setValue('icon', icon, { shouldDirty: true })} />
            </div>
          ) : (
            <IconWrapper>{IconComponent && <IconComponent />}</IconWrapper>
          )}

          {editMode ? (
            <div>
              <Label htmlFor="device-name">{t('deviceTypeDetail.enterName')}</Label>
              <Input
                {...register('label', { required: t('deviceTypeDetail.deviceTypeNameRequired') })}
                placeholder={t('deviceTypeDetail.enterName')}
              />
              {errors.label && <p className="text-sm text-red-500">{errors.label.message}</p>}
            </div>
          ) : (
            <Title>{watch('label')}</Title>
          )}
        </TitleWrapper>

        {editMode ? (
          <ButtonsContainer>
            <Button type="submit" variant="green" disabled={isSubmitting}>
              <TbCircleCheck />{' '}
              {isAddingNew
                ? t('deviceTypeDetail.create')
                : isSubmitting
                  ? t('deviceTypeDetail.saving')
                  : t('deviceTypeDetail.save')}
            </Button>
            <Button
              type="button"
              variant="default"
              disabled={isSubmitting}
              onClick={() => {
                isAddingNew ? navigate(-1) : reset(initialValues)
                setEditMode(false)
              }}
            >
              <TbX /> {t('deviceTypeDetail.cancel')}
            </Button>
            {!isAddingNew && (
              <>
                <Button
                  onClick={(e) => {
                    e.preventDefault()
                    setIsModalOpen(true)
                  }}
                  variant="destructive"
                >
                  <TbTrash /> {t('deviceTypeDetail.deleteType')}
                </Button>
                <DeleteConfirmationModal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  onConfirm={handleDelete}
                  itemName={t('deviceTypeDetail.deleteType')}
                />
              </>
            )}
          </ButtonsContainer>
        ) : (
          <Button
            onClick={(e) => {
              e.preventDefault()
              setEditMode(true)
            }}
            variant="default"
            type="button"
          >
            <TbEdit /> {t('deviceTypeDetail.edit')}
          </Button>
        )}
      </Header>

      <TableItem>
        {editMode ? (
          <div className="flex items-center justify-center gap-2 pr-3">
            <strong>{t('deviceTypeDetail.denotation')}:</strong>
            <div className="w-full">
              <Input
                {...register('denotation', { required: t('deviceTypeDetail.denotationRequired') })}
                placeholder={t('deviceTypeDetail.denotation')}
              />
              {errors.denotation && <p className="text-sm text-red-500">{errors.denotation.message}</p>}
            </div>
          </div>
        ) : (
          <div>
            <strong>{t('deviceTypeDetail.denotation')}:</strong> {watch('denotation') || t('deviceTypeDetail.notSet')}
          </div>
        )}
      </TableItem>

      <TableItem>
        <strong>{t('deviceTypeDetail.parameters')}</strong> ({watch('parameters').length}):
      </TableItem>

      {editMode && (
        <Button
          onClick={(e) => {
            e.preventDefault()
            addParameter()
          }}
          className="mb-4 ml-4 mr-4"
        >
          <TbPlus /> {t('deviceTypeDetail.addParameter')}
        </Button>
      )}

      {watch('parameters').length > 0 && (
        <ParametersContainer>
          <ParamTable>
            <ParamHeaderRow>
              <ParamCell>{t('deviceTypeDetail.denotation')}</ParamCell>
              <ParamCell>{t('deviceTypeDetail.label')}</ParamCell>
              <ParamCell>{t('deviceTypeDetail.type')}</ParamCell>
            </ParamHeaderRow>
            {watch('parameters').map((param, index) =>
              editMode ? (
                <ParamRow key={index}>
                  <ParamCell>
                    <div className="flex flex-col gap-2">
                      <Input
                        {...register(`parameters.${index}.denotation`, {
                          required: t('deviceTypeDetail.denotationRequired')
                        })}
                        placeholder={t('deviceTypeDetail.denotation')}
                      />
                      {errors.parameters?.[index]?.denotation && (
                        <p className="text-sm text-red-500">{errors.parameters[index].denotation.message}</p>
                      )}
                    </div>
                  </ParamCell>
                  <ParamCell>
                    <div className="flex min-w-max flex-col gap-2">
                      <Input {...register(`parameters.${index}.label`)} placeholder="Label" />
                      {errors.parameters?.[index]?.label && (
                        <p className="text-sm text-red-500">{errors.parameters[index].label.message}</p>
                      )}
                    </div>
                  </ParamCell>
                  <ParamCell>
                    <div className="flex items-center gap-2">
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
                    </div>
                  </ParamCell>
                </ParamRow>
              ) : (
                <ParamRow key={index}>
                  <ParamCell>{param.denotation}</ParamCell>
                  <ParamCell>{param.label || '-'}</ParamCell>
                  <ParamCell>{param.type}</ParamCell>
                </ParamRow>
              )
            )}
          </ParamTable>
        </ParametersContainer>
      )}
    </PageContainer>
  )
}
