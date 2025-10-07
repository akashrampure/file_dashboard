package model

type FilePackage struct {
	Filepackagecode        string `gorm:"column:filepackagecode" json:"filepackagecode"`
	Groupid                int    `gorm:"column:groupid" json:"groupid"`
	Groupname              string `gorm:"column:groupname" json:"groupname"`
	Modelid                int    `gorm:"column:modelid" json:"modelid"`
	Modelname              string `gorm:"column:modelname" json:"modelname"`
	Assetmeta              string `gorm:"column:assetmeta" json:"assetmeta"`
	Filesolutioncode       string `gorm:"column:filesolutioncode" json:"filesolutioncode"`
	Status                 string `gorm:"column:status" json:"status"`
	Firmwaretype           string `gorm:"column:firmwaretype" json:"firmwaretype"`
	Networktype            string `gorm:"column:networktype" json:"networktype"`
	Modemversion           string `gorm:"column:modemversion" json:"modemversion"`
	Hardwareversion        string `gorm:"column:hardwareversion" json:"hardwareversion"`
	Addonhardwareversion   string `gorm:"column:addonhardwareversion" json:"addonhardwareversion"`
	Networkprovider        string `gorm:"column:networkprovider" json:"networkprovider"`
	Mainfirmwarebootloader string `gorm:"column:mainfirmwarebootloader" json:"mainfirmwarebootloader"`
	Mainfirmware           string `gorm:"column:mainfirmware" json:"mainfirmware"`
	Mainsettingsname       string `gorm:"column:mainsettingsname" json:"mainsettingsname"`
	Mainsettingsid         string `gorm:"column:mainsettingsid" json:"mainsettingsid"`
	Coprocfirmware         string `gorm:"column:coprocfirmware" json:"coprocfirmware"`
	Coprocsettingsname     string `gorm:"column:coprocsettingsname" json:"coprocsettingsname"`
	Plsign                 string `gorm:"column:plsign" json:"plsign"`
	Isvalid                bool   `gorm:"column:isvalid" json:"isvalid"`
	Updatedby              string `gorm:"column:updatedby" json:"updatedby"`
	Updatedat              int64  `gorm:"column:updatedat" json:"updatedat"`
}

func (FilePackage) TableName() string {
	return "LAFPackages.packages"
}
