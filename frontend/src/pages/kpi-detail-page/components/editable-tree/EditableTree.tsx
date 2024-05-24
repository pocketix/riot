import React, { useCallback, useEffect, useRef, useState } from 'react'
import { CustomNodeElementProps, Point, RawNodeDatum, Tree, TreeNodeDatum } from 'react-d3-tree'
import AtomNode from './AtomNode'
import LogicalOperationNode from './LogicalOperationNode'
import EditableTreeNodeBase from './EditableTreeNodeBase'
import { useResizeDetector } from 'react-resize-detector'
import { ConsumerFunction, TetraConsumerFunction } from '../../../../util'

export type EditableTreeSizeConfiguration = {
  graphOffsetOnXAxisInPixels: number
  graphOffsetOnYAxisInPixels: number
  nodeWidthInPixels: number
  nodeHeightInPixels: number
  foreignObjectOffsetOnXAxisInPixels: number
  foreignObjectOffsetOnYAxisInPixels: number
  foreignObjectWidthInPixels: number
  foreignObjectHeightInPixels: number
}

export type EditableTreeConfiguration = {
  siblingSeparation: number
  nonSiblingSeparation: number
  sizeConfiguration: EditableTreeSizeConfiguration
}

export const editableTreeConfiguration: EditableTreeConfiguration = {
  siblingSeparation: 1,
  nonSiblingSeparation: 1,
  sizeConfiguration: {
    graphOffsetOnXAxisInPixels: 0,
    graphOffsetOnYAxisInPixels: 0,
    nodeWidthInPixels: 350,
    nodeHeightInPixels: 140,
    foreignObjectOffsetOnXAxisInPixels: -125,
    foreignObjectOffsetOnYAxisInPixels: -40,
    foreignObjectWidthInPixels: 250,
    foreignObjectHeightInPixels: 80
  }
}

export enum NodeType {
  AtomNode,
  LogicalOperationNode,
  NewNode
}

export enum AtomNodeType {
  StringEQ,
  BooleanEQ,
  NumericEQ,
  NumericLT,
  NumericLEQ,
  NumericGT,
  NumericGEQ
}

export enum LogicalOperationNodeType {
  AND = 'AND',
  OR = 'OR',
  NOR = 'NOR'
}

export interface EditableTreeNodeDataModel extends RawNodeDatum {
  name: string
  attributes?: {
    nodeType: NodeType
    atomNodeType?: AtomNodeType
    atomNodeSDParameterID?: string
    atomNodeSDParameterSpecification?: string
    atomNodeReferenceValue?: string | boolean | number
    logicalOperationNodeType?: LogicalOperationNodeType
  }
  children?: EditableTreeNodeDataModel[]
}

interface EditableTreeProps {
  editableTreeNodeData: EditableTreeNodeDataModel
  initiateLogicalOperationNodeModification: ConsumerFunction<string>
  initiateAtomNodeModification: TetraConsumerFunction<string, string, AtomNodeType, string | number | boolean>
  initiateNewNodeCreation: ConsumerFunction<string>
}

const calculateTreeDepth = (node: EditableTreeNodeDataModel): number => {
  if (!node.children || node.children.length === 0) {
    return 1
  } else {
    const childDepths: number[] = node.children.map((child) => calculateTreeDepth(child))
    return 1 + Math.max(...childDepths)
  }
}

const calculateTreeHeightInPixels = (editableTreeNodeData: EditableTreeNodeDataModel): number => {
  const treeDepth: number = calculateTreeDepth(editableTreeNodeData)
  const foreignObjectHeightInPixels: number = editableTreeConfiguration.sizeConfiguration.foreignObjectHeightInPixels
  const nodeHeightInPixels: number = editableTreeConfiguration.sizeConfiguration.nodeHeightInPixels
  return treeDepth * foreignObjectHeightInPixels + (treeDepth - 1) * (nodeHeightInPixels - foreignObjectHeightInPixels)
}

const calculateTreeWidthInPixels = (node: EditableTreeNodeDataModel): number => {
  const nodeWidth: number = editableTreeConfiguration.sizeConfiguration.foreignObjectWidthInPixels
  const spaceBetweenNodes: number = editableTreeConfiguration.sizeConfiguration.nodeWidthInPixels - nodeWidth
  if (!node.children || node.children.length === 0) {
    return nodeWidth
  } else {
    const childWidths: number[] = node.children.map((child) => calculateTreeWidthInPixels(child))
    return childWidths.reduce((acc, item) => acc + item, 0) + (childWidths.length - 1) * spaceBetweenNodes
  }
}

