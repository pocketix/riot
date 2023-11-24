import React from 'react'
import GenericCardTemplate from '../../../../page-independent-components/generic-card-template/GenericCardTemplate'

interface DeviceWidgetProps {
  name: string
  uid: string
  typeDenotation: string
}

const DeviceWidget: React.FC<DeviceWidgetProps> = (props) => {
  return (
    <GenericCardTemplate
      headerContent={<></>}
      bodyContent={
        <>
          <div>
            <p>
              Name: <strong>{props.name}</strong>
            </p>
            <p>
              UID: <strong>{props.uid}</strong>
            </p>
            <p>
              Type denotation: <strong>{props.typeDenotation}</strong>
            </p>
          </div>
        </>
      }
    />
  )
}

export default DeviceWidget
