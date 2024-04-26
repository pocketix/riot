import React from 'react'

interface KPIFulfillmentCheckResultLabelProps {
  id: string
  kpiUserIdentifier: string
  fulfilled: boolean
}

const KPIFulfillmentCheckResultLabel: React.FC<KPIFulfillmentCheckResultLabelProps> = (props) => (
  <div key={props.id} className="flex items-center gap-2 py-2">
    <p className="font-bold">{props.kpiUserIdentifier}</p>
    <div className={`h-5 w-5 rounded-full border-[1px] border-black ${props.fulfilled ? 'bg-green-500' : 'bg-red-500'}`} />
  </div>
)

export default KPIFulfillmentCheckResultLabel
