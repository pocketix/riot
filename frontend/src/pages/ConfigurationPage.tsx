import React from 'react'
import StandardContentPageTemplate from '../page-independent-components/StandardContentPageTemplate'

const ConfigurationPage: React.FC = () => (
  <StandardContentPageTemplate pageTitle="System configuration" anyLoadingOccurs={false} anyErrorOccurred={false}>
    <h2>MQTT configuration</h2>
    <hr className="h-[3px] w-3/5 bg-[#dcdcdc]" />
    <p className="mb-3">Unfortunately, actual MQTT configuration is not yet implemented, so currently this page just displays the hard-coded defaults...</p>
    <p>
      Broker URL: <strong>mqtt://mosquitto:1883</strong> – Eclipse Mosquitto MQTT broker running in Docker in the same network as the '<strong>MQTT preprocessor</strong>' service
    </p>
    <p>
      Method of authentication: <strong>Basic (username and password)</strong>
    </p>
    <p>
      Username: <strong>admin</strong>
    </p>
    <p>
      Password: <strong>password</strong>
    </p>
    <p>
      Client ID: <strong>bp-bures-SfPDfSD-MQTT-preprocessor</strong>
    </p>
    <p>
      Topic: <strong>topic</strong>
    </p>
  </StandardContentPageTemplate>
)

export default ConfigurationPage
