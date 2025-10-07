package handler

import (
	"filepackage/config"
	"filepackage/model"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateProfile(email string) (string, error) {
	var profile model.Profile
	result := config.DB.First(&profile, "email=?", email)

	if result.Error != nil {
		profile.Email = email
		profile.Role = "user"
		createResult := config.DB.Create(&profile)
		if createResult.Error != nil {
			return "", createResult.Error
		}
	}
	return profile.Role, nil
}

func GetAllUsers(c *gin.Context) {
	var profiles []model.Profile
	result := config.DB.Find(&profiles)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch Users"})
		return
	}
	c.JSON(http.StatusOK, profiles)
}

func UpdateUser(c *gin.Context) {
	id := c.Param("id")

	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User id is required"})
		return
	}

	var profile model.Profile
	result := config.DB.First(&profile, "id = ?", id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if err := c.ShouldBindJSON(&profile); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	dbResult := config.DB.Model(&profile).Where("id = ?", id).Omit("id", "email").Updates(profile)
	if dbResult.Error != nil {
		fmt.Println("Error updating user:", dbResult.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User " + id + " updated successfully"})
}

func ResetSequence(c *gin.Context) {
	query := `
    SELECT setval(
        pg_get_serial_sequence('"LAFPackages"."profiles"', 'id'), 
        COALESCE(MAX(id), 1)
    ) FROM "LAFPackages"."profiles";
    `
	if err := config.DB.Exec(query).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to reset sequence: %v", err)})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Sequence reset successfully"})
}
