import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMutation, useQuery } from '@apollo/client'
import {
  CREATE_VPL_PROGRAM,
  UPDATE_VPL_PROGRAM,
  DELETE_VPL_PROGRAM,
  UPDATE_VPL_PROCEDURE,
  CREATE_VPL_PROCEDURE
} from '@/graphql/automations/Mutations'
import { GET_VPL_PROGRAMS, GET_VPL_PROCEDURES } from '@/graphql/automations/Queries'
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
  const [isRefetchingProcedures, setIsRefetchingProcedures] = useState(false)
  const [editorKey, setEditorKey] = useState(0) // Used to force re-render of the editor
  const [currentProgramData, setCurrentProgramData] = useState<any>(null) // Store the current program data

  // GraphQL query to fetch all VPL programs
  const { data: programsData, loading: programsLoading, refetch: refetchPrograms } = useQuery(GET_VPL_PROGRAMS)

  // GraphQL query to fetch all VPL procedures
  const { data: proceduresData, loading: proceduresLoading, refetch: refetchProcedures } = useQuery(GET_VPL_PROCEDURES)

  // State for tracking if a program is loading
  const [loadingProgram, setLoadingProgram] = useState(false)

  // GraphQL mutations
  const [createVPLProgram] = useMutation(CREATE_VPL_PROGRAM)
  const [updateVPLProgram] = useMutation(UPDATE_VPL_PROGRAM)
  const [deleteVPLProgram] = useMutation(DELETE_VPL_PROGRAM)
  const [updateVPLProcedure] = useMutation(UPDATE_VPL_PROCEDURE)
  const [createVPLProcedure] = useMutation(CREATE_VPL_PROCEDURE)


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

  // Function to check if a program with the given name already exists
  const checkProgramExists = (name: string): VPLProgram | undefined => {
    if (!programsData?.vplPrograms) return undefined
    return programsData.vplPrograms.find(
      (program: VPLProgram) => program.name.toLowerCase() === name.toLowerCase()
    )
  }

  // Function to generate a unique name by adding or incrementing a number in parentheses
  const generateUniqueName = (baseName: string): string => {
    // Check if the base name already exists
    if (!checkProgramExists(baseName)) return baseName

    // Try adding numbers in parentheses until we find a unique name
    let counter = 1
    let newName = `${baseName}(${counter})`

    while (checkProgramExists(newName)) {
      counter++
      newName = `${baseName}(${counter})`
    }

    return newName
  }

  const proceduresParsingForSave = (program: any) => {
    // access the header.userProcedures as json and parse each entry making it into new db entry. if the procedure already exists, update it but only if the data changed and warn the user via toast that existing procedure was updated and it might break functionality if it was used in other programs
    if (!program.header || !program.header.userProcedures) {
      console.log('No user procedures found in program:', program)
      return
    }

    console.log('Processing user procedures:', program.header.userProcedures)

    // Check if userProcedures is already an object or a JSON string
    const userProcedures = typeof program.header.userProcedures === 'string'
      ? JSON.parse(program.header.userProcedures)
      : program.header.userProcedures

    console.log('Parsed user procedures:', userProcedures)

    // Get all procedures from the database
    const allProceduresFromDB = proceduresData?.vplProcedures || []
    console.log('All procedures from DB:', allProceduresFromDB)

    for (const procedureName in userProcedures) {
      const procedureData = userProcedures[procedureName]
      console.log(`Processing procedure "${procedureName}":`, procedureData)

      // Check if the procedure already exists in the database
      const existingProcedure = allProceduresFromDB.find(
        (procedure: VPLProcedure) => procedure.name === procedureName
      )

      console.log(`Existing procedure check for "${procedureName}":`, existingProcedure)

      if (existingProcedure) {
        // Procedure exists, check if the data has changed
        const procedureDataString = JSON.stringify(procedureData)
        console.log(`Comparing data for "${procedureName}":`, {
          existing: existingProcedure.data,
          new: procedureDataString
        })

        if (existingProcedure.data !== procedureDataString) {
          // Data has changed, update the procedure
          console.log(`Updating procedure "${procedureName}" with ID ${existingProcedure.id}`)
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
            toast.warning(`Procedure "${procedureName}" updated. It might break other programs if implementation logic was changed.`)
            // Refresh the procedures list to show the updated data
            refetchProcedures()
          })
          .catch(error => {
            console.error('Error updating procedure:', error)
            toast.error(`Failed to update procedure "${procedureName}": ${error.message || 'Unknown error'}`)
          })
        } else {
          console.log(`Procedure "${procedureName}" data hasn't changed, skipping update`)
        }
      } else {
        // Procedure doesn't exist, create a new one
        console.log(`Creating new procedure "${procedureName}"`)
        createVPLProcedure({
          variables: {
            input: {
              name: procedureName,
              data: JSON.stringify(procedureData)
            }
          }
        })
        .then(() => {
          toast.success(`New procedure "${procedureName}" created`)
          // Refresh the procedures list to show the updated data
          refetchProcedures()
        })
        .catch(error => {
          console.error('Error creating procedure:', error)
          toast.error(`Failed to create procedure "${procedureName}": ${error.message || 'Unknown error'}`)
        })
      }
    }
  }


  // Function to save a program with the given name
  const saveProgram = (name: string, overwriteId?: string) => {
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

    // Process procedures before validating the program structure
    proceduresParsingForSave(program)

    // Validate program structure
    try {
      // Check if program has required properties
      if (!program.block || !Array.isArray(program.block)) {
        toast.error('Invalid program structure: missing block array')
        return
      }

      // Log detailed program structure for debugging
      console.log('Saving program structure:', JSON.stringify(program, null, 2))

      // Create a sanitized copy of the program to avoid reference issues
      const programCopy = JSON.parse(JSON.stringify(program))
      // Set isSaving state
      setIsSaving(true)

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
          refetchPrograms()
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

  const handleSaveProgram = () => {
    if (!programName.trim()) {
      toast.error('Please enter a program name')
      return
    }

    // Check if a program with this name already exists
    const existingProgram = checkProgramExists(programName)

    if (existingProgram) {
      // Program with the same name exists, ask user what to do
      if (confirm(`A program named "${programName}" already exists. Do you want to:\n\n` +
                  `• Click OK to overwrite the existing program\n` +
                  `• Click Cancel to save as "${generateUniqueName(programName)}"`)) {
        // User chose to overwrite
        saveProgram(programName, existingProgram.id)
      } else {
        // User chose to save as a new name
        const uniqueName = generateUniqueName(programName)
        saveProgram(uniqueName)
      }
    } else {
      // No duplicate, proceed with normal save
      saveProgram(programName)
    }
  }

  // Load a program by ID
  const handleLoadProgram = () => {
    if (!selectedProgram) {
      toast.error('Please select a program to load')
      return
    }

    setLoadingProgram(true)

    // Find the selected program in the list to get its ID
    const selectedProgramData = programsData?.vplPrograms?.find(
      (program: VPLProgram) => program.name === selectedProgram
    )

    if (!selectedProgramData) {
      toast.error(`Program "${selectedProgram}" not found`)
      setLoadingProgram(false)
      return
    }
    console.log('Selected program data:', selectedProgramData)

    try {
      const programData = JSON.parse(selectedProgramData.data)
      console.log('Parsed program data:', programData)

      // Update the program name
      setProgramName(selectedProgramData.name)

      // Store the program data in state
      setCurrentProgramData(programData)

      // Increment the key to force a re-render of the editor
      setEditorKey(prevKey => prevKey + 1)

      toast.success(`Program "${selectedProgramData.name}" loaded successfully`)
    } catch (error) {
      console.error('Error parsing program data:', error)
      toast.error('Failed to parse program data')
    } finally {
      setLoadingProgram(false)
    }
  }

  // Update the current program
  const handleUpdateProgram = () => {
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
      console.log('Retrieved program:', program)

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
      updateVPLProgram({
        variables: {
          id: selectedProgramData.id,
          name: programName,
          data: JSON.stringify(program)
        }
      })
      .then(() => {
        toast.success(`Program updated successfully from "${selectedProgram}" to "${programName}"`)
        setSelectedProgram(programName) // Update the selected program to the new name

        // Refresh the programs list
        refetchPrograms()
      })
      .catch(error => {
        console.error('Update operation error:', error)
        toast.error(`Failed to update program: ${error.message}`)
      })
      .finally(() => {
        setIsUpdating(false)
      })
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

        console.log('Editor reset to empty state')

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

  // Load programs and display them in console
  const handleLoadPrograms = () => {
    if (programsLoading) {
      toast.info('Programs are still loading...')
      return
    }

    const programs = programsData?.vplPrograms || []
    console.log('Available programs:', programs)
    toast.success(`Loaded ${programs.length} programs`)

    // Log the raw program data for debugging
    if (programs.length > 0) {
      programs.forEach((program: VPLProgram) => {
        console.log(`Program ID: ${program.id}, Name: ${program.name}`)
        console.log('Program Data:', program.data)
      })
    }
  }

  // Load procedures and display them in console
  const handleListProcedures = () => {
    if (proceduresLoading) {
      toast.info('Procedures are still loading...')
      return
    }

    // First refetch to get the latest data
    setIsRefetchingProcedures(true)
    refetchProcedures()
      .then(() => {
        const procedures = proceduresData?.vplProcedures || []
        console.log('Available procedures:', procedures)
        toast.success(`Loaded ${procedures.length} procedures`)

        // Log the procedure data for debugging
        if (procedures.length > 0) {
          procedures.forEach((procedure: VPLProcedure) => {
            console.log(`Procedure ID: ${procedure.id}, Name: ${procedure.name}`)
            console.log('Procedure Data:', procedure.data)
          })
        } else {
          console.log('No procedures found')
        }
      })
      .catch(error => {
        console.error('Error fetching procedures:', error)
        toast.error('Failed to fetch procedures')
      })
      .finally(() => {
        setIsRefetchingProcedures(false)
      })
  }

  return (
    <div className="flex flex-col gap-4">
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
            className="bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80"
            onClick={handleLoadPrograms}
            disabled={programsLoading}
          >
            {programsLoading ? 'Loading...' : 'List Programs'}
          </Button>
          <Button
            className="bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80"
            onClick={handleListProcedures}
            disabled={proceduresLoading || isRefetchingProcedures}
          >
            {proceduresLoading || isRefetchingProcedures ? 'Loading...' : 'List Procedures'}
          </Button>
          <Button
            onClick={handleSaveProgram}
            disabled={isSaving || !programName.trim()}
          >
            {isSaving ? 'Saving...' : 'Save New'}
          </Button>
        </div>
      </div>

        {/* VPL Editor */}
        <div className="vpl-editor-container">
        {/* @ts-ignore */}
        <vpl-editor
          key={editorKey}
          ref={(el: any) => {
          if (el) {
            // Store the element in the window object for later use
            (window as any).currentEditor = el;

            // Set a flag to track when the editor is ready
            el.addEventListener('ready', () => {
              console.log('VPL Editor is ready');
              (window as any).currentEditor.isReady = true;

              // If we have program data, set it now that the editor is ready
              if (currentProgramData) {
                try {
                  const typedEditor = el as any;
                  if (typeof typedEditor.updateProgram === 'function') {
                    typedEditor.updateProgram(currentProgramData);
                    console.log('Program set using updateProgram');
                  }
                  else if (typeof typedEditor.setProgram === 'function') {
                    typedEditor.setProgram(currentProgramData);
                    console.log('Program set using setProgram');
                  }
                  else {
                    console.error('No setProgram or updateProgram function found');
                  }
                } catch (error) {
                  console.error('Error setting program data:', error);
                }
              }
            });

            // Set a timeout to initialize the editor if the ready event doesn't fire
            setTimeout(() => {
              if (!(window as any).currentEditor.isReady) {
                console.log('Setting editor ready flag via timeout');
                (window as any).currentEditor.isReady = true;

                // If we have program data and the editor is not yet initialized, try to set it
                if (currentProgramData && el === (window as any).currentEditor) {
                  try {
                    const typedEditor = el as any;
                    if (typeof typedEditor.updateProgram === 'function') {
                      typedEditor.updateProgram(currentProgramData);
                      console.log('Program set using updateProgram (via timeout)');
                    }
                    else if (typeof typedEditor.setProgram === 'function') {
                      typedEditor.setProgram(currentProgramData);
                      console.log('Program set using setProgram (via timeout)');
                    }
                    else {
                      console.error('No setProgram or updateProgram function found');
                    }
                  } catch (error) {
                    console.error('Error setting program data (via timeout):', error);
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
