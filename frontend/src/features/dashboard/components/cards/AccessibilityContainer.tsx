import { Layout } from "react-grid-layout";
import { FaLongArrowAltDown, FaLongArrowAltUp, FaLongArrowAltLeft, FaLongArrowAltRight } from "react-icons/fa";
import { Arrow, ArrowContainer } from "@/styles/dashboard/CardGlobal";
import { moveWidget } from '@/lib/dashboard/LayoutArrows';
import { ResizePopover } from "./ResizePopover";
import { TbBorderBottomPlus, TbBorderRightPlus } from "react-icons/tb";
import { useMemo, useState } from "react";

export interface AccessibilityContainerProps {
    cols: { lg: number, md: number, sm: number, xs: number, xxs: number };
    layout: Layout[];
    setLayout: (layout: Layout[]) => void;
    breakPoint: string;
    cardID: string;
    setHighlight: (highlight: 'width' | 'height' | null) => void;
    isAtRightEdge: boolean;
    isAtLeftEdge: boolean;
    isAtTopEdge: boolean;
    isBottom: boolean;
}

export const AccessibilityContainer = ({ cols, layout, setLayout, breakPoint, cardID, setHighlight, isAtRightEdge, isAtLeftEdge, isAtTopEdge, isBottom }: AccessibilityContainerProps) => {
    const [disabled, setDisabled] = useState(false);

    // Get the item from the layout
    // TODO: Make this better
    const item = useMemo(() => layout.find(item => item.i === cardID), [layout, cardID]);

    const handleMove = (direction: 'left' | 'right' | 'up' | 'down' | 'widthminus' | 'widthplus' | 'heightminus' | 'heightplus') => {
        if (disabled) return;
        setDisabled(true);

        const columnCount = cols[breakPoint as keyof typeof cols] || cols.lg; // Fallback to lg if invalid
        console.log('Old layout:', layout);
        const newLayout = moveWidget(layout, cardID, direction, columnCount);
        console.log('New layout:', newLayout);
        setLayout(newLayout);

        setTimeout(() => {
            setDisabled(false);
        }, 1000);
    };

    return (
        <ArrowContainer>
            <Arrow onClick={() => handleMove('left')} disabled={disabled || isAtLeftEdge}>
                <FaLongArrowAltLeft />
            </Arrow>
            <Arrow onClick={() => handleMove('up')} disabled={disabled || isAtTopEdge}>
                <FaLongArrowAltUp />
            </Arrow>
            <Arrow onClick={() => handleMove('down')} disabled={disabled || !isBottom}>
                <FaLongArrowAltDown />
            </Arrow>
            <Arrow onClick={() => handleMove('right')} disabled={disabled || isAtRightEdge}>
                <FaLongArrowAltRight />
            </Arrow>
            <ResizePopover
                onDecrease={() => handleMove('widthminus')}
                onIncrease={() => handleMove('widthplus')}
                maxValue={item?.maxW}
                minValue={item?.minW || 1}
                currentValue={item?.w}
                rightEdge={isAtRightEdge}
                disabled={disabled}
                highlight="width"
                setHighlight={setHighlight}
            >
                <TbBorderRightPlus />
            </ResizePopover>
            <ResizePopover
                onDecrease={() => handleMove('heightminus')}
                onIncrease={() => handleMove('heightplus')}
                maxValue={item?.maxH}
                minValue={item?.minH || 1}
                currentValue={item?.h}
                disabled={disabled}
                highlight="height"
                setHighlight={setHighlight}
            >
                <TbBorderBottomPlus />
            </ResizePopover>
        </ArrowContainer>
    )
}