package handler

import (
	"encoding/json"
	"filepackage/config"
	"filepackage/model"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func GetNrfSettingsByFileName(c *gin.Context) {
	fileName := c.Param("filename")
	fileName = strings.TrimSpace(fileName)
	if fileName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File name is required"})
		return
	}

	var nrfSettings model.NrfSettings
	if err := config.DB.Where("filename = ?", fileName).First(&nrfSettings).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Nrf settings not found"})
		return
	}

	var response map[string]interface{}
	if err := json.Unmarshal(nrfSettings.JSONData, &response); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse JSON data"})
		return
	}

	var sleepCnds map[string]interface{}
	if err := json.Unmarshal(nrfSettings.SleepCdns, &sleepCnds); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse SleepCnds"})
		return
	}
	response["sleepcdns"] = sleepCnds
	c.JSON(http.StatusOK, response)
}

func GetAllNrfFileNames(c *gin.Context) {
	var nrfSettings []model.NrfSettings
	if err := config.DB.Select("filename").Find(&nrfSettings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get file names"})
		return
	}

	var fileNames []string
	for _, nrfSetting := range nrfSettings {
		fileNames = append(fileNames, nrfSetting.FileName)
	}
	c.JSON(http.StatusOK, fileNames)
}
