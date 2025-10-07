package model

type GroupModels struct {
	GroupId      int    `gorm:"column:groupid" json:"groupid"`
	GroupName    string `gorm:"column:groupname" json:"groupname"`
	ModelId      int    `gorm:"column:modelid" json:"modelid"`
	VehicleType  string `gorm:"column:vehicletype" json:"vehicletype"`
	Oem          string `gorm:"column:oem" json:"oem"`
	Model        string `gorm:"column:model" json:"model"`
	Variant      string `gorm:"column:variant" json:"variant"`
	Year         int    `gorm:"column:year" json:"year"`
	FuelType     string `gorm:"column:fueltype" json:"fueltype"`
	Transmission string `gorm:"column:transmission" json:"transmission"`
}

func (GroupModels) TableName() string {
	return "LAFPackages.groupmodels"
}
