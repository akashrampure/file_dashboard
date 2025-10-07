package model

type CanSettings struct {
	FileId    string `gorm:"column:fileid" json:"fileid"`
	FileName  string `gorm:"column:filename" json:"filename"`
	JSONData  []byte `gorm:"column:jsondata" json:"jsondata"`
	CreatedBy string `gorm:"column:createdby" json:"createdby"`
	UpdatedBy string `gorm:"column:updatedby" json:"updatedby"`
	CreatedAt int64  `gorm:"column:createdat" json:"createdat"`
	UpdatedAt int64  `gorm:"column:updatedat" json:"updatedat"`
}

func (CanSettings) TableName() string {
	return "FileTracker.parsedfiles"
}
