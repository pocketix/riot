import React from 'react'
import CustomLinkButton from '../page-independent-components/CustomLinkButton'

const FallbackPage: React.FC = () => (
  <div className="flex flex-col items-center text-center">
    <h1>There is nothing to be found on this URL...</h1>
    <CustomLinkButton route="/" text="Return to Homepage" iconIdentifier="arrow_back" />
  </div>
)

export default FallbackPage
