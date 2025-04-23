import { useEffect, useRef, useState } from 'react'
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

export default function AutomationsEditor() {
  const editorRef = useRef<HTMLElement>(null)
  const [programName, setProgramName] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // GraphQL query to fetch all VPL programs
  const { data: programsData, loading: programsLoading, refetch: refetchPrograms } = useQuery(GET_VPL_PROGRAMS)

  // State for tracking loading state
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

  // Initialize the VPL editor when it's mounted
  useEffect(() => {
    const editor = editorRef.current as any
    if (!editor) return

    // Use setTimeout to ensure the element is fully initialized and connected
    setTimeout(() => {
      try {
        // Check if updateProgram method is available (should be attached in connectedCallback)
        if (typeof editor.updateProgram === 'function') {
          // Use the exposed updateProgram method
          editor.updateProgram({})
          console.log('VPL editor initialized with empty program using updateProgram method')
        } else if (typeof editor.setProgram === 'function') {
          // Try the setProgram method as an alternative
          editor.setProgram({})
          console.log('VPL editor initialized with empty program using setProgram method')
        } else {
          // Fallback to direct property assignment
          editor.program = {}
          console.log('VPL editor initialized with empty program using property assignment')
        }
      } catch (error) {
        console.error('Error initializing VPL editor:', error)
      }
    }, 1000) // Longer delay to ensure element is fully connected
  }, [editorRef.current])

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

  // Helper function to force update on VPL editor and its internal components
  const forceVPLEditorUpdate = (editor: any) => {
    if (!editor) return

    console.log('Forcing update on VPL editor and its internal components')

    // Try to request update on the editor itself
    if (typeof editor.requestUpdate === 'function') {
      editor.requestUpdate()
    }

    // Try to access and update internal components
    try {
      // Access the shadow root if available
      if (editor.shadowRoot) {
        // Try to find and update the graphical editor
        const graphicalEditor = editor.shadowRoot.querySelector('graphical-editor')
        if (graphicalEditor) {
          if (typeof graphicalEditor.requestUpdate === 'function') {
            graphicalEditor.requestUpdate()
            console.log('Requested update on graphical editor')
          }

          // Try to directly update the program in the graphical editor
          if (editor.program) {
            try {
              graphicalEditor.program = editor.program
              console.log('Directly set program on graphical editor')
            } catch (geError) {
              console.error('Error setting program on graphical editor:', geError)
            }
          }
        }

        // Try to find and update the text editor
        const textEditor = editor.shadowRoot.querySelector('text-editor')
        if (textEditor) {
          if (typeof textEditor.requestUpdate === 'function') {
            textEditor.requestUpdate()
            console.log('Requested update on text editor')
          }

          // Try to directly update the text in the text editor
          if (editor.program) {
            try {
              textEditor.textEditorValue = JSON.stringify(editor.program, null, ' ')
              console.log('Directly set text on text editor')
            } catch (teError) {
              console.error('Error setting text on text editor:', teError)
            }
          }
        }

        // Try to find and update any blocks in the graphical editor
        const blocks = editor.shadowRoot.querySelectorAll('ge-block')
        if (blocks && blocks.length > 0) {
          console.log(`Found ${blocks.length} blocks to update`)
          blocks.forEach((block: any) => {
            if (typeof block.requestUpdate === 'function') {
              block.requestUpdate()
            }
          })
        }
      }
    } catch (error) {
      console.error('Error updating internal components:', error)
    }
  }

  // Load a program directly from the programs list
  const handleLoadProgram = () => {
    if (!selectedProgram) {
      toast.error('Please select a program to load')
      return
    }

    // Set loading state
    setLoadingProgram(true)

    // Find the selected program in the list
    const selectedProgramData = programsData?.vplPrograms?.find(
      (program: VPLProgram) => program.name === selectedProgram
    )

    if (!selectedProgramData) {
      toast.error(`Program "${selectedProgram}" not found`)
      setLoadingProgram(false)
      return
    }
    console.log('Selected program data:', selectedProgramData)

    // Set the program name
    setProgramName(selectedProgramData.name)

    // Get the editor reference
    const editor = editorRef.current as any
    if (editor && selectedProgramData.data) {
      try {
        // Parse the program data
        const programData = JSON.parse(selectedProgramData.data)
        console.log('Attempting to load program with data:', programData)

        // Use setTimeout to ensure the element is fully initialized
        setTimeout(() => {
          try {
            // Try to use the updateProgram method first
            if (typeof editor.updateProgram === 'function') {
              editor.updateProgram(programData)
              console.log('Program loaded successfully using updateProgram method')
            } else if (typeof editor.setProgram === 'function') {
              editor.setProgram(programData)
              console.log('Program loaded successfully using setProgram method')
            } else {
              // Fallback to direct property assignment
              editor.program = programData
              console.log('Program loaded successfully using property assignment')

              // Try to force a render update
              if (typeof editor.requestUpdate === 'function') {
                editor.requestUpdate()
                console.log('Requested update on VPL editor')
              }
            }

            // Dispatch a custom event to notify the editor that the program has changed
            // This might trigger internal updates in the VPL editor
            try {
              const changeEvent = new CustomEvent('change', {
                detail: programData,
                bubbles: true,
                composed: true
              })
              editor.dispatchEvent(changeEvent)
              console.log('Dispatched change event to VPL editor')
            } catch (eventError) {
              console.error('Error dispatching change event:', eventError)
            }

            // Force update on the VPL editor and its internal components
            forceVPLEditorUpdate(editor)

            // Try to simulate a view change to trigger internal updates
            try {
              // First switch to text editor view
              const teEvent = new CustomEvent('editor-view-changed', {
                detail: { newView: 'te' },
                bubbles: true,
                composed: true
              })
              editor.dispatchEvent(teEvent)

              // Then switch back to graphical editor or split view after a short delay
              setTimeout(() => {
                const geEvent = new CustomEvent('editor-view-changed', {
                  detail: { newView: 'split' },
                  bubbles: true,
                  composed: true
                })
                editor.dispatchEvent(geEvent)
                console.log('Simulated view change to refresh editor')
              }, 100)
            } catch (viewError) {
              console.error('Error simulating view change:', viewError)
            }
            toast.success(`Program "${selectedProgramData.name}" loaded successfully`)
          } catch (error) {
            console.error('Error setting program property:', error)
            toast.error('Failed to load program')
          } finally {
            setLoadingProgram(false)
          }
        }, 100) // Small delay to ensure the element is ready
      } catch (error) {
        console.error('Error parsing program data:', error)
        toast.error('Failed to parse program data')
        setLoadingProgram(false)
      }
    } else {
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
          // For custom lit elements, we need to directly set the property
          console.log('Attempting to clear program')

          // Use setTimeout to ensure the element is fully initialized
          setTimeout(() => {
            try {
              // Try to use the updateProgram method first
              if (typeof editor.updateProgram === 'function') {
                editor.updateProgram(null)
                console.log('Program cleared successfully using updateProgram method')
              } else if (typeof editor.setProgram === 'function') {
                editor.setProgram(null)
                console.log('Program cleared successfully using setProgram method')
              } else {
                // Fallback to direct property assignment
                editor.program = null
                console.log('Program cleared successfully using property assignment')
              }
            } catch (error) {
              console.error('Error clearing program:', error)
              toast.error('Failed to clear program')
            }
          }, 100) // Small delay to ensure the element is ready
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
