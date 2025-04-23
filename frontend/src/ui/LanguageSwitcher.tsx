import { useTranslation } from 'react-i18next'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu' // Ensure correct import path
import { Button } from '@/components/ui/button'
import { useMediaQuery } from 'react-responsive'
import { breakpoints } from '@/styles/Breakpoints'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'cs', label: 'Čeština' }
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const isMobile = useMediaQuery({ maxWidth: parseInt(breakpoints.sm.replace('px', '')) })

  const changeLanguage = (newLanguage: string) => {
    i18n.changeLanguage(newLanguage)
    localStorage.setItem('language', newLanguage)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size={isMobile ? 'sm' : undefined} variant="default">
          {languages.find((lang) => lang.code === i18n.language)?.label || 'Select Language'}
        </Button>
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
