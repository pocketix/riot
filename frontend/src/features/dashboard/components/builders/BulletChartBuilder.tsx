import { useEffect, useState } from 'react';
import { ResponsiveBullet } from '@nivo/bullet';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

export interface BulletChartBuilderProps {
    onDataSubmit: (data: any) => void;
    parameterName: string;
}

export function BulletChartBuilder({ onDataSubmit, parameterName }: BulletChartBuilderProps) {
    const parameterNameMock = document.getElementById('parameterMock');

    const initialChartConfig = {
        margin: { top: 10, right: 10, bottom: 30, left: 50 },
        titleAlign: "start",
        titleOffsetX: -20,
        measureSize: 0.2,
        animate: true,
        minValue: 0,
        id: parameterName,
        ranges: [20, 54, 94, 0, 5, 120],
        markers: [110]
    };

    // Calculate the parameter name width and adjust the left margin accordingly
    useEffect(() => {
        if (parameterNameMock) {
            const width = parameterNameMock.offsetWidth;
            setChartConfig(prevConfig => ({
                ...prevConfig,
                margin: { ...prevConfig.margin, left: width + 10 }
            }));
        }
    }, [parameterNameMock]);

    const [chartConfig, setChartConfig] = useState(initialChartConfig);
    const [newRange, setNewRange] = useState({ lower: '', upper: '' });
    const [newMarker, setNewMarker] = useState('');

    const handleConfigChange = (property: string, value: any) => {
        const newConfig = {
            ...chartConfig,
            [property]: value
        };
        setChartConfig(newConfig);
    };

    const handleAddRange = () => {
        const lower = parseFloat(newRange.lower);
        const upper = parseFloat(newRange.upper);
        if (!isNaN(lower) && !isNaN(upper)) {
            setChartConfig(prevConfig => ({
                ...prevConfig,
                ranges: [...prevConfig.ranges, lower, upper]
            }));
            setNewRange({ lower: '', upper: '' });
        }
    };

    const handleRemoveRange = (index: number) => {
        setChartConfig(prevConfig => ({
            ...prevConfig,
            ranges: prevConfig.ranges.filter((_, i) => i !== index * 2 && i !== index * 2 + 1)
        }));
        console.log('Removed range:', index);
        console.log('New ranges:', chartConfig.ranges);
    };

    const handleAddMarker = () => {
        const marker = parseFloat(newMarker);
        if (!isNaN(marker)) {
            setChartConfig(prevConfig => ({
                ...prevConfig,
                markers: [...prevConfig.markers, marker]
            }));
            setNewMarker('');
        }
    };

    const handleRemoveMarker = (index: number) => {
        setChartConfig(prevConfig => ({
            ...prevConfig,
            markers: prevConfig.markers.filter((_, i) => i !== index)
        }));
    };

    const dataBullet = [
        {
            id: chartConfig.id,
            ranges: chartConfig.ranges,
            measures: [106],
            markers: chartConfig.markers
        },
    ];

    return (
        <div className='w-full'>
            <span className='absolute top-0 left-1/2 transform -translate-x-1/2 text-[11px] font-semibold invisible' id='parameterMock'>{parameterName}</span>
            <Card className='h-[75px] w-full'>
                <div className='h-full w-full scale-[0.9] sm:scale-100'>
                    <ResponsiveBullet
                        data={dataBullet}
                        margin={chartConfig.margin}
                        animate={chartConfig.animate}
                        titleOffsetX={chartConfig.titleOffsetX}
                        measureSize={chartConfig.measureSize}
                        minValue={chartConfig.minValue}
                    />
                </div>
            </Card>
            <div className='w-full grid sm:grid-cols-2 gap-4 mt-2'>
                <Label>
                    Margin Bottom
                    <Input
                        type="number"
                        value={chartConfig.margin.bottom}
                        onChange={(e) => handleConfigChange('margin', { ...chartConfig.margin, bottom: Number(e.target.value) })}
                    />
                </Label>
                <Label>
                    Margin Left
                    <Input
                        type="number"
                        value={chartConfig.margin.left}
                        onChange={(e) => handleConfigChange('margin', { ...chartConfig.margin, left: Number(e.target.value) })}
                    />
                </Label>
            </div>
            <div className='w-full grid sm:grid-cols-2 grid-cols-1 gap-4 mt-2'>
                <Label>
                    Title Offset X
                    <div className="flex items-center">
                        <Button onClick={() => handleConfigChange('titleOffsetX', chartConfig.titleOffsetX - 1)}>-</Button>
                        <Input
                            type="number"
                            value={chartConfig.titleOffsetX}
                            onChange={(e) => handleConfigChange('titleOffsetX', Number(e.target.value))}
                            className="mx-2"
                        />
                        <Button onClick={() => handleConfigChange('titleOffsetX', chartConfig.titleOffsetX + 1)}>+</Button>
                    </div>
                </Label>
                <Label>
                    Measure Bar Size
                    <Input
                        type="number"
                        step={0.1}
                        min={0.1}
                        max={1}
                        value={chartConfig.measureSize}
                        onChange={(e) => handleConfigChange('measureSize', Number(e.target.value))}
                    />
                </Label>
                {/* <Label>
                    Min Value
                    <Input
                        type="number"
                        value={chartConfig.minValue}
                        onChange={(e) => handleConfigChange('minValue', Number(e.target.value))}
                    />
                </Label> */}
            </div>
            <div className='w-full mt-2'>
                <h3 className='font-semibold'>Ranges</h3>
                <div className='w-full flex flex-row grow items-center gap-2 mt-1'>
                    {chartConfig.ranges.reduce<number[][]>((acc, _, i, arr) => {
                        if (i % 2 === 0) {
                            const range = arr.slice(i, i + 2);
                            if (range[0] > range[1]) {
                                [range[0], range[1]] = [range[1], range[0]];
                            }
                            acc.push(range);
                        }
                        return acc;
                    }, []).map((range, index) => (
                        <div key={index} className='flex items-center gap-2 bg-gray-200 p-2 pt-0 pb-0 rounded-xl'>
                            <span className='font-semibold'>{range[0]}</span> - <span className='font-semibold'>{range[1]}</span> <Button onClick={() => handleRemoveRange(index)} className='p-1 h-7 text-red-600 font-bold' variant={"ghost"} size={"sm"}>x</Button>
                        </div>
                    ))}
                </div>
                <div className='flex gap-2 mt-2'>
                    <Input
                        type="number"
                        placeholder="Lower bound"
                        value={newRange.lower}
                        onChange={(e) => setNewRange({ ...newRange, lower: e.target.value })}
                    />
                    <Input
                        type="number"
                        placeholder="Upper bound"
                        value={newRange.upper}
                        onChange={(e) => setNewRange({ ...newRange, upper: e.target.value })}
                    />
                    <Button onClick={handleAddRange}>Add Range</Button>
                </div>
            </div>
            <div className='w-full mt-2'>
                <h3 className='font-semibold'>Markers</h3>
                <div className='flex flex-row grow items-center gap-2 mt-1'>
                    {chartConfig.markers.map((marker, index) => (
                        <div key={index} className='flex items-center bg-gray-200 p-2 pt-0 pb-0 rounded-xl'>
                            <span className='font-semibold'>{marker}</span> <Button onClick={() => handleRemoveMarker(index)} className='p-1 h-7 text-red-600 font-bold' variant={"ghost"} size={"sm"}>x</Button>
                        </div>
                    ))}
                </div>
                <div className='flex gap-2 mt-2'>
                    <Input
                        type="number"
                        placeholder="Marker"
                        value={newMarker}
                        onChange={(e) => setNewMarker(e.target.value)}
                    />
                    <Button onClick={handleAddMarker}>Add Marker</Button>
                </div>
            </div>
            <Button className='flex justify-center mt-4 w-3/4 mx-auto'
                onClick={() => onDataSubmit(chartConfig)}>Submit</Button>
        </div >
    );
}