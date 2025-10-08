package routes

import (
	"filepackage/auth"

	"github.com/gin-gonic/gin"
)

func AuthRoutes(router *gin.Engine) {
	api := router.Group("/api/v1/products")

	api.GET("/auth/google", auth.HandleGoogleLogin)
	api.GET("/auth/google/callback", auth.HandleGoogleCallback)
	api.POST("/auth/refresh", auth.RefreshToken)

	// router.GET("/auth/google", auth.HandleGoogleLogin)
	// router.GET("/auth/google/callback", auth.HandleGoogleCallback)
	// router.POST("/auth/refresh", auth.RefreshToken)
}
