import React from 'react'
import EditableTree, { AtomNodeType, EditableTreeNodeDataModel, LogicalOperationNodeType, NodeType } from './components/editable-tree/EditableTree'
import StandardContentPageTemplate from '../../page-independent-components/standard-content-page-template/StandardContentPageTemplate'

const KPIDetailPageView: React.FC = () => {
  const editableTreeNodeData: EditableTreeNodeDataModel = {
    name: '',
    attributes: {
      nodeType: NodeType.LogicalOperationNode,
      logicalOperationNodeType: LogicalOperationNodeType.AND
    },
    children: [
      {
        name: '',
        attributes: {
          nodeType: NodeType.AtomNode,
          atomNodeType: AtomNodeType.NumericGEQ,
          atomNodeSDParameterSpecification: 'relay_0_temperature',
          atomNodeReferenceValue: 20
        },
        children: []
      },
      {
        name: '',
        attributes: {
          nodeType: NodeType.AtomNode,
          atomNodeType: AtomNodeType.NumericLEQ,
          atomNodeSDParameterSpecification: 'relay_0_temperature',
          atomNodeReferenceValue: 24
        },
        children: [
          {
            name: '',
            attributes: {
              nodeType: NodeType.NewNode
            },
            children: []
          }
        ]
      },
      {
        name: '',
        attributes: {
          nodeType: NodeType.NewNode
        },
        children: [
          {
            name: '',
            attributes: {
              nodeType: NodeType.NewNode
            },
            children: []
          },
          {
            name: '',
            attributes: {
              nodeType: NodeType.NewNode
            },
            children: []
          },
          {
            name: '',
            attributes: {
              nodeType: NodeType.NewNode
            },
            children: [
              {
                name: '',
                attributes: {
                  nodeType: NodeType.NewNode
                },
                children: []
              },
              {
                name: '',
                attributes: {
                  nodeType: NodeType.NewNode
                },
                children: []
              }
            ]
          }
        ]
      }
    ]
  }
  return (
    <StandardContentPageTemplate pageTitle="KPI detail" anyLoadingOccurs={false} anyErrorOccurred={false}>
      <EditableTree editableTreeNodeData={editableTreeNodeData} />
    </StandardContentPageTemplate>
  )
}

export default KPIDetailPageView
