package auth

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"github.com/golang-jwt/jwt/v5"
	"strconv"
	"time"
)

var jwtSecret = []byte(sharedUtils.GetEnvironmentVariableValue("JWT_SECRET").GetPayloadOrDefault("laaiqVgdmnurM4hC"))

func createJWT(user dllModel.User, expiresIn time.Duration) (string, error) {
	now := time.Now()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": fmt.Sprintf("%d", user.ID.GetPayload()),
		"iat": now.Unix(),
		"exp": now.Add(expiresIn).Unix(),
	})
	return token.SignedString(jwtSecret)
}

func createSessionJWT(user dllModel.User) (string, error) {
	return createJWT(user, 24*time.Hour)
}

func createRefreshJWT(user dllModel.User) (string, error) {
	return createJWT(user, 30*24*time.Hour)
}

func parseJWT(jwtString string) (*jwt.Token, error) {
	keyFunc := func(token *jwt.Token) (any, error) { return jwtSecret, nil }
	return jwt.Parse(jwtString, keyFunc, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
}

func isJWTValid(jwtString string) bool {
	token, err := parseJWT(jwtString)
	if err != nil {
		return false
	}
	if !token.Valid {
		return false
	}
	subject, err := token.Claims.GetSubject()
	if err != nil {
		return false
	}
	if subject == "" {
		return false
	}
	if _, err = strconv.ParseUint(subject, 10, 64); err != nil {
		return false
	}
	return true
}

func extractClaims(jwtString string) (jwt.Claims, error) {
	token, err := parseJWT(jwtString)
	if err != nil || !token.Valid {
		return nil, err
	}
	return token.Claims, nil
}
