import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Check, Pencil, XIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface EditableUserIdentifierProps {
  value: string
  onSave: (newValue: string) => void
  className?: string
  disabled?: boolean
}

export function EditableUserIdentifier(props: EditableUserIdentifierProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editorValue, setEditorValue] = useState(props.value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditorValue(props.value)
  }, [props.value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleStartEdit = () => {
    if (props.disabled) return
    setIsEditing(true)
  }

  const handleSave = () => {
    const trimmedValue = editorValue.trim()
    if (trimmedValue && trimmedValue !== props.value) {
      props.onSave(trimmedValue)
    } else {
      setEditorValue(props.value)
    }
    setIsEditing(false)
  }

  return (
    <div className={cn('group flex items-center gap-1', props.className)}>
      {isEditing ? (
        <div className="flex items-center">
          <Input
            ref={inputRef}
            type="text"
            value={editorValue}
            onChange={(e) => setEditorValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave()
              }
              if (e.key === 'Escape') {
                setEditorValue(props.value)
                setIsEditing(false)
              }
            }}
          />
          <div className="ml-2 flex gap-1">
            <Button size="icon" onClick={handleSave}>
              <Check />
            </Button>
            <Button
              size="icon"
              onClick={() => {
                setEditorValue(props.value)
                setIsEditing(false)
              }}
              variant="destructive"
            >
              <XIcon />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <h1 className="text-3xl font-bold">{props.value}</h1>
          <Button onClick={handleStartEdit} variant="ghost" size="icon" disabled={props.disabled}>
            <Pencil />
          </Button>
        </div>
      )}
    </div>
  )
}
