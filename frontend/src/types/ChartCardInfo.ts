import { AxisProps } from "@nivo/axes";
import { Box, DatumValue, ValueFormat } from "@nivo/core";
import { ScaleSpec } from "@nivo/scales";
import { Sizing } from "./CardGeneral";

export interface ChartCardInfo {
    cardTitle: string;
    sizing?: Sizing;
    toolTip: {
        x: string;
        y: string;
    };
    margin: Box;
    xScale: ScaleSpec;
    yScale: ScaleSpec;
    xFormat: ValueFormat<DatumValue>;
    yFormat: ValueFormat<DatumValue>;
    animate: boolean;
    axisBottom: AxisProps;
    axisLeft: AxisProps;
    pointSize: number;
    pointColor?: any;
    pointBorderWidth?: number;
    pointBorderColor?: any;
    enableGridX: boolean;
    enableGridY: boolean;
}