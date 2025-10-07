package routes

import (
	"filepackage/handler"

	"github.com/gin-gonic/gin"
)

func NrfSettingsRoutes(router *gin.Engine) {
	api := router.Group("/api")

	{
		api.GET("/nrfsettings/:filename", handler.GetNrfSettingsByFileName)
		api.GET("/nrfsettings/all", handler.GetAllNrfFileNames)
	}
}
