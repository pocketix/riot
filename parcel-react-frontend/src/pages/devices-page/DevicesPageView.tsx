import React from 'react'
import { DevicesQuery } from '../../generated/graphql'
import StandardContentPageTemplate from '../../page-independent-components/standard-content-page-template/StandardContentPageTemplate'
import GenericCardTemplate from '../../page-independent-components/generic-card-template/GenericCardTemplate'

interface DeviceTypesPageViewProps {
  devicesQueryData: DevicesQuery
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const DevicesPageView: React.FC<DeviceTypesPageViewProps> = (props) => {
  return (
    <StandardContentPageTemplate pageTitle="Devices" anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred}>
      <h2>Currently registered devices</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {props.devicesQueryData &&
          props.devicesQueryData.devices.map((device) => (
            <GenericCardTemplate
              headerContent={<></>}
              bodyContent={
                <>
                  <div>
                    <p>
                      Name: <strong>{device.name}</strong>
                    </p>
                    <p>
                      UID: <strong>{device.uid}</strong>
                    </p>
                    <p>
                      Type denotation: <strong>{device.type.denotation}</strong>
                    </p>
                  </div>
                </>
              }
            />
          ))}
      </div>
    </StandardContentPageTemplate>
  )
}

export default DevicesPageView
