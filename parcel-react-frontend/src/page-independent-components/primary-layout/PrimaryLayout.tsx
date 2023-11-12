import React from 'react'
import { Outlet } from 'react-router-dom'
import CustomLinkButton from '../custom-link-button/CustomLinkButton'
import styles from './PrimaryLayout.module.scss'

const PrimaryLayout: React.FC = () => {
  return (
    <div className={styles.outerContainer}>
      <div className={styles.sidePanel}>
        <CustomLinkButton route="/" text="Homepage" iconIdentifier="home" />
        <CustomLinkButton route="/device-types" text="Device types" iconIdentifier="home_iot_device" />
        <CustomLinkButton route="/apollo-sandbox" text="Apollo Sandbox" iconIdentifier="labs" />
      </div>
      <div className={styles.outletContainer}>
        <Outlet />
      </div>
    </div>
  )
}

export default PrimaryLayout
