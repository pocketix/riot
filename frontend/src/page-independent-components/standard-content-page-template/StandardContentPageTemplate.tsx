import React, { useEffect, useState } from 'react'
import styles from './styles.module.scss'
import { Alert, LinearProgress } from '@mui/material'

interface StandardContentPageProps {
  pageTitle: string
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
  children: React.ReactNode
}

const genericErrorMessage: string =
  'The system encountered an error! ' + 'Consider checking browser console and application logs for more information... ' + 'One can also try refreshing the page (F5) as it may help in some cases...'

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
  }, [setPageTitleShown, setStatusBarContentsShown, setMainContentsShown])

  return (
    <div className={styles.standardContentPage}>
      <h1>{pageTitleShown ? props.pageTitle : ''}</h1>
      <div className={styles.statusBar}>
        {statusBarContentsShown && props.anyLoadingOccurs && <LinearProgress />}
        {statusBarContentsShown && props.anyErrorOccurred && <Alert severity="error">{genericErrorMessage}</Alert>}
      </div>
      {mainContentsShown && props.children}
    </div>
  )
}

export default StandardContentPageTemplate
