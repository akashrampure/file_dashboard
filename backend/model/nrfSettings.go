package model

type NrfSettings struct {
	FileName  string `gorm:"column:filename" json:"filename"`
	FileType  int    `gorm:"column:filetype" json:"filetype"`
	JSONData  []byte `gorm:"column:jsondata" json:"jsondata"`
	SleepCdns []byte `gorm:"column:sleepcdns" json:"sleepcdns"`
	CreatedBy string `gorm:"column:createdby" json:"createdby"`
	CreatedAt int64  `gorm:"column:createdat" json:"createdat"`
}

func (NrfSettings) TableName() string {
	return "NrfSettings.parsedfiles"
}
