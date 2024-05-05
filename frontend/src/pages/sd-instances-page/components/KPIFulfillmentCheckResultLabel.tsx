import React, { useMemo } from 'react'

export enum KPIFulfillmentCheckResultLabelState {
  Fulfilled,
  Unfulfilled,
  Unknown
}

interface KPIFulfillmentCheckResultLabelProps {
  id: string
  kpiUserIdentifier: string
  kpiFulfillmentCheckResultLabelState: KPIFulfillmentCheckResultLabelState
}

const KPIFulfillmentCheckResultLabel: React.FC<KPIFulfillmentCheckResultLabelProps> = (props) => {
  const bgColorHex: string = useMemo(() => {
    switch (props.kpiFulfillmentCheckResultLabelState) {
      case KPIFulfillmentCheckResultLabelState.Fulfilled:
        return '#4fff00'
      case KPIFulfillmentCheckResultLabelState.Unfulfilled:
        return '#ff0000'
      case KPIFulfillmentCheckResultLabelState.Unknown:
        return '#a8a8a8'
    }
  }, [props.kpiFulfillmentCheckResultLabelState])
  return (
    <div key={props.id} className="flex items-center gap-2 py-2">
      <p className="font-bold">{props.kpiUserIdentifier}</p>
      <div
        className="h-5 w-5 rounded-full border-[1px] border-black"
        style={{
          backgroundColor: bgColorHex
        }}
      />
    </div>
  )
}

export default KPIFulfillmentCheckResultLabel
