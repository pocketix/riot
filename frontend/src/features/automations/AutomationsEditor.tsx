import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

export default function AutomationsEditor() {
  const editorRef = useRef<HTMLElement>(null)

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
    const editor = editorRef.current as any
    if (editor) {
      // Get the program from the editor
      const program = editor.program
      console.log('Saved program:', program)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={handleSaveProgram}>Save Program</Button>
      </div>
      {/* @ts-ignore */}
      <vpl-editor ref={editorRef}></vpl-editor>
    </div>
  )
}
