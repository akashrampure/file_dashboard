package routes

import (
	"filepackage/handler"

	"github.com/gin-gonic/gin"
)

func CanSettingsRoutes(router *gin.Engine) {
	api := router.Group("/api")

	// api := router.Group("/api/v1/products/api")
	{
		api.GET("/cansettings/:filename", handler.GetCanSettingsByFileName)
		api.GET("/cansettings/all", handler.GetAllFileNames)
	}
}
