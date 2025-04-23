import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMutation, useQuery } from '@apollo/client'
import {
  CREATE_VPL_PROGRAM,
  UPDATE_VPL_PROGRAM,
  DELETE_VPL_PROGRAM
} from '@/graphql/automations/Mutations'
import { GET_VPL_PROGRAMS } from '@/graphql/automations/Queries'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface VPLProgram {
  id: string
  name: string
  data: string
  lastRun?: string
  enabled: boolean
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
  const [editorKey, setEditorKey] = useState(0) // Used to force re-render of the editor
  const [currentProgramData, setCurrentProgramData] = useState<any>(null) // Store the current program data

  // GraphQL query to fetch all VPL programs
  const { data: programsData, loading: programsLoading, refetch: refetchPrograms } = useQuery(GET_VPL_PROGRAMS)

  // State for tracking if a program is loading
  const [loadingProgram, setLoadingProgram] = useState(false)

  // GraphQL mutations
  const [createVPLProgram] = useMutation(CREATE_VPL_PROGRAM)
  const [updateVPLProgram] = useMutation(UPDATE_VPL_PROGRAM)
  const [deleteVPLProgram] = useMutation(DELETE_VPL_PROGRAM)

  // Load the VPL editor component from the CDN
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/gh/pocketix/vpl-for-things@main/dist/vpl-editor.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // Load the VPL editor component from the CDN
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

  const handleSaveProgram = () => {
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

      // Log the raw program object to the console
      console.log('Saving program:', program)

      setIsSaving(true)
      createVPLProgram({
        variables: {
          name: programName,
          data: JSON.stringify(program)
        }
      })
      .then((result) => {
        const savedProgram = result.data.createVPLProgram
        toast.success(`Program "${savedProgram.name}" saved successfully`)
        setProgramName('') // Clear the name field after successful save

        // Refresh the programs list
        refetchPrograms()
      })
      .catch(error => {
        console.error('Save operation error:', error)
        toast.error(`Failed to save program: ${error.message}`)
      })
      .finally(() => {
        setIsSaving(false)
      })
    } else {
      toast.error('Editor not initialized')
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
      // Parse the program data
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

            // If we have program data, set it after a short delay
            if (currentProgramData) {
              setTimeout(() => {
                try {
                  const typedEditor = el as any;
                  if (typeof typedEditor.updateProgram === 'function') {
                    typedEditor.updateProgram(currentProgramData);
                    console.log('Program set using updateProgram');
                  } else if (typeof typedEditor.setProgram === 'function') {
                    typedEditor.setProgram(currentProgramData);
                    console.log('Program set using setProgram');
                  } else {
                    console.log('Using direct property assignment');
                    typedEditor.program = currentProgramData;
                  }
                } catch (error) {
                  console.error('Error setting program data:', error);
                }
              }, 100);
            }
          }
        }}
      ></vpl-editor>
      </div>
    </div>
  )
}
