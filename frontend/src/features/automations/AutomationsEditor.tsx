import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMutation, useQuery } from '@apollo/client'
import { CREATE_VPL_PROGRAM } from '@/graphql/automations/Mutations'
import { GET_VPL_PROGRAMS } from '@/graphql/automations/Queries'
import { toast } from 'sonner'

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
  const [isSaving, setIsSaving] = useState(false)

  // GraphQL query to fetch all VPL programs
  const { data: programsData, loading: programsLoading, refetch: refetchPrograms } = useQuery(GET_VPL_PROGRAMS)

  // GraphQL mutation for creating a VPL program
  const [createVPLProgram] = useMutation(CREATE_VPL_PROGRAM, {
    onCompleted: (data) => {
      toast.success(`Program "${data.createVPLProgram.name}" saved successfully`)
      setIsSaving(false)
      setProgramName('') // Clear the name field after successful save
      refetchPrograms() // Refresh the programs list
    },
    onError: (error) => {
      toast.error(`Failed to save program: ${error.message}`)
      setIsSaving(false)
    }
  })

  useEffect(() => {
    // Set up event listener for program changes
    const editor = editorRef.current
    if (editor) {
      const handleProgramChange = (e: CustomEvent) => {
        // Log program changes to console
        console.log('Program changed:', e.detail)
      }

      editor.addEventListener('change', handleProgramChange as EventListener)

      return () => {
        editor.removeEventListener('change', handleProgramChange as EventListener)
      }
    }
  }, [])

  const handleSaveProgram = () => {
    if (!programName.trim()) {
      toast.error('Please enter a program name')
      return
    }

    const editor = editorRef.current as any
    if (editor) {
      // Get the program from the editor
      const program = editor.program
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
        <Label htmlFor="program-name">Program Name</Label>
        <Input
          id="program-name"
          value={programName}
          onChange={(e) => setProgramName(e.target.value)}
          placeholder="Enter program name"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          className="bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80"
          onClick={handleLoadPrograms}
          disabled={programsLoading}
        >
          {programsLoading ? 'Loading...' : 'Load Programs'}
        </Button>
        <Button
          onClick={handleSaveProgram}
          disabled={isSaving || !programName.trim()}
        >
          {isSaving ? 'Saving...' : 'Save Program'}
        </Button>
      </div>
      {/* @ts-ignore */}
      <vpl-editor ref={editorRef}></vpl-editor>
    </div>
  )
}
