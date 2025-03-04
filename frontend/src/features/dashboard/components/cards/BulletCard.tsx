import { Container, DragHandle } from "../../../../styles/dashboard/CardGlobal";
import { AiOutlineDrag } from "react-icons/ai";
import { ResponsiveBullet } from '@nivo/bullet';
import styled from 'styled-components';
// import { Layout } from '@/types/Layout';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ItemDeleteAlertDialog } from './ItemDeleteAlertDialog';
import { Layout } from 'react-grid-layout';
import { AccessibilityContainer } from './AccessibilityContainer';
import GlobalStyles from "@/styles/GlobalStyles";
import { useDarkMode } from "@/context/DarkModeContext";
import { lightTheme, darkTheme } from "./ChartThemes";
import { ToolTipContainer } from "./ChartGlobals";

// Styled components
export const BulletContainer = styled.div<{ $editModeEnabled?: boolean }>`
    position: relative;
    margin: 0;
    padding: 0 8px 0 8px;
    width: 100%;
    height: 100%;
    max-height: 75px;
    display: flex;
    opacity: ${props => props.$editModeEnabled ? 0.25 : 1};
    transition: opacity 0.3s;
    border-radius: 12px;
`;

interface BulletCardProps {
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

export const BulletCard = ({ cardID, title, layout, setLayout, cols, breakPoint, editModeEnabled, handleDeleteItem, width, height, setHighlightedCardID }: BulletCardProps) => {
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
            "id": "temp.",
            "ranges": [
                41,
                5,
                93,
                0,
                100
            ],
            "measures": [
                64
            ],
            "markers": [
                44
            ]
        }
    ];

    return (
        <Container key={cardID} className={`${cardID}`}>
            {editModeEnabled &&
                <DragHandle>
                    <AiOutlineDrag className="drag-handle w-[40px] h-[40px] p-1 bg-white rounded-lg border-2" />
                </DragHandle>
            }
            {editModeEnabled && (
                <ItemDeleteAlertDialog onSuccess={() => handleDeleteItem(cardID)} />
            )}
            <div className="pl-4 pt-2 font-semibold">{title}</div>
            <BulletContainer ref={containerRef} $editModeEnabled={editModeEnabled}>
                <ResponsiveBullet
                    data={data}
                    margin={{ top: 5, right: 10, bottom: 30, left: 10 }}
                    spacing={46}
                    titleAlign="start"
                    titleOffsetX={-70}
                    titleOffsetY={-10}
                    measureSize={0.2}
                    rangeColors="nivo"
                    theme={isDarkMode ? darkTheme : lightTheme}
                    tooltip={() => {
                        return (
                            <ToolTipContainer $offsetHorizontal={0} $offsetVertical={0} $isDarkMode={isDarkMode}>
                                <div className="flex flex-col">
                                    <div>
                                        <span>Value: </span><span className='font-bold'>{data[0].measures}</span>
                                    </div>
                                    <div>
                                        <span>Target: </span><span className='font-bold'>{data[0].markers}</span>
                                    </div>
                                </div>
                            </ToolTipContainer>
                        )
                    }}
                />
            </BulletContainer>
            {
                editModeEnabled &&
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
            {
                highlight === 'width' && (
                    <>
                        {(!isAtRightEdge && (item?.w !== item?.maxW)) && <div style={{ width: `${width}px` }} className={`h-full absolute top-0 left-full ${highlight ? 'opacity-50' : 'opacity-0'} transition-opacity duration-200 bg-green-400 rounded-r-lg`} />}
                        {((item?.w !== 1) && (item?.w !== item?.minW)) && <div style={{ width: `${width}px` }} className={`h-full absolute top-0 right-0  ${highlight ? 'opacity-50' : 'opacity-0'} transition-opacity duration-200 bg-red-400 rounded-r-lg`} />}
                    </>
                )
            }
            {
                highlight === 'height' && (
                    <>
                        {(item?.h !== item?.maxH) && <div style={{ height: `${height}px` }} className={`w-full absolute top-full left-0 ${highlight ? 'opacity-50' : 'opacity-0'} transition-opacity duration-200 bg-green-400 rounded-b-lg`} />}
                        {((item?.h !== item?.minH) && (item?.h !== 1)) && <div style={{ height: `${height}px` }} className={`w-full absolute bottom-0 left-0 ${highlight ? 'opacity-50' : 'opacity-0'} transition-opacity duration-200 bg-red-400 rounded-b-lg`} />}
                    </>
                )
            }

        </Container >
    );
};