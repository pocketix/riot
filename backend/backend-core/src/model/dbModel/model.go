package dbModel

import (
	"time"

	"gorm.io/gorm"
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
	Label      string              `gorm:"column:label"`
	Icon       string              `gorm:"column:icon"`
	Parameters []SDParameterEntity `gorm:"foreignKey:SDTypeID;constraint:OnDelete:CASCADE"`
	Commands   []SDCommandEntity   `gorm:"foreignKey:SDTypeID;constraint:OnDelete:CASCADE"`
}

func (SDTypeEntity) TableName() string {
	return "sd_types"
}

type SDParameterEntity struct {
	ID                  uint32                      `gorm:"column:id;primaryKey;not null"`
	SDTypeID            uint32                      `gorm:"column:sd_type_id;not null"`
	Denotation          string                      `gorm:"column:denotation;not null"`
	Label               string                      `gorm:"column:label"`
	Type                string                      `gorm:"column:type;not null"`
	SDParameterSnapshot []SDParameterSnapshotEntity `gorm:"foreignKey:SDParameterID;constraint:OnDelete:CASCADE"`
}

func (SDParameterEntity) TableName() string {
	return "sd_parameters"
}

type SDInstanceEntity struct {
	ID                                         uint32                                      `gorm:"column:id;primaryKey;not null"`
	UID                                        string                                      `gorm:"column:uid;not null;index"`
	ConfirmedByUser                            bool                                        `gorm:"column:confirmed_by_user;not null"`
	UserIdentifier                             string                                      `gorm:"column:user_identifier;not null"`
	SDTypeID                                   uint32                                      `gorm:"column:sd_type_id"`
	SDType                                     SDTypeEntity                                `gorm:"foreignKey:SDTypeID;constraint:OnDelete:CASCADE"`
	GroupMembershipRecords                     []SDInstanceGroupMembershipEntity           `gorm:"foreignKey:SDInstanceID;constraint:OnDelete:CASCADE"`
	KPIFulfillmentCheckResults                 []KPIFulfillmentCheckResultEntity           `gorm:"foreignKey:SDInstanceID;constraint:OnDelete:CASCADE"`
	SDInstanceKPIDefinitionRelationshipRecords []SDInstanceKPIDefinitionRelationshipEntity `gorm:"foreignKey:SDInstanceID;constraint:OnDelete:CASCADE"`
	SDParameterSnapshot                        []SDParameterSnapshotEntity                 `gorm:"foreignKey:SDInstanceID;constraint:OnDelete:CASCADE"`
	CommandInvocations                         []SDCommandInvocationEntity                 `gorm:"foreignKey:SDInstanceID;constraint:OnDelete:CASCADE"` // Each instance has special command invocatios
}

func (SDInstanceEntity) TableName() string {
	return "sd_instances"
}

type SDParameterSnapshotEntity struct {
	SDInstanceID  uint32                           `gorm:"column:sd_instance_id;primaryKey;not null"`
	SDParameterID uint32                           `gorm:"column:sd_parameter_id;primaryKey;not null"`
	String        *string                          `gorm:"column:string"`
	Number        *float64                         `gorm:"column:number"`
	Boolean       *bool                            `gorm:"column:boolean"`
	UpdatedAt     time.Time                        `gorm:"column:updated_at;autoUpdateTime"`
	VPLPrograms   []VPLProgramSDSnapshotLinkEntity `gorm:"many2many:link;joinForeignKey:SDInstanceID,SDParameterID;joinReferences:ProgramID"`
}

