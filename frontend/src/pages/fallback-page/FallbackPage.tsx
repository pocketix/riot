import React from 'react'
import styles from './styles.module.scss'
import CustomLinkButton from '../../page-independent-components/custom-link-button/CustomLinkButton'

const FallbackPage: React.FC = () => {
  return (
    <div className={styles.fallbackPage}>
      <h1>There is nothing to be found on this URL...</h1>
      <CustomLinkButton route="/" text="Return to Homepage" iconIdentifier="arrow_back" />
    </div>
  )
}

export default FallbackPage
