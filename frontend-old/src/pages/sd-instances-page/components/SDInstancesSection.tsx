import { SdInstancesPageDataQuery } from '../../../generated/graphql'
import React, { useMemo } from 'react'
import SDInstanceCard from './SDInstanceCard'
import { AsynchronousBiConsumerFunction, AsynchronousConsumerFunction } from '../../../util'

interface ConfirmedSDInstancesSectionProps {
  sdInstancePageData: SdInstancesPageDataQuery
  confirmedByUserRequirement: boolean
  updateUserIdentifierOfSdInstance: AsynchronousBiConsumerFunction<string, string>
  confirmSdInstance: AsynchronousConsumerFunction<string>
}

const SDInstancesSection: React.FC<ConfirmedSDInstancesSectionProps> = (props) => {
  const confirmedByUserRequirement = props.confirmedByUserRequirement
  const sdInstances = useMemo(() => {
    if (props.sdInstancePageData) {
      return props.sdInstancePageData.sdInstances.filter((sdInstance) => sdInstance.confirmedByUser === confirmedByUserRequirement)
    } else {
      return []
    }
  }, [props.sdInstancePageData, props.confirmedByUserRequirement])
  return (
    <div className="flex flex-wrap gap-5">
      {sdInstances.length === 0 && <p>No SD instances of this kind...</p>}
      {sdInstances
        .slice()
        .sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
        .map((sdInstance) => {
          return (
            <SDInstanceCard
              key={sdInstance.id}
              id={sdInstance.id}
              userIdentifier={sdInstance.userIdentifier}
              uid={sdInstance.uid}
              sdTypeDenotation={sdInstance.type.denotation}
              sdTypeID={sdInstance.type.id}
              confirmedByUser={confirmedByUserRequirement}
              updateUserIdentifierOfSdInstance={props.updateUserIdentifierOfSdInstance}
              confirmSdInstance={props.confirmSdInstance}
              sdInstancePageData={props.sdInstancePageData}
            />
          )
        })}
    </div>
  )
}

export default SDInstancesSection
