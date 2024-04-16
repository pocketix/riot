import React from 'react'
import styles from './styles.module.scss'
import { Alert, LinearProgress } from '@mui/material'

interface StandardContentPageProps {
  pageTitle: string
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
  children: React.ReactNode
}

const genericErrorMessage: string =
  'The system encountered an error! ' + 'Consider checking browser console and application logs for more information... ' + 'One can also try to refresh the page as it may help in some cases...'

const StandardContentPageTemplate: React.FC<StandardContentPageProps> = (props) => {
  return (
    <div className={styles.standardContentPage}>
      <h1>{props.pageTitle}</h1>
      <div className={styles.statusBar}>
        {props.anyLoadingOccurs && <LinearProgress />}
        {props.anyErrorOccurred && <Alert severity="error">{genericErrorMessage}</Alert>}
      </div>
      {props.children}
    </div>
  )
}

export default StandardContentPageTemplate
