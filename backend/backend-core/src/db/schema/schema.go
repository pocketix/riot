package schema

type KPIDefinitionEntity struct {
	ID                  uint32         `gorm:"column:id;primarykey;not null"`
	SDTypeSpecification string         `gorm:"column:sd_type_specification;not null"`
	UserIdentifier      string         `gorm:"column:user_identifier;not null"`
	RootNodeID          *uint32        `gorm:"column:root_node_id;not null"`
	RootNode            *KPINodeEntity `gorm:"foreignKey:RootNodeID"`
}

func (KPIDefinitionEntity) TableName() string {
	return "kpi_definitions"
}

type KPINodeEntity struct {
	ID           uint32         `gorm:"column:id;primarykey;not null"`
	ParentNodeID *uint32        `gorm:"column:parent_node_id"`
	ParentNode   *KPINodeEntity `gorm:"foreignKey:ParentNodeID"`
}

func (KPINodeEntity) TableName() string {
	return "kpi_nodes"
}

type LogicalOperationKPINodeEntity struct {
	NodeID *uint32        `gorm:"column:node_id;primarykey;not null"`
	Node   *KPINodeEntity `gorm:"foreignKey:NodeID"`
	Type   string         `gorm:"column:type;not null"`
}

func (LogicalOperationKPINodeEntity) TableName() string {
	return "logical_operation_kpi_nodes"
}

type AtomKPINodeEntity struct {
	NodeID                   *uint32        `gorm:"column:node_id;primarykey;not null"`
	Node                     *KPINodeEntity `gorm:"foreignKey:NodeID"`
	SDParameterSpecification string         `gorm:"column:sd_parameter_specification;not null"`
	Type                     string         `gorm:"column:type;not null"`
	StringReferenceValue     *string        `gorm:"column:string_reference_value"`
	BooleanReferenceValue    *bool          `gorm:"column:boolean_reference_value"`
	NumericReferenceValue    *float64       `gorm:"column:numeric_reference_value"`
}

func (AtomKPINodeEntity) TableName() string {
	return "atom_kpi_nodes"
}

type SDTypeEntity struct {
	ID         uint32              `gorm:"column:id;primarykey;not null"`
	Denotation string              `gorm:"column:denotation;not null;index"` // Denotation is an indexed field
	Parameters []SDParameterEntity `gorm:"foreignKey:SDTypeID"`
}

func (SDTypeEntity) TableName() string {
	return "sd_types"
}

type SDParameterEntity struct {
	ID         uint32 `gorm:"column:id;primarykey;not null"`
	SDTypeID   uint32 `gorm:"column:sd_type_id;not null"`
	Denotation string `gorm:"column:denotation;not null"`
	Type       string `gorm:"column:type;not null"`
}

func (SDParameterEntity) TableName() string {
	return "sd_parameters"
}

type SDInstanceEntity struct {
	ID              uint32       `gorm:"column:id;primarykey;not null"`
	UID             string       `gorm:"column:uid;not null;index"` // UID is an indexed field
	ConfirmedByUser bool         `gorm:"column:confirmed_by_user;not null"`
	UserIdentifier  string       `gorm:"column:user_identifier;not null"`
	SDTypeID        uint32       `gorm:"column:sd_type_id"`
	SDType          SDTypeEntity `gorm:"foreignKey:SDTypeID"`
}

func (SDInstanceEntity) TableName() string {
	return "sd_instances"
}

type KPIFulfillmentCheckResultEntity struct {
	ID              uint32               `gorm:"column:id;primarykey;not null"`
	KPIDefinitionID *uint32              `gorm:"column:kpi_definition_id;not null"`
	KPIDefinition   *KPIDefinitionEntity `gorm:"foreignKey:KPIDefinitionID"`
	SDInstanceID    *uint32              `gorm:"column:sd_instance_id;not null"`
	SDInstance      *SDInstanceEntity    `gorm:"foreignKey:SDInstanceID"`
	Fulfilled       bool                 `gorm:"column:fulfilled;not null"`
}

func (KPIFulfillmentCheckResultEntity) TableName() string {
	return "kpi_fulfillment_check_results"
}
