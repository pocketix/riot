import React, { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import CustomLinkButton from '../custom-link-button/CustomLinkButton'
import styles from './styles.module.scss'

const PrimaryLayout: React.FC = () => {
  const location = useLocation()

  useEffect(() => {
    // TODO: Consider doing something when location changes...
  }, [location])

  return (
    <div className={styles.outerContainer}>
      <div className={styles.sidePanel}>
        <CustomLinkButton route="/" text="Homepage" iconIdentifier="home" />
        <CustomLinkButton route="/kpi-definitions" text="KPI definitions" iconIdentifier="rule" />
        <CustomLinkButton route="/sd-instances" text="SD instances" iconIdentifier="lightbulb" />
        <CustomLinkButton route="/sd-types" text="SD type definitions" iconIdentifier="home_iot_device" />
        <CustomLinkButton route="/apollo-sandbox" text="Apollo Sandbox" iconIdentifier="labs" />
      </div>
      <div className={styles.outletContainer}>
        <Outlet />
      </div>
    </div>
  )
}

export default PrimaryLayout
