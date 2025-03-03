import { useState, useEffect, useMemo, useRef } from "react";
import styled from "styled-components";

// https://github.com/plouc/nivo/issues/580

const ToolTipContainer = styled.div<{ $offsetHorizontal: number; $offsetVertical: number }>`
    position: relative;
    left: ${(props) => props.$offsetHorizontal}px;
    right: 0;
    top: ${(props) => props.$offsetVertical}px;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: center;
    background-color: white;
    border-radius: 5px;
    padding: 8px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); /* Corrected property */
    z-index: 1000;
    font-size: 12px;
    line-height: 16px;
`;

export interface NonOverflowTooltipProps {
    point: { x: number; y: number };
    container: React.RefObject<HTMLDivElement> | null;
    children: React.ReactNode;
}

export function NonOverflowTooltip(props: NonOverflowTooltipProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState<{
        width: number;
        height: number;
    }>({ width: 0, height: 0 });
    const [tooltipSize, setTooltipSize] = useState<{
        width: number;
        height: number;
    }>({ width: 0, height: 0 });

    // dynamically get the size of the container
    useEffect(() => {
        const container = props.container?.current;
        if (container) {
            const { width, height } = container.getBoundingClientRect();
            setContainerSize({ width, height });
        }
    }, [setContainerSize, props.container]);

    // dynamically get the size of the tooltip
    useEffect(() => {
        const tooltip = ref.current;
        if (tooltip) {
            const { width, height } = tooltip.getBoundingClientRect();
            setTooltipSize({ width, height });
        }
    }, [setTooltipSize]);

    const offsetHorizontal = useMemo(() => {
        // only show it to the right of the pointer when we are close to the left edge
        if (props.point.x < tooltipSize.width) {
            return tooltipSize.width / 2;
        }

        // only show it to the left of the pointer when we are close to the right edge
        const rightEdge = containerSize.width - props.point.x;
        if (rightEdge < tooltipSize.width) {
            return -(tooltipSize.width / 2);
        }

        return 0;
    }, [tooltipSize.width, props.point.x, containerSize.width]);

    const offsetVertical = useMemo(() => {
        // only show it above the pointer when we are close to the bottom edge

        if (props.point.y < tooltipSize.height) {
            return tooltipSize.height + 30;
        }

        return 0;
    }, [tooltipSize.height, props.point.y, containerSize.height]);

    return (
        <ToolTipContainer
            ref={ref}
            $offsetHorizontal={offsetHorizontal}
            $offsetVertical={offsetVertical}
        >
            {props.children}
        </ToolTipContainer>
    );
}