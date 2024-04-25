import React, { useEffect, useState } from 'react'
import { Alert, LinearProgress } from '@mui/material'

interface StandardContentPageProps {
  pageTitle: string
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
  children: React.ReactNode
}

const StandardContentPageTemplate: React.FC<StandardContentPageProps> = (props) => {
  const [pageTitleShown, setPageTitleShown] = useState(false)
  const [statusBarContentsShown, setStatusBarContentsShown] = useState(false)
  const [mainContentsShown, setMainContentsShown] = useState(false)

  useEffect(() => {
    const pageTitleTimeout = setTimeout(() => setPageTitleShown(true), 100)
    const statusBarContentsTimeout = setTimeout(() => setStatusBarContentsShown(true), 200)
    const mainContentsTimeout = setTimeout(() => setMainContentsShown(true), 100)
    return () => {
      clearTimeout(pageTitleTimeout)
      clearTimeout(statusBarContentsTimeout)
      clearTimeout(mainContentsTimeout)
    }
  }, [])

  return (
    <div className="flex flex-col gap-4 p-5">
      <h1 className="self-center">{pageTitleShown ? props.pageTitle : ''}</h1>
      <div className="flex h-20 flex-col justify-center">
        {statusBarContentsShown && props.anyLoadingOccurs && <LinearProgress />}
        {statusBarContentsShown && props.anyErrorOccurred && (
          <Alert severity="error">The system encountered an error! Consider checking browser console and application logs for more information...</Alert>
        )}
      </div>
      {mainContentsShown && props.children}
    </div>
  )
}

export default StandardContentPageTemplate
