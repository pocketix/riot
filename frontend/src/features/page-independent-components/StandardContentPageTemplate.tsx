import React, { useEffect, useMemo, useState } from 'react'
import { Alert, CircularProgress } from '@mui/material'

export interface StandardContentTemplatePageProps {
  pageTitle: string
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
  children: React.ReactNode
}

const StandardContentPageTemplate: React.FC<StandardContentTemplatePageProps> = (props) => {
  const [contentShown, setContentShown] = useState(false)

  useEffect(() => {
    const contentShownTimeout = setTimeout(() => setContentShown(true), 50)
    return () => clearTimeout(contentShownTimeout)
  }, [])

  const content = useMemo(() => {
    if (!contentShown) {
      return <></>
    }
    if (props.anyLoadingOccurs) {
      return (
        <div className="mt-[100px] self-center">
          <CircularProgress size={100} />
        </div>
      )
    }
    if (props.anyErrorOccurred) {
      return (
        <div className="mt-[100px] self-center">
          <Alert severity="error" sx={{ fontSize: 20, alignItems: 'center' }}>
            The system encountered an error! Consider checking the console and application logs for more information...
          </Alert>
        </div>
      )
    }
    return props.children
  }, [contentShown, props.anyLoadingOccurs, props.anyErrorOccurred, props.children])

  return (
    <div className="flex flex-col gap-4 p-5 bg-white text-black">
      <h1 className="self-center">{props.pageTitle}</h1>
      {content}
    </div>
  )
}

export default StandardContentPageTemplate