func (SDParameterSnapshotEntity) TableName() string {
	return "sd_parameter_snapshots"
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

type SDInstanceKPIDefinitionRelationshipEntity struct { // TODO: Missing 'TableName' function, handle this across schema
	KPIDefinitionID uint32 `gorm:"column:kpi_definition_id;primaryKey;not null"`
	SDInstanceID    uint32 `gorm:"column:sd_instance_id;primaryKey;not null"`
	SDInstanceUID   string `gorm:"column:sd_instance_uid;not null"`
}

// UserEntity represents a user of the application who can log in using various OAuth providers.
type UserEntity struct {
	gorm.Model
	Username               string                      `gorm:"column:username;uniqueIndex"`
	Email                  string                      `gorm:"column:email;uniqueIndex"`
	Name                   *string                     `gorm:"column:name"`
	ProfileImageURL        *string                     `gorm:"column:profile_image_url"`
	OAuth2Provider         *string                     `gorm:"column:oauth2_provider;uniqueIndex:idx_oauth,priority:1"`
	OAuth2ProviderIssuedID *string                     `gorm:"column:oauth2_provider_issued_id;uniqueIndex:idx_oauth,priority:2"`
	LastLoginAt            *time.Time                  `gorm:"column:last_login_at"`
	Sessions               []UserSessionEntity         `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE"`
	Invocations            []SDCommandInvocationEntity `gorm:"foreignKey:UserId;constraint:OnDelete:CASCADE"`
	UserConfig             UserConfigEntity            `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE"`
}

func (UserEntity) TableName() string { // TODO: Standardize table names, e.g. 'user' × 'users'
	return "user"
}

type UserSessionEntity struct {
	gorm.Model                 // TODO: Standardize 'gorm.Model' usage: either use it everywhere, or not at all
	UserID           uint      `gorm:"column:user_id"`
	RefreshTokenHash string    `gorm:"column:refresh_token_hash;not null;uniqueIndex"`
	ExpiresAt        time.Time `gorm:"column:expires_at"` // TODO: Are the 'column:...' entries necessary? If not, get rid of them across entire schema
	Revoked          bool      `gorm:"column:revoked;not null;default:false"`
	IPAddress        string    `gorm:"column:ip_address"`
	UserAgent        string    `gorm:"column:user_agent"`
}

func (UserSessionEntity) TableName() string {
	return "user_sessions"
}

type UserConfigEntity struct { // TODO: Consider embedding this inside 'UserEntity' for global user config and or inside 'UserSessionEntity' for per-session user config
	UserID uint32 `gorm:"primaryKey;column:user_id;not null"`
	Config string `gorm:"column:config;type:jsonb;not null"` // Store JSON as a string
}

func (UserConfigEntity) TableName() string {
	return "user_config"
}

type SDCommandEntity struct {
	ID       uint32 `gorm:"column:id;primaryKey;not null"`
	SDTypeID uint32 `gorm:"column:sd_type_id;not null;uniqueIndex:idx_typeid_denotation"` // One type of smart device has the same set of commands
	Name     string `gorm:"column:denotation;not null;uniqueIndex:idx_typeid_denotation"`
	Type     string `gorm:"column:type;not null"`
	Payload  string `gorm:"column:payload;not null"`
}

func (SDCommandEntity) TableName() string {
	return "command"
}

type SDCommandInvocationEntity struct {
	ID             uint32 `gorm:"column:id;primaryKey;not null"`
	InvocationTime time.Time
	Payload        string `gorm:"column:payload;not null"`
	UserId         uint32 `gorm:"column:user_id"`
	CommandID      uint32 `gorm:"column:command_id;not null"`     // Binding to command
	SDInstanceID   uint32 `gorm:"column:sd_instance_id;not null"` // New link to a specific instance
}

func (SDCommandInvocationEntity) TableName() string {
	return "command_invocation"
}

type VPLProgramsEntity struct {
	ID                   uint32                           `gorm:"column:id;primaryKey;not null"`
	Name                 string                           `gorm:"column:name;not null"`
	Data                 string                           `gorm:"column:data;type:jsonb;not null"`
	LastRun              *time.Time                       `gorm:"column:last_run"`
	Enabled              bool                             `gorm:"column:enabled;not null"`
	SDParameterSnapshots []VPLProgramSDSnapshotLinkEntity `gorm:"many2many:link;joinForeignKey:ProgramID;joinReferences:SDInstanceID,SDParameterID"`
}

func (VPLProgramsEntity) TableName() string {
	return "vpl_programs"
}

type VPLProgramSDSnapshotLinkEntity struct {
	ProgramID     uint32 `gorm:"column:program_id;primaryKey;not null"`
	SDInstanceID  uint32 `gorm:"column:sd_instance_id;primaryKey;not null"`
	SDParameterID uint32 `gorm:"column:sd_parameter_id;primaryKey;not null"`
}

func (VPLProgramSDSnapshotLinkEntity) TableName() string {
	return "vpl_program_sd_snapshot_link"
}
