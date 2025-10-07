package main

import (
	"filepackage/config"
	"filepackage/routes"
	"filepackage/utils"
	"fmt"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	utils.LoadEnv()
	port := os.Getenv("PORT")
	config.ConnectDatabase(os.Getenv("DATABASE_URL"))
	allowedOrigins := os.Getenv("FRONTEND_DOMAIN")
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()
	fmt.Println("Server is running on port " + port)

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{allowedOrigins},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))
	routes.PackageRoutes(router)
	routes.ProfileRoutes(router)
	routes.CanSettingsRoutes(router)
	routes.GroupModelRoutes(router)
	routes.AuthRoutes(router)
	routes.HarnessRoutes(router)
	routes.FileRoutes(router)
	routes.NrfSettingsRoutes(router)
	router.Run(":" + port)
}
