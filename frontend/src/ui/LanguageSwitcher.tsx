import { useTranslation } from 'react-i18next'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu' // Ensure correct import path
import { Button } from '@/components/ui/button'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'cz', label: 'Čeština' }
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const changeLanguage = (newLanguage: string) => {
    i18n.changeLanguage(newLanguage)
    localStorage.setItem('language', newLanguage)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default">{languages.find((lang) => lang.code === i18n.language)?.label || 'Select Language'}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map(({ code, label }) => (
          <DropdownMenuItem key={code} onClick={() => changeLanguage(code)}>
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
