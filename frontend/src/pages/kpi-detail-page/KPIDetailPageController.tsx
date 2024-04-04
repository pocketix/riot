import React, {useState} from 'react'
import KPIDetailPageView from './KPIDetailPageView'
import {
  AtomNodeType,
  EditableTreeNodeDataModel,
  LogicalOperationNodeType,
  NodeType
} from "./components/editable-tree/EditableTree";

export interface KPIModel extends EditableTreeNodeDataModel {
  id: string
  userIdentifier: string
}

const KPIDetailPageController: React.FC = () => {
  const [kpi, setKPI] = useState<KPIModel>({
    id: "1",
    userIdentifier: "some KPI",
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
  })
  return <KPIDetailPageView kpi={kpi} />
}

export default KPIDetailPageController
