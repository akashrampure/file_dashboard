package handler

import (
	"encoding/json"
	"filepackage/config"
	"filepackage/model"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func GetCanSettingsByFileName(c *gin.Context) {
	fileName := c.Param("filename")
	fileName = strings.TrimSpace(fileName)
	fmt.Println(fileName)
	if fileName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File name is required"})
		return
	}

	var canSettings model.CanSettings
	if err := config.DB.Where("filename = ?", fileName).First(&canSettings).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Can settings not found"})
		return
	}

	var response map[string]interface{}
	if err := json.Unmarshal(canSettings.JSONData, &response); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse JSON data"})
		return
	}

	c.JSON(http.StatusOK, response)
}

func GetAllFileNames(c *gin.Context) {
	var canSettings []model.CanSettings
	if err := config.DB.Select("filename").Find(&canSettings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get file names"})
		return
	}

	var fileNames []string
	for _, canSetting := range canSettings {
		fileNames = append(fileNames, canSetting.FileName)
	}
	c.JSON(http.StatusOK, fileNames)
}
