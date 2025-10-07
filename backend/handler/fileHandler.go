package handler

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

func UploadFile(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse multipart form"})
		return
	}

	file := form.File["file"][0]
	if file == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	basePath := "/home/akash/harness/"
	folderName := c.PostForm("folder")
	folderName = filepath.Join(basePath, folderName)
	if folderName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Folder name is required"})
		return
	}

	if err := os.MkdirAll(folderName, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create folder"})
		return
	}

	filename := file.Filename
	filePath := filepath.Join(folderName, filename)

	srcFile, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open uploaded file"})
		return
	}
	defer srcFile.Close()

	dstFile, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create file on local filesystem"})
		return
	}
	defer dstFile.Close()

	if _, err := io.Copy(dstFile, srcFile); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write file to local filesystem"})
		return
	}

	fmt.Println("File uploaded successfully", filePath)
	c.JSON(http.StatusOK, gin.H{"message": "File uploaded successfully", "file": filePath})
}

func DownloadFile(c *gin.Context) {
	basePath := "/home/akash/harness/"
	folderName := c.Query("folder")
	filename := c.Query("filename")
	filename, err := url.QueryUnescape(filename)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid filename"})
		return
	}
	folderName = filepath.Join(basePath, folderName)

	filePath := filepath.Join(folderName, filename)
	filePath, err = url.QueryUnescape(filePath)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid filename"})
		return
	}

	dstFile, err := os.Open(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file on local filesystem"})
		return
	}
	defer dstFile.Close()

	ext := filepath.Ext(filename)
	var contentType string
	switch ext {
	case ".png":
		contentType = "image/png"
	case ".jpg", ".jpeg":
		contentType = "image/jpeg"
	case ".pdf":
		contentType = "application/pdf"
	default:
		contentType = "application/octet-stream"
	}
	c.Header("Content-Type", contentType)

	c.Header("Content-Disposition", "attachment; filename=\""+filename+"\"")

	fileInfo, err := dstFile.Stat()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get file size"})
		return
	}
	c.Header("Content-Length", fmt.Sprintf("%d", fileInfo.Size()))

	if _, err := io.Copy(c.Writer, dstFile); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write file to response"})
		return
	}
}
