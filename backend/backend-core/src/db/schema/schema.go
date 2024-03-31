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
	ReferenceValue           string         `gorm:"column:reference_value;not null"`
}

func (AtomKPINodeEntity) TableName() string {
	return "atom_kpi_nodes"
}

type SDTypeEntity struct {
	ID         uint32              `gorm:"column:id;primarykey;not null"`
	Denotation string              `gorm:"column:denotation;not null"`
	Parameters []SDParameterEntity `gorm:"foreignKey:SDTypeID"`
}

func (SDTypeEntity) TableName() string {
	return "sd_types"
}

type SDParameterEntity struct {
	ID       uint32 `gorm:"column:id;primarykey;not null"`
	SDTypeID uint32 `gorm:"column:sd_type_id;not null"`
	Name     string `gorm:"column:name;not null"`
	Type     string `gorm:"column:type;not null"`
}

func (SDParameterEntity) TableName() string {
	return "sd_parameters"
}

type SDInstanceEntity struct {
	ID             uint32       `gorm:"column:id;primarykey;not null"`
	UID            string       `gorm:"column:uid;not null"`
	UserIdentifier string       `gorm:"column:user_identifier;not null"`
	SDTypeID       uint32       `gorm:"column:sd_type_id"`
	SDType         SDTypeEntity `gorm:"foreignKey:SDTypeID"`
}

func (SDInstanceEntity) TableName() string {
	return "sd_instances"
}
