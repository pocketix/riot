import { moveWidget } from '../../../../lib/dashboard/LayoutArrows';
import { Container, DragHandle } from "../../../../styles/dashboard/CardGlobal";
import { AiOutlineDrag } from "react-icons/ai";
import { ResponsiveLine, PointTooltipProps } from '@nivo/line';
import styled from 'styled-components';
// import { Layout } from '@/types/Layout';
import { useEffect, useMemo, useRef, useState } from 'react';
import { NonOverflowTooltip } from '../NonOverflowTooltip';
import { ItemDeleteAlertDialog } from './ItemDeleteAlertDialog';
import { Layout } from 'react-grid-layout';
import { AccessibilityContainer } from './AccessibilityContainer';
import { useDarkMode } from '@/context/DarkModeContext';
import { darkTheme, lightTheme } from './ChartThemes';

// Styled components
export const ChartContainer = styled.div<{ $editModeEnabled?: boolean }>`
    position: relative;
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-grow: 1;
    overflow-y: hidden;
    overflow-x: hidden;
    opacity: ${props => props.$editModeEnabled ? 0.25 : 1};
    transition: opacity 0.3s;
    border-radius: 12px;
`;

interface ChartCardProps {
    cardID: string;
    title: string;
    layout: Layout[];
    setLayout: (layout: Layout[]) => void;
    breakPoint: string;
    editModeEnabled: boolean;
    cols: { lg: number, md: number, sm: number, xs: number, xxs: number };
    handleDeleteItem: (id: string) => void;
    height: number;
    width: number;
    setHighlightedCardID: (id: string) => void;
}

export const ChartCard = ({ cardID, title, layout, setLayout, cols, breakPoint, editModeEnabled, handleDeleteItem, width, height, setHighlightedCardID }: ChartCardProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { isDarkMode } = useDarkMode();

    const [highlight, setHighlight] = useState<'width' | 'height' | null>(null);

    const item = useMemo(() => layout.find(item => item.i === cardID), [layout, cardID]);

    let isAtRightEdge = false;
    let isAtLeftEdge = false;
    let isAtTopEdge = false;
    let isBottom = false;

    if (item) {
        isAtRightEdge = useMemo(() => {
            return item?.x + item?.w === cols[breakPoint as keyof typeof cols];
        }, [item, cols, breakPoint]);

        isAtLeftEdge = useMemo(() => {
            return item?.x === 0;
        }, [item]);

        isAtTopEdge = useMemo(() => {
            return item?.y === 0;
        }, [item]);

        // Check if there are any items below
        isBottom = useMemo(() => {
            return layout.some(l => l.y === item.y + item.h && l.x < item.x + item.w && l.x + l.w > item.x);
        }, [layout, item]);

    }

    useEffect(() => {
        if (highlight)
            setHighlightedCardID(cardID);
    }, [cardID, highlight]);

    // calculate height and width from getboundingclientrect

    const data = [
        {
            "id": "temperature",
            "color": "hsl(118, 70%, 50%)",
            "data": [
                { "x": 10, "y": 213 },
                { "x": 20, "y": 209 },
                { "x": 34, "y": 126 },
                { "x": 40, "y": 207 },
                { "x": -4, "y": 83 },
                { "x": 12, "y": 101 },
                { "x": 4, "y": 63 },
                { "x": 8, "y": 67 }
            ]
        },
    ];

    const CustomTooltip = ({ point }: PointTooltipProps) => {
        return (
            <>
                {containerRef && (
                    <NonOverflowTooltip
                        point={{ x: point.x, y: point.y }}
                        isDarkMode={isDarkMode}
                        container={containerRef as React.RefObject<HTMLDivElement>}
                    >
                        <div>Time: <span className='font-bold'>{point.data.xFormatted}</span></div>
                        <div>Temperature: <span className='font-bold'>{point.data.yFormatted}</span></div>
                    </NonOverflowTooltip >
                )}
            </>
        );
    };

    return (
        <Container key={cardID} className={`${cardID}`}>
            {editModeEnabled &&
                <DragHandle>
                    <AiOutlineDrag className="drag-handle w-[40px] h-[40px] p-1 rounded-lg border-2" />
                </DragHandle>
            }
            {editModeEnabled && (
                <ItemDeleteAlertDialog onSuccess={() => handleDeleteItem(cardID)} />
            )}
            <div className="pl-4 pt-2 font-semibold">{title}</div>
            <ChartContainer ref={containerRef} $editModeEnabled={editModeEnabled}>
                <ResponsiveLine
                    data={data}
                    margin={{ top: 10, right: 20, bottom: 50, left: 60 }}
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
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'transportation',
                        legendOffset: 36,
                        legendPosition: 'middle',
                        truncateTickAt: 0
                    }}
                    axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'count',
                        legendOffset: -40,
                        legendPosition: 'middle',
                        truncateTickAt: 0
                    }}
                    pointSize={10}
                    pointColor={{ theme: 'background' }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: 'serieColor' }}
                    pointLabel="data.yFormatted"
                    pointLabelYOffset={-12}
                    enableTouchCrosshair={true}
                    useMesh={true}
                    tooltip={CustomTooltip}
                    theme={isDarkMode ? darkTheme : lightTheme}
                />
            </ChartContainer>
            {editModeEnabled &&
                <AccessibilityContainer
                    cols={cols}
                    layout={layout}
                    setLayout={setLayout}
                    breakPoint={breakPoint}
                    cardID={cardID}
                    setHighlight={setHighlight}
                    isAtRightEdge={isAtRightEdge}
                    isAtLeftEdge={isAtLeftEdge}
                    isAtTopEdge={isAtTopEdge}
                    isBottom={isBottom}
                />
            }
            {/* TODO: use styled components */}
            {highlight === 'width' && (
                <>
                    {(!isAtRightEdge && (item?.w !== item?.maxW)) && <div style={{ width: `${width}px` }} className={`h-full absolute top-0 left-full ${highlight ? 'opacity-50' : 'opacity-0'} transition-opacity duration-200 bg-green-400 rounded-r-lg`} />}
                    {((item?.w !== 1) && (item?.w !== item?.minW)) && <div style={{ width: `${width}px` }} className={`h-full absolute top-0 right-0  ${highlight ? 'opacity-50' : 'opacity-0'} transition-opacity duration-200 bg-red-400 rounded-r-lg`} />}
                </>
            )}
            {highlight === 'height' && (
                <>
                    {(item?.h !== item?.maxH) && <div style={{ height: `${height}px` }} className={`w-full absolute top-full left-0 ${highlight ? 'opacity-50' : 'opacity-0'} transition-opacity duration-200 bg-green-400 rounded-b-lg`} />}
                    {((item?.h !== item?.minH) && (item?.h !== 1)) && <div style={{ height: `${height}px` }} className={`w-full absolute bottom-0 left-0 ${highlight ? 'opacity-50' : 'opacity-0'} transition-opacity duration-200 bg-red-400 rounded-b-lg`} />}
                </>
            )}

        </Container >
    );
};