package model

type Harness struct {
	SlNo             int    `gorm:"column:slno" json:"slno"`
	PhCode           string `gorm:"column:phcode" json:"phcode"`
	AhCode           string `gorm:"column:ahcode" json:"ahcode"`
	CurrentStock     int    `gorm:"column:currentstock" json:"currentstock"`
	VehicleType      string `gorm:"column:vehicletype" json:"vehicletype"`
	VehicleOem       string `gorm:"column:vehicleoem" json:"vehicleoem"`
	VehicleModel     string `gorm:"column:vehiclemodel" json:"vehiclemodel"`
	VehicleVariant   string `gorm:"column:vehiclevariant" json:"vehiclevariant"`
	YearOfMfg        string `gorm:"column:yearofmfg" json:"yearofmfg"`
	FuelType         string `gorm:"column:fueltype" json:"fueltype"`
	TransmissionType string `gorm:"column:transmissiontype" json:"transmissiontype"`
	IgnitionType     string `gorm:"column:ignitiontype" json:"ignitiontype"`
	DeviceType       string `gorm:"column:devicetype" json:"devicetype"`
	Specification    string `gorm:"column:specification" json:"specification"`
	ImmoType         string `gorm:"column:immotype" json:"immotype"`
	ImmoRelayVoltage string `gorm:"column:immorelayvoltage" json:"immorelayvoltage"`
	Can              string `gorm:"column:can" json:"can"`
	Panic            string `gorm:"column:panic" json:"panic"`
	DevVersion       string `gorm:"column:devversion" json:"devversion"`
	HarnessImage     string `gorm:"column:harnessimage" json:"harnessimage"`
	Diagram          string `gorm:"column:diagram" json:"diagram"`
	Rev              int    `gorm:"column:rev" json:"rev"`
	Description      string `gorm:"column:description" json:"description"`
	UpdatedBy        string `gorm:"column:updatedby" json:"updatedby"`
	UpdatedAt        int64  `gorm:"column:updatedat" json:"updatedat"`
}

func (Harness) TableName() string {
	return "Harness.harness"
}
