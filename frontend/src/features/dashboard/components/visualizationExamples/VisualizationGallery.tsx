import { ResponsiveBullet } from '@nivo/bullet'
import { ResponsiveLine } from '@nivo/line'
import styled from 'styled-components'
import { Card } from '../ui/card'
import { useDarkMode } from '@/context/DarkModeContext'
import { darkTheme, lightTheme } from '../cards/ChartThemes'

export const VisualizationGalleryContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    height: fit-content;
`

export interface VisualizationGalleryProps {
    setSelectedVisualization: (Visualization: string) => void
    selectedVisualization: string | null
}

export function VisualizationGallery({ setSelectedVisualization, selectedVisualization }: VisualizationGalleryProps) {
    const { isDarkMode } = useDarkMode();

    const dataLine = [
        {
            "id": "temperature",
            "color": "hsl(118, 70%, 50%)",
            "data": [
                {
                    "x": 10,
                    "y": 213
                },
                {
                    "x": 20,
                    "y": 209
                },
                {
                    "x": 34,
                    "y": 126
                },
                {
                    "x": 40,
                    "y": 207
                },
                {
                    "x": -4,
                    "y": 83
                },
                {
                    "x": 12,
                    "y": 101
                },
                {
                    "x": 4,
                    "y": 63
                },
                {
                    "x": 8,
                    "y": 67
                }
            ]
        },
    ];

    const dataBullet = [
        {
            "id": "",
            "ranges": [
                20,
                54,
                94,
                0,
                120
            ],
            "measures": [
                106
            ],
            "markers": [
                110
            ]
        },
    ];

    return (
        <VisualizationGalleryContainer>
            <Card className={`${selectedVisualization === "line" ? "border-2 border-blue-500" : "border-2"} h-[150px] box-border`} onClick={() => setSelectedVisualization("line")}>
                <ResponsiveLine
                    data={dataLine}
                    margin={{ top: 10, right: 20, bottom: 30, left: 35 }}
                    xScale={{ type: 'point' }}
                    yScale={{
                        type: 'linear',
                        min: 'auto',
                        max: 'auto',
                        stacked: true,
                        reverse: false
                    }}
                    animate={false}
                    yFormat=" >-.2f"
                    pointSize={5}
                    pointColor={{ theme: 'background' }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: 'serieColor' }}
                    pointLabel="data.yFormatted"
                    pointLabelYOffset={-12}
                    enableTouchCrosshair={true}
                    useMesh={false}
                    theme={isDarkMode ? darkTheme : lightTheme}
                />
            </Card>
            <Card className={`${selectedVisualization === "bullet" ? "border-2 border-blue-500" : "border-2"} h-[70px] box-border`} onClick={() => setSelectedVisualization("bullet")}>
                <ResponsiveBullet
                    data={dataBullet}
                    margin={{ top: 10, right: 10, bottom: 30, left: 10 }}
                    spacing={46}
                    titleAlign="start"
                    titleOffsetX={-30}
                    measureSize={0.2}
                    theme={isDarkMode ? darkTheme : lightTheme}
                    tooltip={() => null}
                />
            </Card>
        </VisualizationGalleryContainer>
    )
}
