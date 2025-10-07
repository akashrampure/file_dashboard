package routes

import (
	"filepackage/handler"

	"github.com/gin-gonic/gin"
)

func HarnessRoutes(r *gin.Engine) {

	api := r.Group("/api")

	{
		api.POST("/vehicle", handler.CreateVehicle)
		api.GET("/vehicle/:vehicledetails", handler.GetVehicle)
		api.GET("/vehicles", handler.GetAllVehicles)
		api.PUT("/vehicle/:vehicledetails", handler.UpdateVehicle)
		api.DELETE("/vehicle/:vehicledetails", handler.DeleteVehicle)
	}
}
