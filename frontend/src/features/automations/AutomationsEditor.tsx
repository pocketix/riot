import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMutation, useQuery, useLazyQuery } from '@apollo/client'
import {
  CREATE_VPL_PROGRAM,
  UPDATE_VPL_PROGRAM,
  DELETE_VPL_PROGRAM
} from '@/graphql/automations/Mutations'
import { GET_VPL_PROGRAMS, GET_VPL_PROGRAM } from '@/graphql/automations/Queries'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface VPLProgram {
  id: string
  name: string
  data: string
  lastRun?: string
  enabled: boolean
}

export default function AutomationsEditor() {
  const editorRef = useRef<HTMLElement>(null)
  const [programName, setProgramName] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // GraphQL query to fetch all VPL programs
  const { data: programsData, loading: programsLoading, refetch: refetchPrograms } = useQuery(GET_VPL_PROGRAMS)

  // GraphQL lazy query for loading a specific program
  const [getVPLProgram, { loading: loadingProgram }] = useLazyQuery(GET_VPL_PROGRAM, {
    onCompleted: (data) => {
      if (data?.vplProgram) {
        const program = data.vplProgram
        setProgramName(program.name)

        // Set the program data in the editor using the updateProgram method
        const editor = editorRef.current as any
        if (editor && program.data) {
          try {
            const programData = JSON.parse(program.data)
            // For custom lit elements, we need to directly call the method
            // without any type checking
            console.log('Attempting to update program with data:', programData)

            // Direct method call - this is the most reliable way to work with custom elements
            editor.updateProgram(programData)
            console.log('Program updated successfully')
            toast.success(`Program "${program.name}" loaded successfully`)
          } catch (error) {
            console.error('Error parsing program data:', error)
            toast.error('Failed to parse program data')
          }
        }
      }
    },
    onError: (error) => {
      toast.error(`Failed to load program: ${error.message}`)
    }
  })

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

  // Set up event listener for program changes
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    // For custom elements, we need to ensure they're properly initialized
    // before attaching event listeners
    setTimeout(() => {
      try {
        const handleProgramChange = (e: CustomEvent) => {
          // Log program changes to console
          console.log('Program changed:', e.detail)
        }

        // Add event listener for the 'change' event
        editor.addEventListener('change', handleProgramChange as EventListener)
        console.log('Successfully attached change event listener to vpl-editor')

        // Return cleanup function
        return () => {
          try {
            editor.removeEventListener('change', handleProgramChange as EventListener)
          } catch (error) {
            console.error('Error removing event listener:', error)
          }
        }
      } catch (error) {
        console.error('Error setting up event listener:', error)
      }
    }, 100) // Small delay to ensure the element is fully initialized
  }, [editorRef.current])

  const handleSaveProgram = () => {
    if (!programName.trim()) {
      toast.error('Please enter a program name')
      return
    }

    const editor = editorRef.current as any
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
    }
  }

  // Load a program by ID
  const handleLoadProgram = () => {
    if (!selectedProgram) {
      toast.error('Please select a program to load')
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
    console.log('Selected program data:', selectedProgramData)

    // Load the program by ID
    getVPLProgram({
      variables: {
        id: selectedProgramData.id
      }
    })
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

    const editor = editorRef.current as any
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

        // Clear the editor
        const editor = editorRef.current as any
        if (editor) {
          // For custom lit elements, we need to directly call the method
          // without any type checking
          console.log('Attempting to clear program')

          // Direct method call - this is the most reliable way to work with custom elements
          editor.updateProgram(null)
          console.log('Program cleared successfully')
        }

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

      {/* @ts-ignore */}
      <vpl-editor ref={editorRef}></vpl-editor>
    </div>
  )
}
