import React from 'react'
import styles from './Homepage.module.scss'
import HomepageGraphics from '../../../resources/images/homepage-graphics.jpg'

const Homepage: React.FC = () => {
  return (
    <div className={styles.homepage}>
      <h1>SfPDfSD – System for Processing Data from Smart Devices</h1>
      <p>a Bachelor thesis project of Michal Bureš</p>
      <img width={1024} height={1024} src={HomepageGraphics} alt="Homepage graphics" />
      <p>Graphics generated using DALL·E</p>
    </div>
  )
}

export default Homepage
