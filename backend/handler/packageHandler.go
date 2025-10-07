package handler

import (
	"filepackage/config"
	"filepackage/model"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreatePackage(c *gin.Context) {
	var pkg model.FilePackage
	if err := c.ShouldBindJSON(&pkg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := config.DB.Create(&pkg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create package"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Package " + pkg.Filepackagecode + " created successfully"})
}

func GetPackage(c *gin.Context) {
	fpcode := c.Param("fpcode")

	if fpcode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File Package Code is required"})
		return
	}

	var pkg model.FilePackage
	result := config.DB.First(&pkg, "filepackagecode = ?", fpcode)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Package not found"})
		return
	}

	c.JSON(http.StatusOK, pkg)

}

func GetAllPackages(c *gin.Context) {
	var pkgs []model.FilePackage
	result := config.DB.Find(&pkgs)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch packages"})
		return
	}
	c.JSON(http.StatusOK, pkgs)
}

func UpdatePackage(c *gin.Context) {
	fpcode := c.Param("fpcode")

	if fpcode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File Package Code is required"})
		return
	}

	var pkg model.FilePackage
	result := config.DB.First(&pkg, "filepackagecode = ?", fpcode)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Package not found"})
		return
	}

	var updatedPkg model.FilePackage
	if err := c.ShouldBindJSON(&updatedPkg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	dbResult := config.DB.Model(&pkg).Where("filepackagecode = ?", fpcode).Omit("filepackagecode").Select("*").Updates(updatedPkg)
	if dbResult.Error != nil {
		fmt.Println("Error updating package:", dbResult.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update package"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Package " + fpcode + " updated successfully"})
}

func DeletePackage(c *gin.Context) {
	fpcode := c.Param("fpcode")

	if fpcode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File Package Code is required"})
		return
	}

	var pkg model.FilePackage
	result := config.DB.First(&pkg, "filepackagecode = ?", fpcode)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Package not found"})
		return
	}

	if err := config.DB.Where("filepackagecode = ?", fpcode).Delete(&pkg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete package"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Package " + fpcode + " deleted successfully"})
}
