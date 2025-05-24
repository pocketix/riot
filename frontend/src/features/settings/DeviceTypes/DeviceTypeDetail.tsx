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
  SdTypeQueryVariables,
  UpdateSdTypeMutation,
  UpdateSdTypeMutationVariables
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
import { CREATE_DEVICE_TYPE, DELETE_DEVICE_TYPE, UPDATE_DEVICE_TYPE } from '@/graphql/Mutations'
import DeleteConfirmationModal from '@/ui/DeleteConfirmationModal'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import Heading from '@/ui/Heading'
import * as Tooltip from '@radix-ui/react-tooltip'

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  width: 100%;
`

const PageContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  height: max-content;
  border-radius: 8px;
  background-color: var(--color-grey-200);
  overflow-y: auto;
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
    parameters: [] as { denotation: string; type: string; label?: string | null }[],
    commands: [] as { name: string; payload: string }[]
  })

  // using react-hook-form
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: initialValues,
    mode: 'onSubmit'
  })

  // Fetching the device type data
  const { loading, error } = useQuery<SdTypeQuery, SdTypeQueryVariables>(GET_PARAMETERS, {
    variables: { sdTypeId: sdTypeId! },
    skip: !sdTypeId || isAddingNew,
    onCompleted: (fetchedData) => {
      if (fetchedData?.sdType.commands) {
        const fetchedValues = {
          label: fetchedData.sdType.label || '',
          denotation: fetchedData.sdType.denotation || '',
          icon: fetchedData.sdType.icon || 'TbQuestionMark',
          parameters:
            fetchedData.sdType.parameters.map((param) => ({
              denotation: param.denotation,
              type: param.type,
              label: param.label
            })) || [],
          commands: fetchedData.sdType.commands.map((c) => ({
            ...c,
            payload: c.payload || ''
          }))
        }
        setInitialValues(fetchedValues)
        reset(fetchedValues)
      }
    }
  })

  const [deleteSDTypeMutation] = useMutation<DeleteSdTypeMutation, DeleteSdTypeMutationVariables>(DELETE_DEVICE_TYPE)
  const [createSDTypeMutation] = useMutation<CreateSdTypeMutation, CreateSdTypeMutationVariables>(CREATE_DEVICE_TYPE)
  const [updateSDTypeMutation] = useMutation<UpdateSdTypeMutation, UpdateSdTypeMutationVariables>(UPDATE_DEVICE_TYPE)

  const IconComponent = useMemo(() => getIcon(watch('icon') || 'TbQuestionMark'), [watch('icon')])

  const onSubmit = async (data: any) => {
    // Check for duplicate parameters
    const seen = new Set()
    let hasDuplicate = false

    data.parameters.forEach((param: any, index: number) => {
      const key = `${param.denotation?.trim().toLowerCase()}__${param.type}`

      if (seen.has(key)) {
        hasDuplicate = true
        setError(`parameters.${index}.denotation`, {
          type: 'duplicate',
          message: t('deviceTypeDetail.duplicateParameterError')
        })
      } else {
        seen.add(key)
        clearErrors(`parameters.${index}.denotation`)
      }
    })

    if (hasDuplicate) return

    // Check for commands errors
    let hasPayloadErrors = false
    data.commands.forEach((command: any, cmdIdx: number) => {
      try {
        const parsed = JSON.parse(command.payload)
        if (Array.isArray(parsed)) {
          parsed.forEach((param: any, paramIdx: number) => {
            let possibleValues = param.possibleValues
            let parsingFailed = false

            if (typeof possibleValues === 'string') {
              const trimmed = possibleValues.trim()
              if (trimmed.length > 0) {
                try {
                  possibleValues = JSON.parse(trimmed)
                } catch {
                  parsingFailed = true
                }
              } else {
                possibleValues = undefined
              }
            }
            if (parsingFailed) {
              setError(`root.commands.${cmdIdx}.payloadParams.${paramIdx}.possibleValues`, {
                type: 'manual',
                message: 'Invalid JSON format'
              })
              hasPayloadErrors = true
            } else if (possibleValues !== undefined && !Array.isArray(possibleValues)) {
              setError(`root.commands.${cmdIdx}.payloadParams.${paramIdx}.possibleValues`, {
                type: 'manual',
                message: 'Possible values must be an array'
              })
              hasPayloadErrors = true
            } else if (Array.isArray(possibleValues)) {
              param.possibleValues = possibleValues
            }

            if (!param.name || param.name.trim() === '') {
              setError(`root.commands.${cmdIdx}.payloadParams.${paramIdx}.name`, {
                type: 'manual',
                message: 'Name is required'
              })
              hasPayloadErrors = true
            }
          })
          command.payload = JSON.stringify(parsed)
        }
      } catch {
        setError(`commands.${cmdIdx}.payload`, {
          type: 'manual',
          message: 'Invalid payload JSON'
        })
        hasPayloadErrors = true
      }
    })

    if (hasPayloadErrors) return

    try {
      if (isAddingNew) {
        console.log('Creating new device type with data:', data)
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
              })),
              commands: Array.isArray(data.commands)
                ? data.commands.map((c: any) => ({
                    name: c.name,
                    payload: c.payload
                  }))
                : []
            }
          }
        })

        const newId = response?.data?.createSDType?.id
        if (newId) {
          toast.success(t('deviceTypeDetail.createdSuccess'))
          navigate(`/settings/device-types/${newId}`)
        }
      } else {
        console.log('Updating device type with data:', data)
        await updateSDTypeMutation({
          variables: {
            updateSdTypeId: Number(id),
            input: {
              denotation: data.denotation,
              icon: data.icon,
              label: data.label,
              parameters: data.parameters.map((p: any) => ({
                denotation: p.denotation,
                type: p.type as SdParameterType,
                label: p.label
              })),
              commands: Array.isArray(data.commands)
                ? data.commands.map((c: any) => ({
                    name: c.name,
                    payload: c.payload
                  }))
                : []
            }
          }
        })
        toast.success('Device type updated successfully')
        navigate(`/settings/device-types/${id}`)
      }

      setEditMode(false)
    } catch (error) {
      console.error('Submission failed:', error)
      toast.error(t('deviceTypeDetail.createdError'))
    }
  }

  // Helper functions to get error messages
  function getPayloadParamError(errors: any, cmdIdx: number, paramIdx: number) {
    return (errors.root?.commands?.[cmdIdx]?.payloadParams as any)?.[paramIdx]?.possibleValues
  }
  function getParamNameError(errors: any, cmdIdx: number, paramIdx: number) {
    return (errors.root?.commands?.[cmdIdx]?.payloadParams as any)?.[paramIdx]?.name
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

  const addCommand = () => {
    setValue('commands', [
      {
        name: '',
        payload: JSON.stringify([{ name: '', type: '', possibleValues: [] }])
      },
      ...getValues('commands')
    ])
  }

  if (loading) return <Spinner />
  if (error)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-center text-lg font-semibold">Error: {error.message}</p>
      </div>
    )

  return (
    <PageWrapper>
      <div className="flex w-full max-w-[1300px] flex-col items-center justify-center p-[1.5rem]">
        <div className="mb-4 flex w-full items-center justify-between">
          <Heading>{t('settings')}</Heading>
          <Button variant={'goBack'} onClick={() => navigate('/settings/device-types')}>
            &larr; Go Back
          </Button>
        </div>
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
                <Tooltip.Provider>
                  <Tooltip.Root open={!!errors.label}>
                    <Tooltip.Trigger asChild>
                      <div>
                        <Label htmlFor="device-name">{t('deviceTypeDetail.enterName')}</Label>
                        <Input
                          {...register('label', { required: t('deviceTypeDetail.deviceTypeNameRequired') })}
                          placeholder={t('deviceTypeDetail.enterName')}
                          className={`w-full ${errors.label ? 'border-red-500' : ''}`}
                        />
                      </div>
                    </Tooltip.Trigger>
                    <Tooltip.Content className="max-w-[200px] rounded bg-red-500 p-2 text-xs text-white" side="bottom">
                      {errors.label?.message}
                    </Tooltip.Content>
                  </Tooltip.Root>
                </Tooltip.Provider>
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
                <Tooltip.Provider>
                  <Tooltip.Root open={!!errors.denotation}>
                    <Tooltip.Trigger asChild>
                      <Input
                        {...register('denotation', { required: t('deviceTypeDetail.denotationRequired') })}
                        placeholder={t('deviceTypeDetail.denotation')}
                        className={`w-full ${errors.denotation ? 'border-red-500' : ''}`}
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Content
                      className="max-w-[200px] rounded bg-red-500 p-2 text-xs text-white"
                      side="top"
                      sideOffset={4}
                    >
                      {errors.denotation?.message}
                    </Tooltip.Content>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>
            ) : (
              <div>
                <strong>{t('deviceTypeDetail.denotation')}:</strong>{' '}
                {watch('denotation') || t('deviceTypeDetail.notSet')}
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

          {/* PARAMETERS SECTION */}
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
                        <Tooltip.Provider>
                          <Tooltip.Root open={!!errors.parameters?.[index]?.denotation}>
                            <Tooltip.Trigger asChild>
                              <div className="flex flex-col gap-2">
                                <Input
                                  {...register(`parameters.${index}.denotation`, {
                                    required: t('deviceTypeDetail.denotationRequired')
                                  })}
                                  placeholder={t('deviceTypeDetail.denotation')}
                                  className={`w-full ${errors.parameters?.[index]?.denotation ? 'border-red-500' : ''}`}
                                />
                              </div>
                            </Tooltip.Trigger>
                            <Tooltip.Content
                              className="max-w-[200px] rounded bg-red-500 p-2 text-xs text-white"
                              side="top"
                              sideOffset={4}
                            >
                              {errors.parameters?.[index]?.denotation?.message}
                            </Tooltip.Content>
                          </Tooltip.Root>
                        </Tooltip.Provider>
                      </ParamCell>
                      <ParamCell>
                        <Tooltip.Provider>
                          <Tooltip.Root open={!!errors.parameters?.[index]?.label}>
                            <Tooltip.Trigger asChild>
                              <div className="flex flex-col gap-2">
                                <Input
                                  {...register(`parameters.${index}.label`)}
                                  placeholder="Label"
                                  className={`w-full min-w-max ${errors.parameters?.[index]?.label ? 'border-red-500' : ''}`}
                                />
                              </div>
                            </Tooltip.Trigger>
                            <Tooltip.Content
                              className="max-w-[200px] rounded bg-red-500 p-2 text-xs text-white"
                              side="top"
                              sideOffset={4}
                            >
                              {errors.parameters?.[index]?.label?.message}
                            </Tooltip.Content>
                          </Tooltip.Root>
                        </Tooltip.Provider>
                      </ParamCell>
                      <ParamCell>
                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline">{param.type}</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {['NUMBER', 'STRING', 'BOOLEAN'].map((option) => (
                                <DropdownMenuItem
                                  key={option}
                                  onClick={() => setValue(`parameters.${index}.type`, option)}
                                >
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
                      <ParamCell className="min-w-36">{param.label || '-'}</ParamCell>
                      <ParamCell>{param.type}</ParamCell>
                    </ParamRow>
                  )
                )}
              </ParamTable>
            </ParametersContainer>
          )}

          <TableItem className="pb-4">
            <strong>Commands </strong>({watch('commands').length}):
          </TableItem>

          {editMode && (
            <Button
              onClick={(e) => {
                e.preventDefault()
                addCommand()
              }}
              className="mb-4 ml-4 mr-4"
            >
              <TbPlus /> Add command
            </Button>
          )}

          {/* COMMANDS SECTION */}
          {watch('commands').length > 0 && (
            <ParametersContainer>
              <ParamTable>
                <ParamHeaderRow>
                  <ParamCell>Name</ParamCell>
                  <ParamCell>Payload Parameters</ParamCell>
                  {editMode && <ParamCell />}
                </ParamHeaderRow>
                {watch('commands').map((command, cmdIdx) => {
                  let payloadParams: any[] = []
                  try {
                    try {
                      const parsed = JSON.parse(command.payload)
                      payloadParams = Array.isArray(parsed) ? parsed : []
                    } catch (err) {
                      console.error('Failed to parse command.payload:', err)
                      payloadParams = []
                    }
                  } catch {
                    payloadParams = []
                  }
                  const updatePayload = (params: any[]) => {
                    const newCommands = [...watch('commands')]
                    newCommands[cmdIdx] = {
                      ...newCommands[cmdIdx],
                      payload: JSON.stringify(params)
                    }
                    setValue('commands', newCommands)
                  }
                  const updatePayloadParam = (paramIdx: number, key: string, value: any) => {
                    const next = payloadParams.map((p, i) => {
                      if (i !== paramIdx) return p
                      return { ...p, [key]: value }
                    })
                    updatePayload(next)
                  }
                  const addPayloadParam = () => {
                    updatePayload([...payloadParams, { name: '', type: '', possibleValues: [] }])
                  }
                  const removePayloadParam = (paramIdx: number) => {
                    updatePayload(payloadParams.filter((_, i) => i !== paramIdx))
                  }
                  return editMode ? (
                    <ParamRow key={cmdIdx}>
                      <ParamCell>
                        <div className="mb-2 flex gap-2 text-sm font-semibold text-muted-foreground">
                          <div className="w-28">Command Name</div>
                        </div>
                        <Tooltip.Provider>
                          <Tooltip.Root open={!!errors.commands?.[cmdIdx]?.name}>
                            <Tooltip.Trigger asChild>
                              <Input
                                {...register(`commands.${cmdIdx}.name`, { required: 'The name is required' })}
                                placeholder="switch"
                                className={`min-w-20 ${errors.commands?.[cmdIdx]?.name ? 'border-red-500' : ''}`}
                              />
                            </Tooltip.Trigger>
                            <Tooltip.Content
                              className="max-w-[200px] rounded bg-red-500 p-2 text-xs text-white"
                              side="top"
                              sideOffset={4}
                            >
                              {errors.commands?.[cmdIdx]?.name?.message}
                            </Tooltip.Content>
                          </Tooltip.Root>
                        </Tooltip.Provider>
                      </ParamCell>
                      <ParamCell>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2 text-sm font-semibold text-muted-foreground">
                            <div className="w-28">Param Name</div>
                            <div className="w-28">Type</div>
                            <div className="w-40">Possible Values</div>
                            <div className="flex-1" />
                          </div>
                          {payloadParams.map((param, paramIdx) => (
                            <div key={paramIdx} className="mb-1 flex items-center gap-2">
                              <Tooltip.Provider>
                                <Tooltip.Root open={!!getParamNameError(errors, cmdIdx, paramIdx)}>
                                  <Tooltip.Trigger asChild>
                                    <Input
                                      value={param.name}
                                      onChange={(e) => {
                                        clearErrors(`root.commands.${cmdIdx}.payloadParams.${paramIdx}.name`)
                                        updatePayloadParam(paramIdx, 'name', e.target.value)
                                      }}
                                      placeholder="state"
                                      className={`w-28 ${
                                        getParamNameError(errors, cmdIdx, paramIdx) ? 'border-red-500' : ''
                                      }`}
                                    />
                                  </Tooltip.Trigger>
                                  <Tooltip.Content
                                    className="max-w-[200px] rounded bg-red-500 p-2 text-xs text-white"
                                    side="top"
                                    sideOffset={4}
                                  >
                                    {getParamNameError(errors, cmdIdx, paramIdx)?.message}
                                  </Tooltip.Content>
                                </Tooltip.Root>
                              </Tooltip.Provider>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" className="w-28">
                                    {param.type || 'NUMBER'}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  {['NUMBER', 'STRING', 'BOOLEAN'].map((option) => (
                                    <DropdownMenuItem
                                      key={option}
                                      onClick={() => updatePayloadParam(paramIdx, 'type', option)}
                                    >
                                      {option}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <div className="flex flex-col gap-2">
                                <Tooltip.Provider>
                                  <Tooltip.Root open={!!getPayloadParamError(errors, cmdIdx, paramIdx)}>
                                    <Tooltip.Trigger asChild>
                                      <Input
                                        defaultValue={
                                          Array.isArray(param.possibleValues)
                                            ? isAddingNew
                                              ? param.possibleBalues
                                              : JSON.stringify(param.possibleValues)
                                            : (param.possibleValues ?? '')
                                        }
                                        onBlur={(e) => {
                                          updatePayloadParam(paramIdx, 'possibleValues', e.target.value)
                                        }}
                                        onChange={() => {
                                          clearErrors(
                                            `root.commands.${cmdIdx}.payloadParams.${paramIdx}.possibleValues`
                                          )
                                        }}
                                        placeholder='["ON", "OFF"]'
                                        className={`w-40 ${
                                          getPayloadParamError(errors, cmdIdx, paramIdx) ? 'border-red-500' : ''
                                        }`}
                                      />
                                    </Tooltip.Trigger>
                                    <Tooltip.Content
                                      className="max-w-[200px] rounded bg-red-500 p-2 text-xs text-white"
                                      side="top"
                                      sideOffset={4}
                                    >
                                      {getPayloadParamError(errors, cmdIdx, paramIdx)?.message}
                                    </Tooltip.Content>
                                  </Tooltip.Root>
                                </Tooltip.Provider>
                              </div>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault()
                                  removePayloadParam(paramIdx)
                                }}
                              >
                                <TbTrash /> Remove Param
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              addPayloadParam()
                            }}
                          >
                            <TbPlus /> Add parameter
                          </Button>
                        </div>
                      </ParamCell>
                      <ParamCell>
                        <Button
                          variant="destructive"
                          onClick={(e) => {
                            e.preventDefault()
                            setValue(
                              'commands',
                              watch('commands').filter((_, i) => i !== cmdIdx)
                            )
                          }}
                        >
                          <TbTrash />
                        </Button>
                      </ParamCell>
                    </ParamRow>
                  ) : (
                    <ParamRow key={cmdIdx}>
                      <ParamCell>{command.name}</ParamCell>
                      <ParamCell className="whitespace-pre-wrap break-words">
                        {(() => {
                          try {
                            const arr = JSON.parse(command.payload)
                            if (!Array.isArray(arr)) return null
                            return (
                              <div className="flex flex-col gap-2">
                                <div className="flex gap-4 text-sm font-semibold text-muted-foreground">
                                  <div className="w-32">Name</div>
                                  <div className="w-32">Type</div>
                                  <div className="w-48">Possible Values</div>
                                </div>
                                {arr.map((p, i) => {
                                  let possibleValues = p.possibleValues

                                  if (typeof possibleValues === 'string') {
                                    try {
                                      possibleValues = JSON.parse(possibleValues)
                                    } catch {
                                      possibleValues = []
                                    }
                                  }
                                  return (
                                    <div key={i} className="flex gap-4">
                                      <div className="w-32 font-medium">{p.name}</div>
                                      <div className="w-32 italic text-muted-foreground">{p.type}</div>
                                      <div className="w-48 text-sm text-muted-foreground">
                                        {Array.isArray(possibleValues) && possibleValues.length > 0
                                          ? `[${possibleValues.join(', ')}]`
                                          : '-'}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          } catch {
                            return <span>{command.payload}</span>
                          }
                        })()}
                      </ParamCell>
                    </ParamRow>
                  )
                })}
              </ParamTable>
            </ParametersContainer>
          )}
        </PageContainer>
      </div>
    </PageWrapper>
  )
}
