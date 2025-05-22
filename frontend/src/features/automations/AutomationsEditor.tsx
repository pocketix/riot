import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMutation, useQuery, useApolloClient } from '@apollo/client'
import {
  CREATE_VPL_PROGRAM,
  UPDATE_VPL_PROGRAM,
  DELETE_VPL_PROGRAM,
  UPDATE_VPL_PROCEDURE,
  CREATE_VPL_PROCEDURE,
  DELETE_VPL_PROCEDURE,
  LINK_PROGRAM_TO_PROCEDURE,
  UNLINK_PROGRAM_FROM_PROCEDURE
} from '@/graphql/automations/Mutations'
import {
  GET_VPL_PROGRAMS,
  GET_VPL_PROCEDURES,
  GET_VPL_PROGRAMS_FOR_PROCEDURE,
  GET_VPL_PROCEDURES_FOR_PROGRAM
} from '@/graphql/automations/Queries'
import { GET_INSTANCES, GET_PARAMETERS, GET_SD_TYPES } from '@/graphql/Queries'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface VPLProgram {
  id: string
  name: string
  data: string
  lastRun?: string
  enabled: boolean
}

interface VPLProcedure {
  id: string
  name: string
  data: string
}

interface DeviceFunction {
  type: 'unit' | 'unit_with_args'
  group: string
  label: string
  icon: string
  backgroundColor?: string
  foregroundColor?: string
  arguments?: DeviceFunctionArgument[]
}

interface DeviceFunctionArgument {
  type: 'str_opt' | 'num_opt' | 'boolean' | 'string' | 'number'
  options?: { id: string | number, label: string }[]
}

interface Device {
  deviceName: string
  deviceType: string
  attributes: string[]
  functions: DeviceFunction[]
}

interface SDInstance {
  id: string
  uid: string
  confirmedByUser: boolean
  userIdentifier: string
  type: {
    id: string
    denotation: string
    icon?: string
    label?: string
  }
}

type SDType = {
  id: string
  denotation: string
  label?: string
  icon?: string
  parameters: SDParameter[]
  commands: SDCommand[]
}

interface SDParameter {
  id: string
  denotation: string
  label?: string
  type: 'STRING' | 'NUMBER' | 'BOOLEAN'
}

interface SDCommand {
  id: string
  name: string
  payload: string
  sdTypeId: string
  label?: string
}

declare global {
  interface Window {
    currentEditor?: any
  }
}

