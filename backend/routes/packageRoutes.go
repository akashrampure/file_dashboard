package routes

import (
	"filepackage/handler"

	"github.com/gin-gonic/gin"
)

func PackageRoutes(router *gin.Engine) {

	// api := router.Group("/api")
	api := router.Group("/api/v1/products/api")

	api.POST("/package", handler.CreatePackage)
	api.GET("/package/:fpcode", handler.GetPackage)
	api.GET("/packages", handler.GetAllPackages)
	api.PUT("/package/:fpcode", handler.UpdatePackage)
	api.DELETE("/package/:fpcode", handler.DeletePackage)
}
