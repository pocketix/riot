package dbModel

import (
	"gorm.io/gorm"
	"time"
)

type KPIDefinitionEntity struct {
	ID                                         uint32                                      `gorm:"column:id;primaryKey"`
	UserIdentifier                             string                                      `gorm:"column:user_identifier;not null"`
	RootNodeID                                 *uint32                                     `gorm:"column:root_node_id;not null"`
	RootNode                                   *KPINodeEntity                              `gorm:"foreignKey:RootNodeID"`
	SDTypeID                                   uint32                                      `gorm:"column:sd_type_id;not null"`
	SDType                                     SDTypeEntity                                `gorm:"foreignKey:SDTypeID;constraint:OnDelete:CASCADE"`
	SDInstanceMode                             string                                      `gorm:"column:sd_instance_mode;not null"`
	KPIFulfillmentCheckResults                 []KPIFulfillmentCheckResultEntity           `gorm:"foreignKey:KPIDefinitionID;constraint:OnDelete:CASCADE"`
	SDInstanceKPIDefinitionRelationshipRecords []SDInstanceKPIDefinitionRelationshipEntity `gorm:"foreignKey:KPIDefinitionID;constraint:OnDelete:CASCADE"`
}

func (KPIDefinitionEntity) TableName() string {
	return "kpi_definitions"
}

type KPINodeEntity struct {
	ID           uint32         `gorm:"column:id;primaryKey;not null"`
	ParentNodeID *uint32        `gorm:"column:parent_node_id"`
	ParentNode   *KPINodeEntity `gorm:"foreignKey:ParentNodeID;constraint:OnDelete:CASCADE"`
}

func (KPINodeEntity) TableName() string {
	return "kpi_nodes"
}

type LogicalOperationKPINodeEntity struct {
	NodeID *uint32        `gorm:"column:node_id;primaryKey;not null"`
	Node   *KPINodeEntity `gorm:"foreignKey:NodeID;constraint:OnDelete:CASCADE"`
	Type   string         `gorm:"column:type;not null"`
}

func (LogicalOperationKPINodeEntity) TableName() string {
	return "logical_operation_kpi_nodes"
}

type AtomKPINodeEntity struct {
	NodeID                *uint32           `gorm:"column:node_id;primaryKey;not null"`
	Node                  *KPINodeEntity    `gorm:"foreignKey:NodeID;constraint:OnDelete:CASCADE"`
	SDParameterID         uint32            `gorm:"column:sd_parameter_id;not null"`
	SDParameter           SDParameterEntity `gorm:"foreignKey:SDParameterID;constraint:OnDelete:CASCADE"`
	Type                  string            `gorm:"column:type;not null"`
	StringReferenceValue  *string           `gorm:"column:string_reference_value"`
	BooleanReferenceValue *bool             `gorm:"column:boolean_reference_value"`
	NumericReferenceValue *float64          `gorm:"column:numeric_reference_value"`
}

func (AtomKPINodeEntity) TableName() string {
	return "atom_kpi_nodes"
}

type SDTypeEntity struct {
	ID         uint32              `gorm:"column:id;primaryKey;not null"`
	Denotation string              `gorm:"column:denotation;not null;index"` // Denotation is a separately indexed field
	Parameters []SDParameterEntity `gorm:"foreignKey:SDTypeID;constraint:OnDelete:CASCADE"`
	//Commands   []SDCommandEntity   `gorm:"foreignKey:SDTypeID;constraint:OnDelete:CASCADE"`
}

func (SDTypeEntity) TableName() string {
	return "sd_types"
}

type SDParameterEntity struct {
	ID         uint32 `gorm:"column:id;primaryKey;not null"`
	SDTypeID   uint32 `gorm:"column:sd_type_id;not null"`
	Denotation string `gorm:"column:denotation;not null"`
	Type       string `gorm:"column:type;not null"`
}

func (SDParameterEntity) TableName() string {
	return "sd_parameters"
}

type SDInstanceEntity struct {
	ID                                         uint32                                      `gorm:"column:id;primaryKey;not null"`
	UID                                        string                                      `gorm:"column:uid;not null;index"` // UID is a separately indexed field
	ConfirmedByUser                            bool                                        `gorm:"column:confirmed_by_user;not null"`
	UserIdentifier                             string                                      `gorm:"column:user_identifier;not null"`
	SDTypeID                                   uint32                                      `gorm:"column:sd_type_id"`
	SDType                                     SDTypeEntity                                `gorm:"foreignKey:SDTypeID;constraint:OnDelete:CASCADE"`
	GroupMembershipRecords                     []SDInstanceGroupMembershipEntity           `gorm:"foreignKey:SDInstanceID;constraint:OnDelete:CASCADE"`
	KPIFulfillmentCheckResults                 []KPIFulfillmentCheckResultEntity           `gorm:"foreignKey:SDInstanceID;constraint:OnDelete:CASCADE"`
	SDInstanceKPIDefinitionRelationshipRecords []SDInstanceKPIDefinitionRelationshipEntity `gorm:"foreignKey:SDInstanceID;constraint:OnDelete:CASCADE"`
	Commands                                   []SDCommandEntity                           `gorm:"foreignKey:SDInstanceID;constraint:OnDelete:CASCADE"` // Nová vazba na konkrétní příkazy
}

