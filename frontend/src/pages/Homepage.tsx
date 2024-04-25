import React from 'react'
import HomepageGraphics from '../../resources/images/homepage-graphics.jpg'
import { Alert } from '@mui/material'

const Homepage: React.FC = () => (
  <div className="mt-10 flex flex-col items-center text-center">
    <h1>System for Processing Data from Smart Devices</h1>
    <p>
      a Bachelor thesis project of <a href="https://www.linkedin.com/in/michalbures-og/">Michal Bureš</a>
    </p>
    <img className="mt-12 rounded-[100px]" width={1448} height={724} src={HomepageGraphics} alt="Homepage graphics" />
    <div className="ml-3/10 mt-5 w-2/5">
      <Alert severity="info">Please ensure that all backend services are running! If not, the system cannot function to full degree...</Alert>
    </div>
  </div>
)

export default Homepage