export default function AutomationsEditor() {
  const [programName, setProgramName] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingProcedures, setIsUpdatingProcedures] = useState(false)
  const [isRefetchingProcedures, setIsRefetchingProcedures] = useState(false)
  const [loadingProgram, setLoadingProgram] = useState(false)
  const [isLoadingDevices, setIsLoadingDevices] = useState(false)

  const [editorKey, setEditorKey] = useState(0)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [currentProgramData, setCurrentProgramData] = useState<any>(null)
  const [originalProcedures, setOriginalProcedures] = useState<Record<string, any>>({})
  const [, setDevices] = useState<Device[]>([])

  const [procedureLinks, setProcedureLinks] = useState<Map<string, Set<string>>>(new Map())

  const { data: programsData, loading: programsLoading, refetch: refetchPrograms } = useQuery(GET_VPL_PROGRAMS)
  const { data: proceduresData, loading: proceduresLoading, refetch: refetchProcedures } = useQuery(GET_VPL_PROCEDURES)
  const { data: instancesData, loading: instancesLoading } = useQuery(GET_INSTANCES)
  useQuery(GET_SD_TYPES)

  const [createVPLProgram] = useMutation(CREATE_VPL_PROGRAM)
  const [updateVPLProgram] = useMutation(UPDATE_VPL_PROGRAM)
  const [deleteVPLProgram] = useMutation(DELETE_VPL_PROGRAM)
  const [updateVPLProcedure] = useMutation(UPDATE_VPL_PROCEDURE)
  const [createVPLProcedure] = useMutation(CREATE_VPL_PROCEDURE)
  const [deleteVPLProcedure] = useMutation(DELETE_VPL_PROCEDURE)
  const [linkProgramToProcedure] = useMutation(LINK_PROGRAM_TO_PROCEDURE)
  const [unlinkProgramFromProcedure] = useMutation(UNLINK_PROGRAM_FROM_PROCEDURE)

  const apolloClient = useApolloClient()

  /**
   * Parses command payload from JSON string into structured format
   * Used for converting device command data for VPL editor
   */
  const parseCommandPayload = (payload: string): { name: string, type: string, possibleValues: any[] }[] => {
    try {
      if (typeof payload === 'object') {
        return payload;
      }

      return JSON.parse(payload);
    } catch (error) {
      console.error('Error parsing command payload:', error);
      console.error('Raw payload:', payload);
      return [];
    }
  }

  /**
   * Selects appropriate icon for device commands based on name patterns
   * Improves visual recognition of command types in the VPL editor
   */
  const selectIconForCommand = (commandName: string, deviceType: string): string => {
    if (commandName.toLowerCase().includes('relay') ||
        commandName.toLowerCase().includes('switch')) {
      return 'toggleOn'
    }

    if (commandName.toLowerCase().includes('light') ||
        commandName.toLowerCase().includes('led')) {
      return 'lightbulb'
    }

    if (commandName.toLowerCase().includes('temp')) {
      return 'thermometerHalf'
    }

    const deviceTypeIcons: Record<string, string> = {
      'switch': 'toggleOn',
      'sensor': 'cpu',
      'relay': 'lightningChargeFill',
      'light': 'lightbulb',
      'thermostat': 'thermometerHalf',
      'shelly': 'lightningChargeFill'
    }

    for (const key in deviceTypeIcons) {
      if (deviceType.toLowerCase().includes(key)) {
        return deviceTypeIcons[key]
      }
    }

    return 'lightbulb'
  }

  /**
   * Assigns consistent colors to device types for visual categorization
   * Enhances UI by providing visual cues about device functionality
   */
  const selectColorForDeviceType = (deviceType: string): string => {
    const colorMap: Record<string, string> = {
      'switch': '#6366f1',
      'sensor': '#06b6d4',
      'relay': '#f97316',
      'light': '#eab308',
      'thermostat': '#ec4899',
      'shelly': '#f97316'
    }

    for (const key in colorMap) {
      if (deviceType.toLowerCase().includes(key)) {
        return colorMap[key]
      }
    }

    return '#6366f1'
  }

  /**
   * Maps backend parameter types to VPL editor argument types
   * Ensures compatibility between backend data model and VPL editor requirements
   */
  const mapArgumentType = (sourceType: string): string => {
    const typeMap: Record<string, string> = {
      'string': 'str_opt',
      'number': 'num_opt',
      'boolean': 'boolean',
      'text': 'string',
      'STRING': 'str_opt',
      'NUMBER': 'num_opt',
      'BOOLEAN': 'boolean'
    }

    return typeMap[sourceType] || 'str_opt'
  }

  /**
   * Formats values for consistent display in the UI
   * Standardizes label appearance with proper capitalization
   */
  const formatLabel = (value: any): string => {
    if (typeof value === 'string') {
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
    }
    return String(value)
  }


  /**
   * Creates an empty program template with all available procedures
   * Ensures new programs have access to all defined procedures from the start
   */
  const createEmptyProgramWithProcedures = () => {
    const emptyProgram: {
      header: {
        userVariables: Record<string, any>;
        userProcedures: Record<string, any>;
      };
      block: any[];
    } = {
      header: {
        userVariables: {},
        userProcedures: {}
      },
      block: []
    }

    const allProceduresFromDB = proceduresData?.vplProcedures || []

    if (allProceduresFromDB.length > 0) {
      allProceduresFromDB.forEach((procedure: VPLProcedure) => {
        try {
          const procedureData = JSON.parse(procedure.data)
          emptyProgram.header.userProcedures[procedure.name] = procedureData
        } catch (error) {
          console.error(`Error parsing procedure data for "${procedure.name}":`, error)
        }
      })

      setOriginalProcedures({...emptyProgram.header.userProcedures})
    }

    return emptyProgram
  }

  /**
   * Initializes the VPL editor with an empty program containing all procedures
   * Ensures all procedures are available when creating a new program
   */
  const initializeEditorWithProcedures = () => {
    const editor = (window as any).currentEditor

    if (!editor) {
      console.error('Editor not found')
      return
    }

    if (!editor.isReady) {
      console.error('Editor not ready')
      return
    }

    if (currentProgramData) {
      return
    }

    if (proceduresLoading) {
      return
    }

    if (!proceduresData?.vplProcedures) {
      return
    }

    try {
      const emptyProgramWithProcedures = createEmptyProgramWithProcedures()

      if (!emptyProgramWithProcedures.block) {
        emptyProgramWithProcedures.block = []
      }

      if (!Array.isArray(emptyProgramWithProcedures.block)) {
        emptyProgramWithProcedures.block = []
      }

      if (typeof editor.updateProgram === 'function') {
        const programCopy = JSON.parse(JSON.stringify(emptyProgramWithProcedures))
        editor.updateProgram(programCopy)
      } else {
        console.error('No updateProgram function found')
      }
    } catch (error) {
      console.error('Error initializing editor with procedures:', error)
      toast.error(`Error initializing editor: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Converts backend smart device instances to VPL editor device format
   * Transforms device data, commands, and parameters into the structure required by the VPL editor
   */
  const convertToVplDevices = async (): Promise<Device[]> => {
    setIsLoadingDevices(true)

    try {
      if (!instancesData?.sdInstances || instancesData.sdInstances.length === 0) {
        return []
      }

      const confirmedInstances = instancesData.sdInstances.filter(
        (instance: SDInstance) => instance.confirmedByUser
      )

      if (confirmedInstances.length === 0) {
        return []
      }

      const vplDevices: Device[] = []

      for (const instance of confirmedInstances) {
        const typeId = instance.type.id

        const { data: typeData } = await apolloClient.query({
          query: GET_PARAMETERS,
          variables: { sdTypeId: typeId },
          fetchPolicy: 'network-only'
        })

        if (!typeData?.sdType) {
          continue
        }

        const sdType = typeData.sdType

        const attributes = sdType.parameters.map((param: SDParameter) => {
          return param.label || param.denotation;
        })

        const functions: DeviceFunction[] = []

        if (sdType.commands && sdType.commands.length > 0) {
          for (const command of sdType.commands) {
            const parameters = parseCommandPayload(command.payload)

            if (parameters.length > 0) {
              functions.push({
                type: 'unit_with_args',
                group: 'iot',
                label: command.label || command.name,
                icon: selectIconForCommand(command.name, sdType.denotation),
                backgroundColor: selectColorForDeviceType(sdType.denotation),
                foregroundColor: '#ffffff',
                arguments: parameters.map(param => ({
                  type: mapArgumentType(param.type) as 'str_opt' | 'num_opt' | 'boolean' | 'string' | 'number',
                  options: param.possibleValues
                    ? param.possibleValues.map(value => {
                        let cleanValue = value;
                        if (typeof value === 'string') {
                          if ((value.startsWith('"') && value.endsWith('"')) ||
                              (value.startsWith("'") && value.endsWith("'"))) {
                            cleanValue = value.substring(1, value.length - 1);
                          }
                        }
                        return {
                          id: cleanValue,
                          label: formatLabel(cleanValue)
                        };
                      })
                    : undefined
                }))
              })
            } else {
              functions.push({
                type: 'unit',
                group: 'iot',
                label: command.label || command.name,
                icon: selectIconForCommand(command.name, sdType.denotation),
                backgroundColor: selectColorForDeviceType(sdType.denotation),
                foregroundColor: '#ffffff'
              })
            }
          }
        }

        vplDevices.push({
          deviceName: instance.userIdentifier || instance.uid,
          deviceType: sdType.label || sdType.denotation,
          attributes,
          functions
        })
      }

      return vplDevices
    } catch (error) {
      console.error('Error converting SD instances to VPL devices:', error)
      toast.error('Failed to load devices')
      return []
    } finally {
      setIsLoadingDevices(false)
    }
  }

  /**
   * Updates the VPL editor with the latest device information
   * Refreshes the editor's device list with current data from the backend
   */
  const updateEditorDevices = async () => {
    const editor = (window as any).currentEditor
    if (!editor || !editor.isReady) {
      return
    }

    try {
      const vplDevices = await convertToVplDevices()
      setDevices(vplDevices)

      // Update the editor with the devices
      if (typeof editor.updateDevices === 'function') {
        editor.updateDevices(vplDevices)
      } else {
        console.error('No updateDevices function found on editor')
      }
    } catch (error) {
      console.error('Error updating editor devices:', error)
    }
  }

  /**
   * Sets up the global editor reference and handles cleanup
   * Makes the editor instance accessible to other components via window object
   */
  useEffect(() => {
    if (!(window as any).currentEditor) {
      Object.defineProperty(window, 'currentEditor', {
        value: null,
        writable: true,
        configurable: true
      })
    }

    return () => {
      (window as any).currentEditor = null
    }
  }, [])

  /**
   * Initializes procedure-program relationships when procedures are loaded
   * Builds a map of which procedures are used in which programs
   */
  useEffect(() => {
    if (!proceduresLoading && proceduresData?.vplProcedures) {
      if (!apolloClient) {
        console.error('Apollo Client is not available, cannot initialize procedure links')
        return
      }

      initializeProcedureLinks()
    }
  }, [proceduresLoading, proceduresData, apolloClient])

  /**
   * Builds a map of procedure-program relationships
   * Fetches and tracks which programs use each procedure for dependency management
   */
  const initializeProcedureLinks = async () => {
    if (!apolloClient) {
      console.error('Apollo Client is not available, cannot initialize procedure links')
      return
    }

    const procedures = proceduresData?.vplProcedures || []
    const newProcedureLinks = new Map<string, Set<string>>()


    for (const procedure of procedures) {
      try {
        const { data } = await getProgramsForProcedure(procedure.id)
        const programs = data?.vplProgramsForProcedure || []

        const programIds = new Set<string>()
        programs.forEach((program: VPLProgram) => programIds.add(program.id))
        newProcedureLinks.set(procedure.id, programIds)
      } catch (error) {
        console.error(`Error fetching programs for procedure ${procedure.id}:`, error)
      }
    }


    setProcedureLinks(newProcedureLinks)
  }

  /**
   * Checks if a procedure is used in any program
   * Used to warn users about potential impacts when modifying procedures
   */
  const isProcedureUsedInPrograms = (procedureId: string): boolean => {
    const programIds = procedureLinks.get(procedureId)
    return programIds !== undefined && programIds.size > 0
  }

  /**
   * Gets names of all programs that use a specific procedure
   * Used for displaying warnings when modifying or deleting procedures
   */
  const getProgramsUsingProcedure = (procedureId: string): string[] => {
    const programIds = procedureLinks.get(procedureId)
    if (!programIds) return []


    return Array.from(programIds).map(programId => {
      const program = programsData?.vplPrograms?.find((p: VPLProgram) => p.id === programId)
      return program ? program.name : `Unknown Program (ID: ${programId})`
    })
  }

  /**
   * Fetches all programs that use a specific procedure from the backend
   * Used to build the procedure-program relationship map
   */
  const getProgramsForProcedure = (procedureId: string) => {
    return new Promise<any>((resolve, reject) => {
      if (!apolloClient) {
        console.error('Apollo Client is not available');
        reject(new Error('Apollo Client is not available'));
        return;
      }

      apolloClient.query({
        query: GET_VPL_PROGRAMS_FOR_PROCEDURE,
        variables: { procedureId },
        fetchPolicy: 'network-only'
      })
      .then(resolve)
      .catch(reject)
    })
  }

  /**
   * Fetches all procedures used by a specific program from the backend
   * Used when updating procedure-program links during save operations
   */
  const getProceduresForProgram = (programId: string) => {
    return new Promise<any>((resolve, reject) => {
      if (!apolloClient) {
        console.error('Apollo Client is not available');
        reject(new Error('Apollo Client is not available'));
        return;
      }

      apolloClient.query({
        query: GET_VPL_PROCEDURES_FOR_PROGRAM,
        variables: { programId },
        fetchPolicy: 'network-only'
      })
      .then(resolve)
      .catch(reject)
    })
  }

  /**
   * Initializes editor with procedures when all dependencies are ready
   * Ensures editor has all procedures available when creating a new program
   */
  useEffect(() => {
    if (isEditorReady && !proceduresLoading && proceduresData?.vplProcedures && !currentProgramData) {
      initializeEditorWithProcedures()
    }
  }, [isEditorReady, proceduresLoading, proceduresData, currentProgramData])

  /**
   * Updates editor with device information when available
   * Ensures VPL editor has access to all confirmed devices
   */
  useEffect(() => {
    if (isEditorReady && !instancesLoading && instancesData?.sdInstances) {
      updateEditorDevices()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditorReady, instancesLoading, instancesData])

  /**
   * Checks if a program with the given name already exists
   * Used for validation during program creation and updates
   */
  const checkProgramExists = (name: string): VPLProgram | undefined => {
    if (!programsData?.vplPrograms) return undefined

    return programsData.vplPrograms.find(
      (program: VPLProgram) => program.name.toLowerCase() === name.toLowerCase()
    )
  }

  /**
   * Processes procedures when saving a program
   * Handles creating, updating, and deleting procedures, with dependency tracking
   * Warns users about potential impacts when procedures are modified or deleted
   */
  const proceduresParsingForSave = async (program: any) => {
    if (!program.header || !program.header.userProcedures) {
      return
    }

    const userProcedures = typeof program.header.userProcedures === 'string'
      ? JSON.parse(program.header.userProcedures)
      : program.header.userProcedures

    const allProceduresFromDB = proceduresData?.vplProcedures || []

    const usedProcedureIds: string[] = []
    let currentProgramId: string | null = null
    if (selectedProgram) {
      const selectedProgramData = programsData?.vplPrograms?.find(
        (p: VPLProgram) => p.name === selectedProgram
      )
      if (selectedProgramData) {
        currentProgramId = selectedProgramData.id
      }
    }

    for (const procedureName in userProcedures) {
      const procedureData = userProcedures[procedureName]

      const existingProcedure = allProceduresFromDB.find(
        (procedure: VPLProcedure) => procedure.name === procedureName
      )

      if (existingProcedure) {
        usedProcedureIds.push(existingProcedure.id)

        const procedureDataString = JSON.stringify(procedureData)
        let hasChanged = false;
        try {
          const existingData = JSON.parse(existingProcedure.data);
          const newData = procedureData;

          const normalizedExisting = JSON.stringify(existingData, Object.keys(existingData).sort());
          const normalizedNew = JSON.stringify(newData, Object.keys(newData).sort());
          hasChanged = normalizedExisting !== normalizedNew;
        } catch (error) {
          console.error(`Error comparing procedure data for "${procedureName}":`, error);

          hasChanged = true;
        }

        if (hasChanged) {
          try {
            const affectedProgramNames = getProgramsUsingProcedure(existingProcedure.id)
            const isUsedInPrograms = isProcedureUsedInPrograms(existingProcedure.id)
            updateVPLProcedure({
              variables: {
                id: existingProcedure.id,
                input: {
                  name: procedureName,
                  data: procedureDataString
                }
              }
            })
            .then(() => {
              if (isUsedInPrograms) {
                const programNames = affectedProgramNames.join('\n')
                toast.warning(
                  <div>
                    <p>⚠️ IMPORTANT: Procedure "{procedureName}" updated. It might affect the following programs:</p>
                    <pre style={{ maxHeight: '150px', overflow: 'auto', marginTop: '8px', padding: '8px', background: '#f0f0f0', borderRadius: '4px' }}>
                      {programNames}
                    </pre>
                  </div>,
                  { duration: 8000 }
                )
              } else {
                toast.success(`Procedure "${procedureName}" updated successfully`)
              }

              refetchProcedures()
              initializeProcedureLinks()
            })
            .catch(error => {
              console.error('Error updating procedure:', error)
              toast.error(`Failed to update procedure "${procedureName}": ${error.message || 'Unknown error'}`)
            })
          } catch (error) {
            console.error('Error fetching programs for procedure:', error)

            updateVPLProcedure({
              variables: {
                id: existingProcedure.id,
                input: {
                  name: procedureName,
                  data: procedureDataString
                }
              }
            })
            .then(() => {
              toast.warning(`⚠️ IMPORTANT: Procedure "${procedureName}" updated. It might break other programs if implementation logic was changed.`, {
                duration: 5000
              })
              refetchProcedures()
              initializeProcedureLinks()
            })
            .catch(error => {
              console.error('Error updating procedure:', error)
              toast.error(`Failed to update procedure "${procedureName}": ${error.message || 'Unknown error'}`)
            })
          }
        }
      } else {
        const procedureDataString = JSON.stringify(procedureData)
        createVPLProcedure({
          variables: {
            input: {
              name: procedureName,
              data: procedureDataString
            }
          }
        })
        .then((result) => {
          const newProcedure = result.data.createVPLProcedure

          usedProcedureIds.push(newProcedure.id)
          if (currentProgramId) {
            linkProgramToProcedure({
              variables: {
                programId: currentProgramId,
                procedureId: newProcedure.id
              }
            })
            .catch(error => {
              console.error('Error linking procedure to program:', error)
            })
          }

          toast.success(`New procedure "${procedureName}" created`, {
          })
          refetchProcedures()
          initializeProcedureLinks()
        })
        .catch(error => {
          console.error('Error creating procedure:', error)
          toast.error(`Failed to create procedure "${procedureName}": ${error.message || 'Unknown error'}`)
        })
      }
    }

    for (const originalProcedureName in originalProcedures) {
      if (!program.header.userProcedures[originalProcedureName]) {
        console.log(`Procedure "${originalProcedureName}" was deleted`)

        const deletedProcedure = allProceduresFromDB.find(
          (procedure: VPLProcedure) => procedure.name === originalProcedureName
        )

        if (deletedProcedure) {
          try {
            const affectedProgramNames = getProgramsUsingProcedure(deletedProcedure.id)
            const isUsedInPrograms = isProcedureUsedInPrograms(deletedProcedure.id)
            deleteVPLProcedure({
              variables: {
                id: deletedProcedure.id
              }
            })
            .then(() => {
              if (isUsedInPrograms) {
                const programNames = affectedProgramNames.join('\n')
                toast.warning(
                  <div>
                    <p>⚠️ IMPORTANT: Procedure "{originalProcedureName}" was deleted. It might affect the following programs:</p>
                    <pre style={{ maxHeight: '150px', overflow: 'auto', marginTop: '8px', padding: '8px', background: '#f0f0f0', borderRadius: '4px' }}>
                      {programNames}
                    </pre>
                  </div>,
                  { duration: 8000 }
                )
              } else {
                toast.success(`Procedure "${originalProcedureName}" deleted successfully`)
              }

              refetchProcedures()
              initializeProcedureLinks()
            })
            .catch(error => {
              console.error('Error deleting procedure:', error)
              toast.error(`Failed to delete procedure "${originalProcedureName}": ${error.message || 'Unknown error'}`)
            })
          } catch (error) {
            console.error('Error fetching programs for procedure:', error)

            deleteVPLProcedure({
              variables: {
                id: deletedProcedure.id
              }
            })
            .then(() => {
              toast.warning(`⚠️ IMPORTANT: Procedure "${originalProcedureName}" was deleted from the database. If it was used in other programs, this might cause issues.`, {
                duration: 8000 // 8 seconds
              })
              refetchProcedures()
              initializeProcedureLinks()
            })
            .catch(error => {
              console.error('Error deleting procedure:', error)
              toast.error(`Failed to delete procedure "${originalProcedureName}": ${error.message || 'Unknown error'}`)
            })
          }
        }
      }
    }

    if (currentProgramId) {
      try {
        const { data } = await getProceduresForProgram(currentProgramId)
        const currentProcedures = data?.vplProceduresForProgram || []
        const currentProcedureIds = currentProcedures.map((p: VPLProcedure) => p.id)

        const proceduresToLink = usedProcedureIds.filter((id: string) => !currentProcedureIds.includes(id))

        const proceduresToUnlink = currentProcedureIds.filter((id: string) => !usedProcedureIds.includes(id))
        for (const procedureId of proceduresToLink) {
          linkProgramToProcedure({
            variables: {
              programId: currentProgramId,
              procedureId
            }
          })
          .catch(error => {
            console.error(`Error linking procedure ${procedureId} to program ${currentProgramId}:`, error)
          })
        }


        for (const procedureId of proceduresToUnlink) {
          unlinkProgramFromProcedure({
            variables: {
              programId: currentProgramId,
              procedureId
            }
          })
          .catch(error => {
            console.error(`Error unlinking procedure ${procedureId} from program ${currentProgramId}:`, error)
          })
        }
      } catch (error) {
        console.error(`Error getting procedures for program ${currentProgramId}:`, error)
      }
    }


    setOriginalProcedures({...program.header.userProcedures})
  }


  /**
   * Saves a program with the given name
   * Handles both creating new programs and updating existing ones
   * Processes procedures and maintains procedure-program relationships
   */
  const saveProgram = async (name: string, overwriteId?: string) => {
    const editor = (window as any).currentEditor
    if (!editor) {
      toast.error('Editor not initialized')
      return
    }

    // Make sure the editor is fully initialized
    if (!editor.isReady) {
      toast.error('Editor is not fully initialized yet. Please try again in a moment.')
      return
    }

    // Get the program from the editor
    let program = editor.program
    if (!program) {
      toast.error('No program data available')
      return
    }


    setIsSaving(true)

    try {
      if (!program.block || !Array.isArray(program.block)) {
        toast.error('Invalid program structure: missing block array')
        setIsSaving(false)
        return
      }

      const programCopy = JSON.parse(JSON.stringify(program))
      await proceduresParsingForSave(programCopy)


      if (overwriteId) {
        updateVPLProgram({
          variables: {
            id: overwriteId,
            name: name,
            data: JSON.stringify(programCopy)
          }
        })
        .then(() => {
          toast.success(`Program "${name}" updated successfully`)
          setProgramName('')
          refetchPrograms()
          initializeProcedureLinks()
        })
        .catch(error => {
          console.error('Update operation error:', error)
          const errorMessage = error.message || 'Unknown error'
          toast.error(`Failed to update program: ${errorMessage}`)
          if (error.graphQLErrors) {
            console.error('GraphQL errors:', error.graphQLErrors)
          }
          if (error.networkError) {
            console.error('Network error:', error.networkError)
          }
        })
        .finally(() => {
          setIsSaving(false)
        })
      } else {
        createVPLProgram({
          variables: {
            name: name,
            data: JSON.stringify(programCopy)
          }
        })
        .then((result) => {
          const savedProgram = result.data.createVPLProgram
          toast.success(`Program "${savedProgram.name}" saved successfully`)
          setProgramName('')

          const usedProcedureIds: string[] = []
          if (programCopy.header && programCopy.header.userProcedures) {
            for (const procedureName in programCopy.header.userProcedures) {
              const procedure = proceduresData?.vplProcedures?.find(
                (p: VPLProcedure) => p.name === procedureName
              )
              if (procedure) {
                usedProcedureIds.push(procedure.id)
              }
            }


            for (const procedureId of usedProcedureIds) {
              linkProgramToProcedure({
                variables: {
                  programId: savedProgram.id,
                  procedureId
                }
              })
              .then(() => {
                console.log(`Linked procedure ${procedureId} to new program ${savedProgram.id}`)
              })
              .catch(error => {
                console.error(`Error linking procedure ${procedureId} to new program ${savedProgram.id}:`, error)
              })
            }
          }

          refetchPrograms()
          // Refresh the procedure links
          initializeProcedureLinks()
        })
        .catch(error => {
          console.error('Save operation error:', error)
          // Provide more detailed error message
          const errorMessage = error.message || 'Unknown error'
          toast.error(`Failed to save program: ${errorMessage}`)

          // Log additional details if available
          if (error.graphQLErrors) {
            console.error('GraphQL errors:', error.graphQLErrors)
          }
          if (error.networkError) {
            console.error('Network error:', error.networkError)
          }
        })
        .finally(() => {
          setIsSaving(false)
        })
      }
    } catch (error) {
      console.error('Error processing program data:', error)
      toast.error(`Error processing program data: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsSaving(false)
    }
  }

  /**
   * Saves the current program with validation and duplicate handling
   * Prompts for confirmation when overwriting an existing program
   */
  const handleSaveProgram = async () => {
    if (!programName.trim()) {
      toast.error('Please enter a program name')
      return
    }

    // Check if a program with this name already exists
    const existingProgram = checkProgramExists(programName)

    if (existingProgram) {
      // Program with the same name exists, ask user if they want to overwrite
      if (confirm(`A program named "${programName}" already exists.\n\n` +
                  `• Click OK to overwrite the existing program\n` +
                  `• Click Cancel to cancel the save operation`)) {
        // User chose to overwrite
        await saveProgram(programName, existingProgram.id)
      } else {
        // User chose to cancel
        toast.info('Save operation cancelled. Please rename your program if you want to save it as a new program.')
      }
    } else {
      // No duplicate, proceed with normal save
      await saveProgram(programName)
    }
  }

  /**
   * Loads all available procedures into a program when loading from database
   * Ensures program has access to all procedures, not just those it currently uses
   */
  const proceduresParsingForLoad = (program: any) => {
    if (!program.header) {
      program.header = {}
    }

    if (program.header.userVariables === undefined) {
      program.header.userVariables = {}
    }
    if (!program.header.userProcedures) {
      program.header.userProcedures = {}
    }

    const allProceduresFromDB = proceduresData?.vplProcedures || []

    program.header.userProcedures = {}
    if (allProceduresFromDB.length > 0) {
      allProceduresFromDB.forEach((procedure: VPLProcedure) => {
        try {
          const procedureData = JSON.parse(procedure.data)

          if (typeof procedureData !== 'object' || procedureData === null) {
            console.error(`Invalid procedure data for "${procedure.name}": not an object`)
            return
          }
          program.header.userProcedures[procedure.name] = procedureData
        } catch (error) {
          console.error(`Error parsing procedure data for "${procedure.name}":`, error)
        }
      })
    }

    const { userVariables, userProcedures } = program.header
    program.header = { userVariables, userProcedures }

    if (!program.header.userProcedures) {
      program.header.userProcedures = {}
    }
    setOriginalProcedures({...program.header.userProcedures})
  }

  /**
   * Loads a selected program from the database into the editor
   * Fetches program data, loads all procedures, and updates the editor
   */
  const handleLoadProgram = () => {
    if (!selectedProgram) {
      toast.error('Please select a program to load')
      return
    }

    setLoadingProgram(true)


    setIsRefetchingProcedures(true)
    refetchProcedures()
      .then(() => {


        const selectedProgramData = programsData?.vplPrograms?.find(
          (program: VPLProgram) => program.name === selectedProgram
        )

        if (!selectedProgramData) {
          toast.error(`Program "${selectedProgram}" not found`)
          setLoadingProgram(false)
          return
        }

        try {
          const programData = JSON.parse(selectedProgramData.data)


          setProgramName(selectedProgramData.name)


          proceduresParsingForLoad(programData)


          setCurrentProgramData(programData)


          const editor = (window as any).currentEditor
          if (editor && editor.isReady) {
            console.log('Directly updating editor with loaded program:', programData)
            try {
              if (!programData.block) {
                programData.block = []
              }

              if (!Array.isArray(programData.block)) {
                programData.block = []
              }

              if (typeof editor.updateProgram === 'function') {

                const programCopy = JSON.parse(JSON.stringify(programData))
                editor.updateProgram(programCopy)

              } else {
                console.error('No updateProgram function found on editor')

                setEditorKey(prevKey => prevKey + 1)
              }
            } catch (error) {
              console.error('Error updating editor with loaded program:', error)
              toast.error(`Error loading program: ${error instanceof Error ? error.message : 'Unknown error'}`)

              setEditorKey(prevKey => prevKey + 1)
            }
          } else {
            console.log('Editor not ready, using key re-render method')
            setEditorKey(prevKey => prevKey + 1)
          }

          toast.success(`Program "${selectedProgramData.name}" loaded successfully`)


          if (!instancesLoading && instancesData?.sdInstances) {
            updateEditorDevices()
          }
        } catch (error) {
          console.error('Error parsing program data:', error)
          toast.error('Failed to parse program data')
        } finally {
          setLoadingProgram(false)
          setIsRefetchingProcedures(false)
        }
      })
      .catch(error => {
        console.error('Error refreshing procedures:', error)
        toast.error('Failed to refresh procedures before loading program')
        setLoadingProgram(false)
        setIsRefetchingProcedures(false)
      })
  }

  /**
   * Updates an existing program with current editor content
   * Saves procedures and updates the program in the database
   */
  const handleUpdateProgram = async () => {
    if (!selectedProgram) {
      toast.error('Please select a program to update')
      return
    }

    if (!programName.trim()) {
      toast.error('Please enter a program name')
      return
    }

    // Access the editor through the window object
    const editor = (window as any).currentEditor
    if (editor) {
      // Get the program from the editor
      // For custom lit elements, we need to access properties directly
      const program = editor.program

      if (!program) {
        toast.error('No program data available')
        return
      }


      const selectedProgramData = programsData?.vplPrograms?.find(
        (program: VPLProgram) => program.name === selectedProgram
      )

      if (!selectedProgramData) {
        toast.error(`Program "${selectedProgram}" not found`)
        return
      }

      setIsUpdating(true)

      try {
        const programCopy = JSON.parse(JSON.stringify(program))
        await proceduresParsingForSave(programCopy)

        updateVPLProgram({
          variables: {
            id: selectedProgramData.id,
            name: programName,
            data: JSON.stringify(programCopy)
          }
        })
        .then(() => {
          toast.success(`Program updated successfully from "${selectedProgram}" to "${programName}"`)
          setSelectedProgram(programName)

          refetchPrograms()
          initializeProcedureLinks()
        })
        .catch(error => {
          console.error('Update operation error:', error)
          toast.error(`Failed to update program: ${error.message}`)
        })
        .finally(() => {
          setIsUpdating(false)
        })
      } catch (error) {
        console.error('Error processing program data:', error)
        toast.error(`Error processing program data: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setIsUpdating(false)
      }
    } else {
      toast.error('Editor not initialized')
    }
  }

  /**
   * Deletes the selected program from the database
   * Confirms with user before deletion and resets editor state after deletion
   */
  const handleDeleteProgram = () => {
    if (!selectedProgram) {
      toast.error('Please select a program to delete')
      return
    }

    if (confirm(`Are you sure you want to delete the program "${selectedProgram}"?`)) {
      setIsDeleting(true)


      const selectedProgramData = programsData?.vplPrograms?.find(
        (program: VPLProgram) => program.name === selectedProgram
      )

      if (!selectedProgramData) {
        toast.error(`Program "${selectedProgram}" not found`)
        setIsDeleting(false)
        return
      }


      deleteVPLProgram({
        variables: {
          id: selectedProgramData.id
        }
      })
      .then(() => {
        toast.success(`Program "${selectedProgram}" deleted successfully`)
        setProgramName('')
        setSelectedProgram('')

        setCurrentProgramData(null)

        setEditorKey(prevKey => prevKey + 1)
        refetchPrograms()
      })
      .catch(error => {
        console.error('Delete operation error:', error)
        toast.error(`Failed to delete program: ${error.message}`)
      })
      .finally(() => {
        setIsDeleting(false)
      })
    }
  }


  /**
   * Updates procedures from the current program without saving the program itself
   * Allows updating procedure definitions that might be used by multiple programs
   */
  const handleUpdateProcedures = async () => {

    const editor = (window as any).currentEditor
    if (!editor) {
      toast.error('Editor not initialized')
      return
    }


    if (!editor.isReady) {
      toast.error('Editor is not fully initialized yet. Please try again in a moment.')
      return
    }


    let program = editor.program
    if (!program) {
      toast.error('No program data available')
      return
    }


    if (!program.header || !program.header.userProcedures) {
      toast.info('No procedures to update')
      return
    }


    setIsUpdatingProcedures(true)


    toast.info('Updating procedures...')

    try {
      const programCopy = JSON.parse(JSON.stringify(program))
      await proceduresParsingForSave(programCopy)
      toast.success('Procedures updated successfully')


      initializeProcedureLinks()
    } catch (error) {
      console.error('Error updating procedures:', error)
      toast.error(`Failed to update procedures: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {

      setIsUpdatingProcedures(false)
    }
  }



  return (
    <div className="flex flex-col gap-4 min-w-[564px]">
      <div className="flex flex-col gap-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="program-select" className="mb-2 block">Select Program</Label>
            <Select
              value={selectedProgram}
              onValueChange={setSelectedProgram}
            >
              <SelectTrigger id="program-select">
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                {programsData?.vplPrograms?.map((program: VPLProgram) => (
                  <SelectItem key={program.id} value={program.name}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="program-name" className="mb-2 block">Program Name</Label>
            <Input
              id="program-name"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="Enter program name"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-2">
        <div className="flex gap-2">
          <Button
            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
            onClick={handleLoadProgram}
            disabled={loadingProgram || !selectedProgram}
          >
            {loadingProgram ? 'Loading...' : 'Load'}
          </Button>
          <Button
            className="bg-blue-500 text-white hover:bg-blue-600"
            onClick={handleUpdateProgram}
            disabled={isUpdating || !selectedProgram || !programName.trim()}
          >
            {isUpdating ? 'Updating...' : 'Update'}
          </Button>
          <Button
            className="bg-red-500 text-white hover:bg-red-600"
            onClick={handleDeleteProgram}
            disabled={isDeleting || !selectedProgram}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            className="bg-green-500 text-white hover:bg-green-600"
            onClick={handleSaveProgram}
            disabled={isSaving || !programName.trim()}
          >
            {isSaving ? 'Saving...' : 'Save Program'}
          </Button>
          <Button
            className="bg-blue-500 text-white hover:bg-blue-600"
            onClick={handleUpdateProcedures}
            disabled={isSaving || isUpdatingProcedures}
          >
            {isUpdatingProcedures ? 'Updating...' : 'Update Procedures'}
          </Button>
        </div>
      </div>



        <div className="vpl-editor-container min-w-[564px]">
        <vpl-editor
          key={editorKey}
          ref={(el: any) => {
          if (el) {
            (window as any).currentEditor = el;

            el.addEventListener('ready', () => {
              (window as any).currentEditor.isReady = true;
              setIsEditorReady(true);

              if (currentProgramData) {
                try {
                  const typedEditor = el as any;
                  if (typeof typedEditor.updateProgram === 'function') {
                    typedEditor.updateProgram(currentProgramData);

                    if (!instancesLoading && instancesData?.sdInstances) {
                      updateEditorDevices();
                    }
                  }
                  else {
                    console.error('No updateProgram function found');
                  }
                } catch (error) {
                  console.error('Error setting program data:', error);
                }
              } else if (!proceduresLoading && proceduresData?.vplProcedures) {
                initializeEditorWithProcedures();

                if (!instancesLoading && instancesData?.sdInstances) {
                  updateEditorDevices();
                }
              }
            });

            setTimeout(() => {
              if (!(window as any).currentEditor.isReady) {
                (window as any).currentEditor.isReady = true;
                setIsEditorReady(true);

                if (currentProgramData && el === (window as any).currentEditor) {
                  try {
                    if (!currentProgramData.block) {
                      currentProgramData.block = []
                    }

                    if (!Array.isArray(currentProgramData.block)) {
                      currentProgramData.block = []
                    }

                    const typedEditor = el as any;
                    if (typeof typedEditor.updateProgram === 'function') {
                      const programCopy = JSON.parse(JSON.stringify(currentProgramData))
                      typedEditor.updateProgram(programCopy);

                      if (!instancesLoading && instancesData?.sdInstances) {
                        updateEditorDevices();
                      }
                    }
                    else {
                      console.error('No updateProgram function found');
                    }
                  } catch (error) {
                    console.error('Error setting program data (via timeout):', error);
                    toast.error(`Error loading program (timeout): ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                } else if (el === (window as any).currentEditor && !proceduresLoading && proceduresData?.vplProcedures) {
                  initializeEditorWithProcedures();

                  if (!instancesLoading && instancesData?.sdInstances) {
                    updateEditorDevices();
                  }
                }
              }
            },420);
          }
        }}
      ></vpl-editor>
      </div>
    </div>
  )
}