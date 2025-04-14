import { useInstances } from '@/context/InstancesContext'
import { Serie } from '@nivo/line'
import { getColorBlindScheme } from './color-schemes/color-impaired'
import { forwardRef } from 'react'

interface LineChartLegendProps {
  data: Serie[]
  className?: string
}

export const LineChartLegend = forwardRef<HTMLDivElement, LineChartLegendProps>(({ data, className }: LineChartLegendProps, ref) => {
    const { getInstanceById, getParameterByIds } = useInstances();
    const colors = getColorBlindScheme();
  
    const parsedLegends = data.map((serie, index) => {
      const [parameterID, instanceID] = String(serie.id).split(' ');
      const instance = getInstanceById(Number(instanceID));
      const parameter = getParameterByIds(Number(instanceID), Number(parameterID));
  
      const colorIndex = index % colors.length;
  
      return {
        instance: instance ? `${instance.userIdentifier}` : instanceID,
        parameter: parameter ? `${parameter.label || parameter.denotation}` : parameterID,
        key: `${instanceID} ${parameterID}`,
        color: colors[colorIndex],
      };
    });
  
    return (
      <div ref={ref} className={`flex flex-wrap justify-center gap-2 ${className}`}>
        {parsedLegends.map((legend) => (
          <div key={legend.key} className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: legend.color }}></div>
            <span className="text-xs font-semibold">
              {legend.instance} {'-'}
            </span>
            <span className="text-xs">{legend.parameter}</span>
          </div>
        ))}
      </div>
    );
  });
  