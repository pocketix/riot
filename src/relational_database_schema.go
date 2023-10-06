package main

const (
	NumericKeyPerformanceIndicatorDefinitionsTableName = "numeric_key_performance_indicator_definitions"
)

type NumericKeyPerformanceIndicatorDefinition struct {
	Id                       uint32  `gorm:"column:id;primarykey;not null"`
	HumanReadableDescription string  `gorm:"column:human_readable_description;not null"`
	DeviceType               string  `gorm:"column:device_type;not null"`
	DeviceParameter          string  `gorm:"column:device_parameter;not null"`
	ComparisonType           string  `gorm:"column:comparison_type;not null"`
	FirstNumericValue        float64 `gorm:"column:first_numeric_value;not null"`
	SecondNumericValue       float64 `gorm:"column:second_numeric_value;not null"`
}

func (NumericKeyPerformanceIndicatorDefinition) TableName() string {
	return NumericKeyPerformanceIndicatorDefinitionsTableName
}