const EditableTree: React.FC<EditableTreeProps> = (props) => {
  const [treeTranslate, setTreeTranslate] = useState<Point>({ x: 0, y: 0 })

  const renderTreeNodeBasedOnType = useCallback(
    (editableTreeNodeDataModel: EditableTreeNodeDataModel) => {
      switch (editableTreeNodeDataModel.attributes.nodeType) {
        case NodeType.NewNode:
          return (
            <EditableTreeNodeBase
              treeNodeContents={<p className="font-math text-[32px]">+</p>}
              onClick={() => {
                props.initiateNewNodeCreation(editableTreeNodeDataModel.name)
              }}
            />
          )
        case NodeType.AtomNode:
          const atomNodeType = editableTreeNodeDataModel.attributes.atomNodeType
          const sdParameterSpecification = editableTreeNodeDataModel.attributes.atomNodeSDParameterSpecification
          const referenceValue = editableTreeNodeDataModel.attributes.atomNodeReferenceValue
          return (
            <AtomNode
              type={atomNodeType}
              sdParameterSpecification={sdParameterSpecification}
              referenceValue={referenceValue}
              onClickHandler={() => {
                props.initiateAtomNodeModification(editableTreeNodeDataModel.name, sdParameterSpecification, atomNodeType, referenceValue)
              }}
            />
          )
        case NodeType.LogicalOperationNode:
          return (
            <LogicalOperationNode
              type={editableTreeNodeDataModel.attributes.logicalOperationNodeType}
              onClick={() => {
                props.initiateLogicalOperationNodeModification(editableTreeNodeDataModel.name)
              }}
            />
          )
      }
    },
    [props.initiateLogicalOperationNodeModification]
  )

  const renderCustomNode = useCallback(
    ({ nodeDatum }: CustomNodeElementProps) => {
      const nodeDataModel: EditableTreeNodeDataModel = nodeDatum as TreeNodeDatum & EditableTreeNodeDataModel
      return (
        <g className="node" strokeWidth={0}>
          <foreignObject
            x={editableTreeConfiguration.sizeConfiguration.foreignObjectOffsetOnXAxisInPixels}
            y={editableTreeConfiguration.sizeConfiguration.foreignObjectOffsetOnYAxisInPixels}
            width={editableTreeConfiguration.sizeConfiguration.foreignObjectWidthInPixels}
            height={editableTreeConfiguration.sizeConfiguration.foreignObjectHeightInPixels}
          >
            {renderTreeNodeBasedOnType(nodeDataModel)}
          </foreignObject>
        </g>
      )
    },
    [renderTreeNodeBasedOnType]
  )

  const updateTreePositionWithinContainer = useCallback(
    (containerWidth: number, containerHeight: number) => {
      const treeWidth: number = calculateTreeWidthInPixels(props.editableTreeNodeData) // TODO: Does not work in all cases...
      const treeHeight: number = calculateTreeHeightInPixels(props.editableTreeNodeData)
      const x: number = (containerWidth - treeWidth) / 2 + treeWidth / 2 // TODO: (treeWidth / 2) is not precise enough...
      const y: number = (containerHeight - treeHeight) / 2 + editableTreeConfiguration.sizeConfiguration.foreignObjectHeightInPixels / 2
      setTreeTranslate({ x: x, y: y })
    },
    [setTreeTranslate, calculateTreeHeightInPixels, props.editableTreeNodeData, editableTreeConfiguration.sizeConfiguration.foreignObjectHeightInPixels]
  )

  const { width, height, ref } = useResizeDetector({
    handleHeight: false,
    refreshMode: 'throttle',
    refreshRate: 100
  })

  const [treeShown, setTreeShown] = useState(false)
  const treeShownTimeoutRef = useRef(null)

  useEffect(() => {
    updateTreePositionWithinContainer(width, height)
    if (!treeShown) {
      treeShownTimeoutRef.current = setTimeout(() => {
        setTreeShown(true)
      }, 100)
    }
    return () => {
      if (treeShownTimeoutRef.current) {
        clearTimeout(treeShownTimeoutRef.current)
        treeShownTimeoutRef.current = null
      }
    }
  }, [width, height, treeShown, props.editableTreeNodeData])

  return (
    <div ref={ref} className="h-[600px] w-full border-2 border-[#8f8f8f]">
      {treeShown && (
        <Tree
          data={props.editableTreeNodeData}
          orientation="vertical"
          zoomable={false}
          translate={{
            x: treeTranslate.x,
            y: treeTranslate.y
          }}
          nodeSize={{
            x: editableTreeConfiguration.sizeConfiguration.nodeWidthInPixels,
            y: editableTreeConfiguration.sizeConfiguration.nodeHeightInPixels
          }}
          separation={{
            siblings: editableTreeConfiguration.siblingSeparation,
            nonSiblings: editableTreeConfiguration.nonSiblingSeparation
          }}
          renderCustomNodeElement={renderCustomNode}
          pathClassFunc={() => '!text-[#5d5d5d] !stroke-current !stroke-2'}
          initialDepth={calculateTreeDepth(props.editableTreeNodeData)}
        />
      )}
    </div>
  )
}

export default EditableTree
