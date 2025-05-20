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

// Device interfaces for VPL editor
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

// SDType interface for type checking - used in function parameters and type assertions
// @ts-ignore - This type is used in type assertions
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
  label?: string // Optional label property
}

// Extend the Window interface to include our custom property
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
  const [editorKey, setEditorKey] = useState(0) // Used to force re-render of the editor
  const [currentProgramData, setCurrentProgramData] = useState<any>(null) // Store the current program data
  const [originalProcedures, setOriginalProcedures] = useState<Record<string, any>>({}) // Store the original procedures for comparison
  // We only need to track loading state for devices, not the devices themselves
  const [, setDevices] = useState<Device[]>([]) // Only need the setter for updateEditorDevices
  const [isLoadingDevices, setIsLoadingDevices] = useState(false) // Track loading state for devices

  // GraphQL query to fetch all VPL programs
  const { data: programsData, loading: programsLoading, refetch: refetchPrograms } = useQuery(GET_VPL_PROGRAMS)

  // GraphQL query to fetch all VPL procedures
  const { data: proceduresData, loading: proceduresLoading, refetch: refetchProcedures } = useQuery(GET_VPL_PROCEDURES)

  // GraphQL query to fetch all SD instances
  const { data: instancesData, loading: instancesLoading } = useQuery(GET_INSTANCES)

  // GraphQL query to fetch all SD types - not directly used but needed for the schema
  useQuery(GET_SD_TYPES)

  // State for tracking if a program is loading
  const [loadingProgram, setLoadingProgram] = useState(false)

  // GraphQL mutations
  const [createVPLProgram] = useMutation(CREATE_VPL_PROGRAM)
  const [updateVPLProgram] = useMutation(UPDATE_VPL_PROGRAM)
  const [deleteVPLProgram] = useMutation(DELETE_VPL_PROGRAM)
  const [updateVPLProcedure] = useMutation(UPDATE_VPL_PROCEDURE)
  const [createVPLProcedure] = useMutation(CREATE_VPL_PROCEDURE)
  const [deleteVPLProcedure] = useMutation(DELETE_VPL_PROCEDURE)
  const [linkProgramToProcedure] = useMutation(LINK_PROGRAM_TO_PROCEDURE)
  const [unlinkProgramFromProcedure] = useMutation(UNLINK_PROGRAM_FROM_PROCEDURE)

  // State for tracking procedure links
  const [procedureLinks, setProcedureLinks] = useState<Map<string, Set<string>>>(new Map())

  // Get the Apollo Client instance
  const apolloClient = useApolloClient()

  // Function to parse command payload from JSON string
  const parseCommandPayload = (payload: string): { name: string, type: string, possibleValues: any[] }[] => {
    try {
      // If it's already a JSON object, return it
      if (typeof payload === 'object') {
        return payload;
      }

      // Try to parse as JSON
      return JSON.parse(payload);
    } catch (error) {
      console.error('Error parsing command payload:', error);
      console.error('Raw payload:', payload);
      return [];
    }
  }

  // Function to select an appropriate icon for a command
  const selectIconForCommand = (commandName: string, deviceType: string): string => {
    // Map common commands to icons
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

    // Default icons based on device type
    const deviceTypeIcons: Record<string, string> = {
      'switch': 'toggleOn',
      'sensor': 'cpu',
      'relay': 'lightningChargeFill',
      'light': 'lightbulb',
      'thermostat': 'thermometerHalf',
      'shelly': 'lightningChargeFill'
    }

    // Check if the device type contains any of the keys in deviceTypeIcons
    for (const key in deviceTypeIcons) {
      if (deviceType.toLowerCase().includes(key)) {
        return deviceTypeIcons[key]
      }
    }

    return 'lightbulb' // Default icon
  }

  // Function to select a color for the device type
  const selectColorForDeviceType = (deviceType: string): string => {
    const colorMap: Record<string, string> = {
      'switch': '#6366f1',    // Indigo
      'sensor': '#06b6d4',    // Cyan
      'relay': '#f97316',     // Orange
      'light': '#eab308',     // Yellow
      'thermostat': '#ec4899', // Pink
      'shelly': '#f97316'     // Orange for Shelly devices
    }

    // Check if the device type contains any of the keys in colorMap
    for (const key in colorMap) {
      if (deviceType.toLowerCase().includes(key)) {
        return colorMap[key]
      }
    }

    return '#6366f1' // Default to indigo
  }

  // Function to map SD parameter type to VPL argument type
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

  // Function to format values for display
  const formatLabel = (value: any): string => {
    if (typeof value === 'string') {
      // Capitalize first letter, lowercase the rest
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
    }
    return String(value)
  }


  // Function to create an empty program with procedures
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

    // Get all procedures from the database - use the latest data
    const allProceduresFromDB = proceduresData?.vplProcedures || []

    // Add each procedure to the program's header.userProcedures
    if (allProceduresFromDB.length > 0) {
      allProceduresFromDB.forEach((procedure: VPLProcedure) => {
        try {
          // Parse the procedure data from JSON string to object
          const procedureData = JSON.parse(procedure.data)

          // Add the procedure to the program's header.userProcedures
          // The name in the table is the key, and the data is the value
          emptyProgram.header.userProcedures[procedure.name] = procedureData
        } catch (error) {
          console.error(`Error parsing procedure data for "${procedure.name}":`, error)
        }
      })

      // Save the original procedures for comparison when saving
      setOriginalProcedures({...emptyProgram.header.userProcedures})
    }

    return emptyProgram
  }

  // Initialize editor with procedures
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
      // Create an empty program with all procedures
      const emptyProgramWithProcedures = createEmptyProgramWithProcedures()

      // Ensure the program has the expected structure
      if (!emptyProgramWithProcedures.block) {
        emptyProgramWithProcedures.block = []
      }

      if (!Array.isArray(emptyProgramWithProcedures.block)) {
        emptyProgramWithProcedures.block = []
      }

      // Set the program in the editor
      if (typeof editor.updateProgram === 'function') {
        // Create a deep copy to avoid reference issues
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

  // Function to convert SD instances to VPL editor device format
  const convertToVplDevices = async (): Promise<Device[]> => {
    setIsLoadingDevices(true)

    try {
      if (!instancesData?.sdInstances || instancesData.sdInstances.length === 0) {
        return []
      }

      // Filter instances to only include those confirmed by the user
      const confirmedInstances = instancesData.sdInstances.filter(
        (instance: SDInstance) => instance.confirmedByUser
      )

      if (confirmedInstances.length === 0) {
        return []
      }

      // Process each instance to create a VPL device
      const vplDevices: Device[] = []

      for (const instance of confirmedInstances) {
        // Get the type details for this instance
        const typeId = instance.type.id

        // Fetch the type details with commands
        const { data: typeData } = await apolloClient.query({
          query: GET_PARAMETERS,
          variables: { sdTypeId: typeId },
          fetchPolicy: 'network-only'
        })

        if (!typeData?.sdType) {
          continue
        }

        const sdType = typeData.sdType

        // Extract attributes from parameters
        const attributes = sdType.parameters.map((param: SDParameter) => {
          // If label is not present, use the denotation
          return param.label || param.denotation;
        })

        // Convert commands to functions
        const functions: DeviceFunction[] = []

        if (sdType.commands && sdType.commands.length > 0) {
          for (const command of sdType.commands) {
            // Parse the command payload
            const parameters = parseCommandPayload(command.payload)

            if (parameters.length > 0) {
              // This is a function with arguments
              functions.push({
                type: 'unit_with_args',
                group: 'iot',
                label: command.label || command.name, // If label is not present, use the name
                icon: selectIconForCommand(command.name, sdType.denotation),
                backgroundColor: selectColorForDeviceType(sdType.denotation),
                foregroundColor: '#ffffff',
                arguments: parameters.map(param => ({
                  type: mapArgumentType(param.type) as 'str_opt' | 'num_opt' | 'boolean' | 'string' | 'number',
                  options: param.possibleValues
                    ? param.possibleValues.map(value => {
                        // Handle the case where the value might be a string with quotes
                        let cleanValue = value;
                        if (typeof value === 'string') {
                          // Remove quotes if they exist
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
              // This is a simple function without arguments
              functions.push({
                type: 'unit',
                group: 'iot',
                label: command.label || command.name, // If label is not present, use the name
                icon: selectIconForCommand(command.name, sdType.denotation),
                backgroundColor: selectColorForDeviceType(sdType.denotation),
                foregroundColor: '#ffffff'
              })
            }
          }
        }

        // No default functions will be added if there are no commands
        // This is intentional - we only want to show actual commands from the device

        // Create the VPL device - use userIdentifier as the name, but fall back to UID if not available
        vplDevices.push({
          deviceName: instance.userIdentifier || instance.uid,
          deviceType: sdType.label || sdType.denotation, // If label is not present, use the denotation
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

  // Function to update the VPL editor with devices
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

  // No debug devices function - we only want to use real devices from the database

  // First useEffect to set up the window.currentEditor property
  useEffect(() => {
    // Define the currentEditor property on the window object
    if (!(window as any).currentEditor) {
      Object.defineProperty(window, 'currentEditor', {
        value: null,
        writable: true,
        configurable: true
      })
    }

    // Clean up when component unmounts
    return () => {
      (window as any).currentEditor = null
    }
  }, [])

  // Track editor ready state
  const [isEditorReady, setIsEditorReady] = useState(false)

  // Effect to fetch procedures when the component mounts
  useEffect(() => {
    if (!proceduresLoading && proceduresData?.vplProcedures) {
      // Check if Apollo client is available
      if (!apolloClient) {
        console.error('Apollo Client is not available, cannot initialize procedure links')
        return
      }

      // Initialize procedure links
      initializeProcedureLinks()
    }
  }, [proceduresLoading, proceduresData, apolloClient])

  // Function to initialize procedure links
  const initializeProcedureLinks = async () => {
    if (!apolloClient) {
      console.error('Apollo Client is not available, cannot initialize procedure links')
      return
    }

    const procedures = proceduresData?.vplProcedures || []
    const newProcedureLinks = new Map<string, Set<string>>()

    // For each procedure, fetch the programs that use it
    for (const procedure of procedures) {
      try {
        const { data } = await getProgramsForProcedure(procedure.id)
        const programs = data?.vplProgramsForProcedure || []

        // Create a set of program IDs that use this procedure
        const programIds = new Set<string>()
        programs.forEach((program: VPLProgram) => programIds.add(program.id))

        // Add the procedure-program link to the map
        newProcedureLinks.set(procedure.id, programIds)
      } catch (error) {
        console.error(`Error fetching programs for procedure ${procedure.id}:`, error)
      }
    }

    // Update the procedure links state
    setProcedureLinks(newProcedureLinks)
  }

  // Helper function to check if a procedure is used in any program
  const isProcedureUsedInPrograms = (procedureId: string): boolean => {
    const programIds = procedureLinks.get(procedureId)
    return programIds !== undefined && programIds.size > 0
  }

  // Helper function to get all programs that use a procedure
  const getProgramsUsingProcedure = (procedureId: string): string[] => {
    const programIds = procedureLinks.get(procedureId)
    if (!programIds) return []

    // Convert program IDs to program names
    return Array.from(programIds).map(programId => {
      const program = programsData?.vplPrograms?.find((p: VPLProgram) => p.id === programId)
      return program ? program.name : `Unknown Program (ID: ${programId})`
    })
  }

  // Function to get programs for a procedure
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
        fetchPolicy: 'network-only' // Always fetch from network to get the latest data
      })
      .then(resolve)
      .catch(reject)
    })
  }

  // Function to get procedures for a program
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
        fetchPolicy: 'network-only' // Always fetch from network to get the latest data
      })
      .then(resolve)
      .catch(reject)
    })
  }

  // Effect to initialize editor when both editor is ready and procedures are loaded
  useEffect(() => {
    if (isEditorReady && !proceduresLoading && proceduresData?.vplProcedures && !currentProgramData) {
      console.log('Both editor ready and procedures loaded, initializing editor')
      initializeEditorWithProcedures()
    }
  }, [isEditorReady, proceduresLoading, proceduresData, currentProgramData])

  // Effect to load devices when the editor is ready
  useEffect(() => {
    if (isEditorReady && !instancesLoading && instancesData?.sdInstances) {
      console.log('Editor ready and instances loaded, updating devices')
      updateEditorDevices()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditorReady, instancesLoading, instancesData])

  // Function to check if a program with the given name already exists
  const checkProgramExists = (name: string): VPLProgram | undefined => {
    if (!programsData?.vplPrograms) return undefined

    return programsData.vplPrograms.find(
      (program: VPLProgram) => program.name.toLowerCase() === name.toLowerCase()
    )
  }

  // Function to generate a unique name has been removed as we no longer use incremented names

  const proceduresParsingForSave = async (program: any) => {
    // access the header.userProcedures as json and parse each entry making it into new db entry. if the procedure already exists, update it but only if the data changed and warn the user via toast that existing procedure was updated and it might break functionality if it was used in other programs
    if (!program.header || !program.header.userProcedures) {
      return
    }

    // Check if userProcedures is already an object or a JSON string
    const userProcedures = typeof program.header.userProcedures === 'string'
      ? JSON.parse(program.header.userProcedures)
      : program.header.userProcedures

    // Get all procedures from the database
    const allProceduresFromDB = proceduresData?.vplProcedures || []

    // Track the procedures used in this program
    const usedProcedureIds: string[] = []

    // Get the current program ID if we're updating an existing program
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

      // Check if the procedure already exists in the database
      const existingProcedure = allProceduresFromDB.find(
        (procedure: VPLProcedure) => procedure.name === procedureName
      )

      if (existingProcedure) {
        // Add this procedure to the list of used procedures
        usedProcedureIds.push(existingProcedure.id)

        // Procedure exists, check if the data has changed
        const procedureDataString = JSON.stringify(procedureData)

        // Parse both strings to objects for a proper comparison
        let hasChanged = false;
        try {
          // Parse both strings to objects
          const existingData = JSON.parse(existingProcedure.data);
          const newData = procedureData; // Already an object

          // Convert both to JSON strings with the same formatting and sort keys for consistent comparison
          const normalizedExisting = JSON.stringify(existingData, Object.keys(existingData).sort());
          const normalizedNew = JSON.stringify(newData, Object.keys(newData).sort());

          // Compare the normalized strings
          hasChanged = normalizedExisting !== normalizedNew;
        } catch (error) {
          console.error(`Error comparing procedure data for "${procedureName}":`, error);
          // If there's an error in parsing, assume the data has changed
          hasChanged = true;
        }

        if (hasChanged) {
          try {
            // Check if the procedure is used in any programs using our helper function
            const affectedProgramNames = getProgramsUsingProcedure(existingProcedure.id)
            const isUsedInPrograms = isProcedureUsedInPrograms(existingProcedure.id)

            // Data has changed, update the procedure
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
              // If there are affected programs, show a warning with their names
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

              // Refresh the procedures list to show the updated data
              refetchProcedures()
              // Refresh the procedure links
              initializeProcedureLinks()
            })
            .catch(error => {
              console.error('Error updating procedure:', error)
              toast.error(`Failed to update procedure "${procedureName}": ${error.message || 'Unknown error'}`)
            })
          } catch (error) {
            console.error('Error fetching programs for procedure:', error)
            // Continue with the update even if we can't fetch the affected programs
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
        // Procedure doesn't exist, create a new one
        // Ensure consistent JSON formatting
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

          // Add this procedure to the list of used procedures
          usedProcedureIds.push(newProcedure.id)

          // If we have a current program ID, link the procedure to it
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

          // Use a longer duration for success messages (5 seconds)
          toast.success(`New procedure "${procedureName}" created`, {
          })
          // Refresh the procedures list to show the updated data
          refetchProcedures()
          // Refresh the procedure links
          initializeProcedureLinks()
        })
        .catch(error => {
          console.error('Error creating procedure:', error)
          toast.error(`Failed to create procedure "${procedureName}": ${error.message || 'Unknown error'}`)
        })
      }
    }

    // Check for deleted procedures by comparing with originalProcedures
    for (const originalProcedureName in originalProcedures) {
      // If the procedure is not in the current userProcedures, it was deleted
      if (!program.header.userProcedures[originalProcedureName]) {
        console.log(`Procedure "${originalProcedureName}" was deleted`)

        // Find the procedure in the database
        const deletedProcedure = allProceduresFromDB.find(
          (procedure: VPLProcedure) => procedure.name === originalProcedureName
        )

        if (deletedProcedure) {
          // Before deleting, get the programs that use this procedure
          try {
            // Check if the procedure is used in any programs using our helper function
            const affectedProgramNames = getProgramsUsingProcedure(deletedProcedure.id)
            const isUsedInPrograms = isProcedureUsedInPrograms(deletedProcedure.id)

            // Delete the procedure from the database without asking
            deleteVPLProcedure({
              variables: {
                id: deletedProcedure.id
              }
            })
            .then(() => {
              // If there are affected programs, show a warning with their names
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

              // Refresh the procedures list to show the updated data
              refetchProcedures()
              // Refresh the procedure links
              initializeProcedureLinks()
            })
            .catch(error => {
              console.error('Error deleting procedure:', error)
              toast.error(`Failed to delete procedure "${originalProcedureName}": ${error.message || 'Unknown error'}`)
            })
          } catch (error) {
            console.error('Error fetching programs for procedure:', error)
            // Continue with the deletion even if we can't fetch the affected programs
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

    // If we have a current program ID, update the procedure links
    if (currentProgramId) {
      // Get the current procedures linked to this program
      try {
        const { data } = await getProceduresForProgram(currentProgramId)
        const currentProcedures = data?.vplProceduresForProgram || []
        const currentProcedureIds = currentProcedures.map((p: VPLProcedure) => p.id)

        // Find procedures to link (in usedProcedureIds but not in currentProcedureIds)
        const proceduresToLink = usedProcedureIds.filter((id: string) => !currentProcedureIds.includes(id))

        // Find procedures to unlink (in currentProcedureIds but not in usedProcedureIds)
        const proceduresToUnlink = currentProcedureIds.filter((id: string) => !usedProcedureIds.includes(id))

        // Link new procedures
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

        // Unlink removed procedures
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

    // Update the originalProcedures state with the current procedures
    setOriginalProcedures({...program.header.userProcedures})
  }


  // Function to save a program with the given name
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

    // Set isSaving state
    setIsSaving(true)

    try {
      // Validate program structure
      if (!program.block || !Array.isArray(program.block)) {
        toast.error('Invalid program structure: missing block array')
        setIsSaving(false)
        return
      }

      // Create a sanitized copy of the program to avoid reference issues
      const programCopy = JSON.parse(JSON.stringify(program))

      // Process procedures before saving the program
      await proceduresParsingForSave(programCopy)

      // If we're overwriting an existing program
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
          setProgramName('') // Clear the name field after successful save
          refetchPrograms()
          // Refresh the procedure links
          initializeProcedureLinks()
        })
        .catch(error => {
          console.error('Update operation error:', error)
          // Provide more detailed error message
          const errorMessage = error.message || 'Unknown error'
          toast.error(`Failed to update program: ${errorMessage}`)

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
      } else {
        // Creating a new program
        createVPLProgram({
          variables: {
            name: name,
            data: JSON.stringify(programCopy)
          }
        })
        .then((result) => {
          const savedProgram = result.data.createVPLProgram
          toast.success(`Program "${savedProgram.name}" saved successfully`)
          setProgramName('') // Clear the name field after successful save

          // Get the procedures used in this program
          const usedProcedureIds: string[] = []
          if (programCopy.header && programCopy.header.userProcedures) {
            // Find the procedure IDs for each procedure in the program
            for (const procedureName in programCopy.header.userProcedures) {
              const procedure = proceduresData?.vplProcedures?.find(
                (p: VPLProcedure) => p.name === procedureName
              )
              if (procedure) {
                usedProcedureIds.push(procedure.id)
              }
            }

            // Link each procedure to the new program
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

  // Function to parse procedures when loading a program
  const proceduresParsingForLoad = (program: any) => {
    //create json object that will get filled with json object of user procedure entries

    // Ensure the program has a header and userProcedures property
    if (!program.header) {
      program.header = {}
    }

    if (program.header.userVariables === undefined) {
      program.header.userVariables = {}
    }

    // Initialize userProcedures if it doesn't exist
    if (!program.header.userProcedures) {
      program.header.userProcedures = {}
    }

    // Get all procedures from the database - ensure we're using the latest data
    const allProceduresFromDB = proceduresData?.vplProcedures || []

    // Clear existing procedures before adding the latest ones
    program.header.userProcedures = {}

    // Add each procedure to the program's header.userProcedures
    if (allProceduresFromDB.length > 0) {
      allProceduresFromDB.forEach((procedure: VPLProcedure) => {
        try {
          // Parse the procedure data from JSON string to object
          const procedureData = JSON.parse(procedure.data)

          // Validate that procedureData is an object
          if (typeof procedureData !== 'object' || procedureData === null) {
            console.error(`Invalid procedure data for "${procedure.name}": not an object`)
            return // Skip this procedure
          }

          // Add the procedure to the program's header.userProcedures
          // The name in the table is the key, and the data is the value
          program.header.userProcedures[procedure.name] = procedureData
        } catch (error) {
          console.error(`Error parsing procedure data for "${procedure.name}":`, error)
        }
      })
    }

    // Ensure the program header only contains userVariables and userProcedures
    const { userVariables, userProcedures } = program.header
    program.header = { userVariables, userProcedures }

    // Ensure userProcedures is an object, not null or undefined
    if (!program.header.userProcedures) {
      program.header.userProcedures = {}
    }

    // Save the original procedures for comparison when saving
    setOriginalProcedures({...program.header.userProcedures})
  }

  // Load a program by ID
  const handleLoadProgram = () => {
    if (!selectedProgram) {
      toast.error('Please select a program to load')
      return
    }

    setLoadingProgram(true)

    // First, refresh the procedures to ensure we have the latest data
    setIsRefetchingProcedures(true)
    refetchProcedures()
      .then(() => {

        // Find the selected program in the list to get its ID
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

          // Update the program name
          setProgramName(selectedProgramData.name)

          // Parse the procedures db and add each entry as a valid userProcedure entry
          proceduresParsingForLoad(programData)

          // Set the current program data
          setCurrentProgramData(programData)

          // Directly update the editor with the loaded program
          const editor = (window as any).currentEditor
          if (editor && editor.isReady) {
            console.log('Directly updating editor with loaded program:', programData)
            try {
              // Ensure the program has the expected structure before updating
              if (!programData.block) {
                programData.block = []
                console.log('Added missing block array to program')
              }

              if (!Array.isArray(programData.block)) {
                programData.block = []
                console.log('Replaced invalid block with empty array')
              }

              if (typeof editor.updateProgram === 'function') {
                // Create a deep copy to avoid reference issues
                const programCopy = JSON.parse(JSON.stringify(programData))
                editor.updateProgram(programCopy)
                console.log('Program loaded into editor using updateProgram')
              } else {
                console.error('No updateProgram function found on editor')
                // If direct update fails, force re-render as fallback
                setEditorKey(prevKey => prevKey + 1)
              }
            } catch (error) {
              console.error('Error updating editor with loaded program:', error)
              toast.error(`Error loading program: ${error instanceof Error ? error.message : 'Unknown error'}`)
              // If direct update fails, force re-render as fallback
              setEditorKey(prevKey => prevKey + 1)
            }
          } else {
            console.log('Editor not ready, using key re-render method')
            // If editor is not ready, use the key re-render method
            setEditorKey(prevKey => prevKey + 1)
          }

          toast.success(`Program "${selectedProgramData.name}" loaded successfully`)

          // After loading the program, also load the devices
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

  // Update the current program
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

      // Find the selected program in the list to get its ID
      const selectedProgramData = programsData?.vplPrograms?.find(
        (program: VPLProgram) => program.name === selectedProgram
      )

      if (!selectedProgramData) {
        toast.error(`Program "${selectedProgram}" not found`)
        return
      }

      setIsUpdating(true)

      try {
        // Create a sanitized copy of the program to avoid reference issues
        const programCopy = JSON.parse(JSON.stringify(program))

        // Process procedures before updating the program
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
          setSelectedProgram(programName) // Update the selected program to the new name

          // Refresh the programs list
          refetchPrograms()
          // Refresh the procedure links
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

  // Delete the current program
  const handleDeleteProgram = () => {
    if (!selectedProgram) {
      toast.error('Please select a program to delete')
      return
    }

    if (confirm(`Are you sure you want to delete the program "${selectedProgram}"?`)) {
      setIsDeleting(true)

      // Find the selected program in the list to get its ID
      const selectedProgramData = programsData?.vplPrograms?.find(
        (program: VPLProgram) => program.name === selectedProgram
      )

      if (!selectedProgramData) {
        toast.error(`Program "${selectedProgram}" not found`)
        setIsDeleting(false)
        return
      }

      // Delete the program
      deleteVPLProgram({
        variables: {
          id: selectedProgramData.id
        }
      })
      .then(() => {
        toast.success(`Program "${selectedProgram}" deleted successfully`)
        setProgramName('') // Clear the name field after successful delete
        setSelectedProgram('') // Clear the selected program

        // Clear the editor by resetting the program data
        setCurrentProgramData(null)

        // Increment the key to force a re-render of the editor
        setEditorKey(prevKey => prevKey + 1)

        // Refresh the programs list
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


  // Update procedures without saving the program
  const handleUpdateProcedures = async () => {
    // Access the editor through the window object
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

    // Check if the program has userProcedures
    if (!program.header || !program.header.userProcedures) {
      toast.info('No procedures to update')
      return
    }

    // Set the updating state
    setIsUpdatingProcedures(true)

    // Process procedures without saving the program
    toast.info('Updating procedures...')

    try {
      // Create a sanitized copy of the program to avoid reference issues
      const programCopy = JSON.parse(JSON.stringify(program))

      // Process procedures
      await proceduresParsingForSave(programCopy)
      toast.success('Procedures updated successfully')

      // Refresh the procedure links
      initializeProcedureLinks()
    } catch (error) {
      console.error('Error updating procedures:', error)
      toast.error(`Failed to update procedures: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      // Reset the updating state
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

      {/* Main action buttons */}
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



        {/* VPL Editor */}
        <div className="vpl-editor-container min-w-[564px]">
        {/* @ts-ignore */}
        <vpl-editor
          key={editorKey}
          ref={(el: any) => {
          if (el) {
            // Store the element in the window object for later use
            (window as any).currentEditor = el;

            // Set a flag to track when the editor is ready
            el.addEventListener('ready', () => {
              (window as any).currentEditor.isReady = true;
              setIsEditorReady(true);

              // If we have program data, set it now that the editor is ready
              if (currentProgramData) {
                try {
                  const typedEditor = el as any;
                  if (typeof typedEditor.updateProgram === 'function') {
                    typedEditor.updateProgram(currentProgramData);

                    // After loading the program, also load the devices
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
                // If no program data but procedures are loaded, initialize with procedures
                initializeEditorWithProcedures();

                // After initializing with procedures, also load the devices
                if (!instancesLoading && instancesData?.sdInstances) {
                  updateEditorDevices();
                }
              }
            });

            // Set a timeout to initialize the editor if the ready event doesn't fire
            setTimeout(() => {
              if (!(window as any).currentEditor.isReady) {
                (window as any).currentEditor.isReady = true;
                setIsEditorReady(true);

                // If we have program data and the editor is not yet initialized, try to set it
                if (currentProgramData && el === (window as any).currentEditor) {
                  try {
                    // Ensure the program has the expected structure before updating
                    if (!currentProgramData.block) {
                      currentProgramData.block = []
                    }

                    if (!Array.isArray(currentProgramData.block)) {
                      currentProgramData.block = []
                    }

                    const typedEditor = el as any;
                    if (typeof typedEditor.updateProgram === 'function') {
                      // Create a deep copy to avoid reference issues
                      const programCopy = JSON.parse(JSON.stringify(currentProgramData))
                      typedEditor.updateProgram(programCopy);

                      // After loading the program, also load the devices
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
                  // If no program data but procedures are loaded, initialize with procedures
                  initializeEditorWithProcedures();

                  // After initializing with procedures, also load the devices
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