func (SDInstanceEntity) TableName() string {
	return "sd_instances"
}

type KPIFulfillmentCheckResultEntity struct {
	KPIDefinitionID uint32 `gorm:"column:kpi_definition_id;primaryKey;not null"`
	SDInstanceID    uint32 `gorm:"column:sd_instance_id;primaryKey;not null"`
	Fulfilled       bool   `gorm:"column:fulfilled;not null"`
}

func (KPIFulfillmentCheckResultEntity) TableName() string {
	return "kpi_fulfillment_check_results"
}

type SDInstanceGroupEntity struct {
	ID                     uint32                            `gorm:"column:id;primaryKey;not null"`
	UserIdentifier         string                            `gorm:"column:user_identifier;not null"`
	GroupMembershipRecords []SDInstanceGroupMembershipEntity `gorm:"foreignKey:SDInstanceGroupID;constraint:OnDelete:CASCADE"`
}

func (SDInstanceGroupEntity) TableName() string {
	return "sd_instance_groups"
}

type SDInstanceGroupMembershipEntity struct {
	SDInstanceGroupID uint32 `gorm:"column:sd_instance_group_id;primaryKey;not null;index"` // SDInstanceGroupID is a separately indexed field
	SDInstanceID      uint32 `gorm:"column:sd_instance_id;primaryKey;not null"`
}

func (SDInstanceGroupMembershipEntity) TableName() string {
	return "sd_instance_group_membership"
}

type SDInstanceKPIDefinitionRelationshipEntity struct {
	KPIDefinitionID uint32 `gorm:"column:kpi_definition_id;primaryKey;not null"`
	SDInstanceID    uint32 `gorm:"column:sd_instance_id;primaryKey;not null"`
	SDInstanceUID   string `gorm:"column:sd_instance_uid;not null"`
}

// UserEntity represents a user of the application who can log in using various OAuth providers.
type UserEntity struct {
	ID        uint           `gorm:"primaryKey"` // Primary key for the user
	CreatedAt time.Time      // Timestamp of creation
	UpdatedAt time.Time      // Timestamp of the last update
	DeletedAt gorm.DeletedAt `gorm:"index"` // Soft delete field

	// Basic User Information
	Username     string `gorm:"uniqueIndex;size:100"` // Unique username for the user
	Email        string `gorm:"uniqueIndex;size:255"` // User's email address (unique)
	Name         string `gorm:"size:255"`             // Full name of the user
	ProfileImage string `gorm:"size:500"`             // URL to the user's profile image

	// OAuth Information
	Provider     string    `gorm:"size:50"`        // OAuth provider name (e.g., google, github)
	ProviderID   string    `gorm:"size:255;index"` // Unique ID provided by the OAuth provider
	OAuthToken   string    `gorm:"size:500"`       // OAuth access token
	RefreshToken string    `gorm:"size:500"`       // OAuth refresh token, if available
	TokenExpiry  time.Time // Expiration time of the OAuth token

	// Additional Metadata
	LastLoginAt time.Time                   // Timestamp of the last login
	IsActive    bool                        `gorm:"default:true"` // Whether the user's account is active
	Invocations []SDCommandInvocationEntity `gorm:"foreignKey:UserId;constraint:OnDelete:CASCADE"`
}

func (UserEntity) TableName() string {
	return "user"
}

type SDCommandEntity struct {
	ID           uint32                      `gorm:"column:id;primaryKey;not null"`
	SDInstanceID uint32                      `gorm:"column:sd_instance_id;not null"` // Nová vazba na konkrétní SDInstance
	Denotation   string                      `gorm:"column:denotation;not null"`
	Type         string                      `gorm:"column:type;not null"`
	Payload      string                      `gorm:"column:payload;not null"`
	Invocations  []SDCommandInvocationEntity `gorm:"foreignKey:ID;constraint:OnDelete:CASCADE"`
}

func (SDCommandEntity) TableName() string {
	return "command"
}

type SDCommandInvocationEntity struct {
	ID             uint32 `gorm:"column:id;primaryKey;not null"`
	InvocationTime time.Time
	Payload        string `gorm:"column:payload;not null"`
	UserId         uint32 `gorm:"column:user_id"`
	CommandID      uint32 `gorm:"column:command_id;not null"` // Nová vazba na SDCommandEntity
}

func (SDCommandInvocationEntity) TableName() string {
	return "command_invocation"
}
