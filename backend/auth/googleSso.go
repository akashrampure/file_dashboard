package auth

import (
	"context"
	"encoding/json"
	"filepackage/handler"
	"filepackage/utils"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var jwtSecret string

const (
	accessTokenExpiry  = 30 * time.Minute
	refreshTokenExpiry = 14 * 24 * time.Hour
)

func init() {
	utils.LoadEnv()
	jwtSecret = os.Getenv("JWT_SECRET")
}

func getGoogleOauthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     os.Getenv("CLIENT_ID"),
		ClientSecret: os.Getenv("CLIENT_SECRET"),
		RedirectURL:  os.Getenv("REDIRECT_URL"),
		Scopes:       []string{"openid", "email", "profile"},
		Endpoint:     google.Endpoint,
	}
}

func HandleGoogleLogin(c *gin.Context) {
	url := getGoogleOauthConfig().AuthCodeURL("state-token", oauth2.AccessTypeOffline)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func HandleGoogleCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Authorization code missing"})
		return
	}

	token, err := getGoogleOauthConfig().Exchange(context.Background(), code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange token", "details": err.Error()})
		return
	}

	userInfo, err := FetchGoogleUserInfo(token)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user info"})
		return
	}

	stage := os.Getenv("STAGE")

	if !IsEmailAllowed(userInfo.Email) {
		if stage == "production" {
			c.Redirect(http.StatusTemporaryRedirect, "http://products.intellicar.in/unauthorized")
		} else {
			c.Redirect(http.StatusTemporaryRedirect, "http://localhost:5173/unauthorized")
		}
		return
	}
	role, err := handler.CreateProfile(userInfo.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create profile", "details": err.Error()})
		return
	}

	accessToken, err := CreateJwtToken(userInfo.Email, userInfo.Picture, role, accessTokenExpiry)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create access token", "details": err.Error()})
		return
	}

	refreshToken, err := CreateJwtToken(userInfo.Email, userInfo.Picture, role, refreshTokenExpiry)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create refresh token", "details": err.Error()})
		return
	}

	SetAuthCookies(c, accessToken, refreshToken)
	if stage == "production" {
		c.Redirect(http.StatusTemporaryRedirect, "http://products.intellicar.in/home")
	} else {
		c.Redirect(http.StatusTemporaryRedirect, "http://localhost:5173/home")
	}
}

func FetchGoogleUserInfo(token *oauth2.Token) (*UserInfo, error) {
	client := getGoogleOauthConfig().Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var userInfo UserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, err
	}
	return &userInfo, nil
}

type UserInfo struct {
	Email   string `json:"email"`
	Picture string `json:"picture"`
}

func IsEmailAllowed(email string) bool {
	allowedDomain := "intellicar.in"
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return false
	}
	return strings.ToLower(parts[1]) == allowedDomain
}

func SetAuthCookies(c *gin.Context, accessToken, refreshToken string) {
	stage := os.Getenv("STAGE")
	if stage == "production" {
		c.SetCookie("access_token", accessToken, int(accessTokenExpiry.Seconds()), "/", "products.intellicar.in", false, false)
		c.SetCookie("refresh_token", refreshToken, int(refreshTokenExpiry.Seconds()), "/", "products.intellicar.in", false, false)
	} else {
		c.SetCookie("access_token", accessToken, int(accessTokenExpiry.Seconds()), "/", "localhost", false, false)
		c.SetCookie("refresh_token", refreshToken, int(refreshTokenExpiry.Seconds()), "/", "localhost", false, false)
	}
}

func CreateJwtToken(email, picture, role string, expiry time.Duration) (string, error) {
	claims := jwt.MapClaims{
		"email":   email,
		"picture": picture,
		"role":    role,
		"exp":     time.Now().Add(expiry).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))
}

func ParseJwtToken(tokenString string) (jwt.MapClaims, error) {
	claims := jwt.MapClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		fmt.Println("Error parsing token:", err)
		return nil, err
	}

	if !token.Valid {
		fmt.Println("Token is not valid")
		return nil, fmt.Errorf("token is not valid")
	}

	return claims, nil
}

func RefreshToken(c *gin.Context) {
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No refresh token found", "details": err.Error()})
		return
	}

	claims, err := ParseJwtToken(refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token", "details": err.Error()})
		return
	}

	newAccessToken, err := CreateJwtToken(claims["email"].(string), claims["picture"].(string), claims["role"].(string), accessTokenExpiry)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create new access token", "details": err.Error()})
		return
	}

	SetAuthCookies(c, newAccessToken, refreshToken)

	c.JSON(http.StatusOK, gin.H{"message": "Access token refreshed"})
}
