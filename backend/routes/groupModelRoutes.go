package routes

import (
	"filepackage/handler"

	"github.com/gin-gonic/gin"
)

func GroupModelRoutes(router *gin.Engine) {
	api := router.Group("/api")
	// api := router.Group("/api/v1/products/api")

	{
		api.GET("/groups", handler.GetAllGroups)
		api.GET("/groups/:groupname", handler.GetModelsForGroup)
	}
}
