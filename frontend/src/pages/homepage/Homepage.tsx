import React from 'react'
import styles from './styles.module.scss'
import HomepageGraphics from '../../../resources/images/homepage-graphics.jpg'
import { Alert } from '@mui/material'

const Homepage: React.FC = () => {
  return (
    <div className={styles.homepage}>
      <h1>System for Processing Data from Smart Devices</h1>
      <p>
        a Bachelor thesis project of <a href="https://www.linkedin.com/in/michalbures-og/">Michal Bureš</a>
      </p>
      <img className={styles.homepageGraphics} width={1448} height={724} src={HomepageGraphics} alt="Homepage graphics" />
      <div className={styles.correctSystemOperationNotice}>
        <Alert severity="info">Please ensure that all backend services are running! If not, the system cannot function to full degree...</Alert>
      </div>
    </div>
  )
}

export default Homepage
