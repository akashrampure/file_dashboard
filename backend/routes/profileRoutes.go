package routes

import (
	"filepackage/handler"

	"github.com/gin-gonic/gin"
)

func ProfileRoutes(router *gin.Engine) {

	// api := router.Group("/api")
	api := router.Group("/api/v1/products/api")

	{
		api.GET("/users", handler.GetAllUsers)
		api.POST("/user/:id", handler.UpdateUser)
		api.POST("/reset-sequence", handler.ResetSequence)
	}
}
