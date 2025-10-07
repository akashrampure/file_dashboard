package handler

import (
	"filepackage/config"
	"filepackage/model"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Model struct {
	ModelId   int    `json:"modelid"`
	ModelName string `json:"modelname"`
}

type Group struct {
	GroupId   int    `json:"groupid"`
	GroupName string `json:"groupname"`
}

func GetAllGroups(c *gin.Context) {
	var groups []model.GroupModels
	distinctGroupsMap := make(map[int]Group)
	groupName := c.Query("groupname")

	query := config.DB.Distinct("groupid", "groupname")
	if groupName != "" {
		query = query.Where("groupname ILIKE ?", "%"+groupName+"%")
	}

	result := query.Find(&groups)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch groups"})
		return
	}

	for _, group := range groups {
		distinctGroupsMap[group.GroupId] = Group{
			GroupId:   group.GroupId,
			GroupName: group.GroupName,
		}
	}

	var distinctGroups []Group
	for _, group := range distinctGroupsMap {
		distinctGroups = append(distinctGroups, group)
	}
	c.JSON(http.StatusOK, distinctGroups)
}

func GetModelsForGroup(c *gin.Context) {
	var models []Model
	groupname := c.Param("groupname")

	if groupname == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Group Name is required"})
		return
	}

	var groups []model.GroupModels
	result := config.DB.Where("groupname ILIKE ?", "%"+groupname+"%").Find(&groups)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch models for group"})
		return
	}

	for _, group := range groups {
		modelName := fmt.Sprintf("%s_%s_%s_%s_%d_%s_%s", group.VehicleType, group.Oem, group.Model, group.Variant, group.Year, group.FuelType, group.Transmission)
		models = append(models, Model{
			ModelId:   group.ModelId,
			ModelName: modelName,
		})
	}

	c.JSON(http.StatusOK, models)
}
