package handler

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"filepackage/config"
	"filepackage/model"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func CreateVehicle(c *gin.Context) {
	var vehicle model.Harness
	if err := c.ShouldBindJSON(&vehicle); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result := config.DB.Model(&vehicle).Omit("slno").Create(&vehicle)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create vehicle"})
		return
	}

	c.JSON(http.StatusCreated, vehicle)
}

func GetVehicle(c *gin.Context) {
	params := c.Param("vehicledetails")
	parts := strings.Split(params, ",")

	if len(parts) != 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "All parameters are required"})
		return
	}

	phcode := parts[0]
	vehicleoem := parts[1]
	vehiclemodel := parts[2]
	vehiclevariant := parts[3]
	yearofmfg := parts[4]

	var vehicle model.Harness
	result := config.DB.First(&vehicle, model.Harness{
		PhCode:         phcode,
		VehicleOem:     vehicleoem,
		VehicleModel:   vehiclemodel,
		VehicleVariant: vehiclevariant,
		YearOfMfg:      yearofmfg,
	})

	if result.Error != nil {
		log.Printf("Error fetching vehicle: %v", result.Error)
		c.JSON(http.StatusNotFound, gin.H{"error": "Vehicle not found"})
		return
	}

	c.JSON(http.StatusOK, vehicle)
}

func GetAllVehicles(c *gin.Context) {
	var vehicles []model.Harness
	result := config.DB.Find(&vehicles)
	if result.Error != nil {
		log.Printf("Error fetching vehicles: %v", result.Error)
		return
	}
	c.JSON(http.StatusOK, vehicles)
}

func UpdateVehicle(c *gin.Context) {
	params := c.Param("vehicledetails")
	parts := strings.Split(params, ",")

	fmt.Println(parts)

	if len(parts) != 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "All parameters are required"})
		return
	}

	phcode := parts[0]
	vehicleoem := parts[1]
	vehiclemodel := parts[2]
	vehiclevariant := parts[3]
	yearofmfg := parts[4]

	var vehicle model.Harness
	result := config.DB.First(&vehicle, model.Harness{
		PhCode:         phcode,
		VehicleOem:     vehicleoem,
		VehicleModel:   vehiclemodel,
		VehicleVariant: vehiclevariant,
		YearOfMfg:      yearofmfg,
	})

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Vehicle not found"})
		return
	}

	var updates model.Harness
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result = config.DB.Model(&vehicle).Omit("updatedat, slno").Where("phcode = ? AND vehicleoem = ? AND vehiclemodel = ? AND vehiclevariant = ? AND yearofmfg = ?",
		phcode, vehicleoem, vehiclemodel, vehiclevariant, yearofmfg).Updates(updates)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update vehicle"})
		return
	}

	c.JSON(http.StatusOK, vehicle)
}

func DeleteVehicle(c *gin.Context) {
	params := c.Param("vehicledetails")
	parts := strings.Split(params, ",")

	if len(parts) != 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "All parameters are required"})
		return
	}

	phcode := parts[0]
	vehicleoem := parts[1]
	vehiclemodel := parts[2]
	vehiclevariant := parts[3]
	yearofmfg := parts[4]

	result := config.DB.Delete(&model.Harness{}, model.Harness{
		PhCode:         phcode,
		VehicleOem:     vehicleoem,
		VehicleModel:   vehiclemodel,
		VehicleVariant: vehiclevariant,
		YearOfMfg:      yearofmfg,
	})

	if result.Error != nil {
		log.Printf("Error Deleting Vehicle: %v", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete vehicle"})
		return
	}

	if result.RowsAffected > 0 {
		if err := ResetSlnoSequence(config.DB); err != nil {
			log.Printf("Error resetting slno sequence: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset slno sequence"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Vehicle Deleted"})
}

func ResetSlnoSequence(db *gorm.DB) error {
	query := `
    SELECT setval(
        pg_get_serial_sequence('"Harness"."harness"', 'slno'), 
        COALESCE(MAX(slno), 1)
    ) FROM "Harness"."harness";
    `
	result := db.Exec(query)
	if result.Error != nil {
		return fmt.Errorf("failed to reset sequence: %v", result.Error)
	}
	return nil
}
