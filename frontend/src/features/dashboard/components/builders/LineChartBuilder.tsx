import React, { useState } from "react";
import { ResponsiveLine } from "@nivo/line";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

export interface LineChartBuilderProps {
  onDataSubmit: (data: any) => void;
}

export function LineChartBuilder({ onDataSubmit }: LineChartBuilderProps) {
  // TODO: Disable top/right axis upon mounting, but keep the configuration
  const initialChartConfig = {
    margin: { top: 10, right: 10, bottom: 50, left: 50 },
    xScale: { type: "point" },
    yScale: {
      type: "linear",
      min: "auto",
      max: "auto",
      stacked: true,
      reverse: false,
    },
    animate: true,
    yFormat: " >-.2f",
    axisBottom: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: "transportation",
      legendOffset: 36,
      truncateTickAt: 0,
      legendPosition: "middle",
    },
    axisLeft: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: "count",
      legendOffset: -40,
      truncateTickAt: 0,
      legendPosition: "middle",
    },
    // axisRight: {
    //     tickSize: 5,
    //     tickPadding: 5,
    //     tickRotation: 0,
    //     legend: 'count',
    //     legendOffset: 40,
    //     truncateTickAt: 0,
    //     legendPosition: 'middle'
    // },
    // axisTop: {
    //     tickSize: 5,
    //     tickPadding: 5,
    //     tickRotation: 0,
    //     legend: 'transportation',
    //     legendOffset: -30,
    //     truncateTickAt: 0,
    //     legendPosition: 'middle'
    // },
    pointSize: 10,
    pointColor: { theme: "background" },
    pointBorderWidth: 2,
    pointBorderColor: { from: "serieColor" },
    pointLabel: "data.yFormatted",
    pointLabelYOffset: -12,
    enableTouchCrosshair: true,
    useMesh: true,
    enableGridX: true,
    enableGridY: true,
  };

  const [chartConfig, setChartConfig] = useState(initialChartConfig);

  const handleConfigChange = (property: string, value: any) => {
    const newConfig = {
      ...chartConfig,
      [property]: value,
    };
    setChartConfig(newConfig);
    onDataSubmit(newConfig);
  };

  const [jsonInput, setJsonInput] = useState(
    JSON.stringify(chartConfig, null, 2)
  );

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
  };

  const handleJsonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedData = JSON.parse(jsonInput);
      setChartConfig(parsedData);
      console.log("Parsed Data:", parsedData);
    } catch (error) {
      console.error("Invalid JSON:", error);
    }
  };

  const data = [
    {
      id: "temperature",
      color: "hsl(118, 70%, 50%)",
      data: [
        { x: 10, y: 213 },
        { x: 20, y: 209 },
        { x: 34, y: 126 },
        { x: 40, y: 207 },
        { x: -4, y: 83 },
        { x: 12, y: 101 },
        { x: 4, y: 63 },
        { x: 8, y: 67 },
      ],
    },
  ];

  return (
    <div>
      <Card className="h-[200px] w-full">
        <ResponsiveLine
          data={data}
          margin={chartConfig.margin}
          xScale={chartConfig.xScale as any}
          yScale={chartConfig.yScale as any}
          animate={chartConfig.animate}
          yFormat={chartConfig.yFormat}
          axisBottom={chartConfig.axisBottom}
          axisLeft={chartConfig.axisLeft}
          // axisRight={chartConfig.axisRight}
          // axisTop={chartConfig.axisTop}
          pointSize={chartConfig.pointSize}
          pointColor={chartConfig.pointColor}
          pointBorderWidth={chartConfig.pointBorderWidth}
          pointBorderColor={chartConfig.pointBorderColor}
          pointLabel={chartConfig.pointLabel}
          pointLabelYOffset={chartConfig.pointLabelYOffset}
          enableTouchCrosshair={chartConfig.enableTouchCrosshair}
          useMesh={chartConfig.useMesh}
          enableGridX={chartConfig.enableGridX}
          enableGridY={chartConfig.enableGridY}
        />
      </Card>
      <div className="flex gap-4 w-full mt-2">
        <Label className="w-full">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              X-Axis Legend
              <Checkbox
                checked={chartConfig.axisBottom.tickSize > 0}
                onCheckedChange={(e) => {
                  // e is a boolean
                  if (e) {
                    handleConfigChange(
                      "axisBottom",
                      initialChartConfig.axisBottom
                    );
                  } else {
                    handleConfigChange("axisBottom", "null");
                  }
                  console.log("Show X-Axis:", e);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              X-Axis Grid
              <Checkbox
                checked={chartConfig.enableGridX}
                onCheckedChange={(e) => {
                  // e is a boolean
                  handleConfigChange("enableGridX", e);
                }}
              />
            </div>
          </div>
          <Input
            type="text"
            disabled={chartConfig.axisBottom == "null"}
            placeholder={chartConfig.axisBottom.legend}
            onChange={(e) =>
              handleConfigChange("axisBottom", {
                ...chartConfig.axisBottom,
                legend: e.target.value,
              })
            }
            className="w-full"
          />
        </Label>
      </div>
      <div className="flex gap-4 w-full mt-2">
        <Label className="w-full">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              Y-Axis Legend
              <Checkbox
                checked={chartConfig.axisLeft.tickSize > 0}
                onCheckedChange={(e) => {
                  // e is a boolean
                  if (e) {
                    handleConfigChange("axisLeft", initialChartConfig.axisLeft);
                  } else {
                    handleConfigChange("axisLeft", "null");
                  }
                  console.log("Show X-Axis:", e);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              Y-Axis Grid
              <Checkbox
                checked={chartConfig.enableGridY}
                onCheckedChange={(e) => {
                  // e is a boolean
                  handleConfigChange("enableGridY", e);
                }}
              />
            </div>
          </div>
          <Input
            type="text"
            disabled={chartConfig.axisLeft == "null"}
            placeholder={chartConfig.axisLeft.legend}
            onChange={(e) =>
              handleConfigChange("axisLeft", {
                ...chartConfig.axisLeft,
                legend: e.target.value,
              })
            }
            className="w-full"
          />
        </Label>
      </div>
      <div className="flex gap-4 w-full mt-2">
        <Label>
          Point Size
          <Input
            type="number"
            value={chartConfig.pointSize}
            onChange={(e) =>
              handleConfigChange("pointSize", Number(e.target.value))
            }
          />
        </Label>
      </div>
      {/* <div>
                <label>
                    JSON Data:
                    <textarea value={jsonInput} onChange={handleJsonChange} rows={10} cols={50} />
                </label>
            </div>
            <button onClick={handleJsonSubmit}>Update Visualization</button>
        </div> */}
      {/* TODO: Remove */}
      <Button onClick={() => setChartConfig(initialChartConfig)}>Reset</Button>
    </div>
  );
}
