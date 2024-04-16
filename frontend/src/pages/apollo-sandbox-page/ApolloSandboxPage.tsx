import React from 'react'
import styles from './styles.module.scss'
import { ApolloSandbox } from '@apollo/sandbox/react'

const ApolloSandboxPage: React.FC = () => {
  return <ApolloSandbox initialEndpoint="http://localhost:9090" allowDynamicStyles className={styles.apolloSandbox} />
}

export default ApolloSandboxPage
