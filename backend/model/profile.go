package model

type Profile struct {
	ID    int    `gorm:"column:id;primary_key" json:"id"`
	Email string `gorm:"column:email;not null;unique" json:"email"`
	Role  string `gorm:"column:role;not null" json:"role"`
}

func (Profile) TableName() string {
	return "LAFPackages.profiles"
}
