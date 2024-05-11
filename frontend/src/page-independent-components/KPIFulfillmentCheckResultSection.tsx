import React, { useMemo } from 'react'

export enum KPIFulfillmentState {
  Fulfilled,
  Unfulfilled,
  Unknown
}

export interface KPIDefinitionData {
  id: string
  userIdentifier: string
}

export interface KPIFulfillmentCheckResultData {
  kpiDefinitionData: KPIDefinitionData
  kpiFulfillmentState: KPIFulfillmentState
}

interface KPIFulfillmentCheckResultSectionProps {
  kpiFulfillmentCheckResultsData: KPIFulfillmentCheckResultData[]
}

const KPIFulfillmentCheckResultSection: React.FC<KPIFulfillmentCheckResultSectionProps> = (props) => {
  return (
    <div className="mt-2 flex flex-row flex-wrap gap-x-3 gap-y-1 rounded-[5px] border-2 border-gray-500 bg-[#dcdcdc] px-3 py-1">
      {props.kpiFulfillmentCheckResultsData
        .sort((a, b) => parseInt(a.kpiDefinitionData.id, 10) - parseInt(b.kpiDefinitionData.id, 10))
        .map((kpiFulfillmentCheckResultData) => (
          <KPIFulfillmentCheckResultLabel
            kpiDefinitionID={kpiFulfillmentCheckResultData.kpiDefinitionData.id}
            kpiDefinitionUserIdentifier={kpiFulfillmentCheckResultData.kpiDefinitionData.userIdentifier}
            kpiFulfillmentState={kpiFulfillmentCheckResultData.kpiFulfillmentState}
          />
        ))}
    </div>
  )
}

interface KPIFulfillmentCheckResultLabelProps {
  kpiDefinitionID: string
  kpiDefinitionUserIdentifier: string
  kpiFulfillmentState: KPIFulfillmentState
}

const KPIFulfillmentCheckResultLabel: React.FC<KPIFulfillmentCheckResultLabelProps> = (props) => {
  const bgColorHex: string = useMemo(() => {
    switch (props.kpiFulfillmentState) {
      case KPIFulfillmentState.Fulfilled:
        return '#4fff00'
      case KPIFulfillmentState.Unfulfilled:
        return '#ff0000'
      case KPIFulfillmentState.Unknown:
        return '#a8a8a8'
    }
  }, [props.kpiFulfillmentState])
  return (
    <div key={props.kpiDefinitionID} className="flex items-center gap-1 rounded-[5px] border-[1px] border-[#5d5d5d] px-2 py-2">
      <p className="font-bold">{props.kpiDefinitionUserIdentifier}</p>
      <div
        className="h-5 w-5 rounded-full border-[1px] border-black"
        style={{
          backgroundColor: bgColorHex
        }}
      />
    </div>
  )
}

export default KPIFulfillmentCheckResultSection
