package routes

import (
	"filepackage/handler"

	"github.com/gin-gonic/gin"
)

func FileRoutes(r *gin.Engine) {

	api := r.Group("/api/file")

	{
		api.POST("/upload", handler.UploadFile)
		api.GET("/download", handler.DownloadFile)
	}
}
