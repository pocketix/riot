package auth

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"github.com/golang-jwt/jwt/v5"
	"strconv"
	"time"
)

var jwtSecret = []byte(sharedUtils.GetEnvironmentVariableValue("JWT_SECRET").GetPayloadOrDefault("laaiqVgdmnurM4hC"))

func createSessionJWT(userID string) (string, error) {
	now := time.Now()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": userID,
		"iat": now.Unix(),
		"exp": now.Add(10 * time.Minute).Unix(),
	})
	return token.SignedString(jwtSecret)
}

func parseJWT(jwtString string) (*jwt.Token, error) {
	keyFunc := func(token *jwt.Token) (any, error) { return jwtSecret, nil }
	return jwt.Parse(jwtString, keyFunc, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
}

func isJWTValid(token *jwt.Token) bool {
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

func getTimeUntilJWTExpiry(token *jwt.Token) sharedUtils.Result[time.Duration] {
	claims := token.Claims
	expirationTime, err := claims.GetExpirationTime()
	if err != nil {
		return sharedUtils.NewFailureResult[time.Duration](err)
	}
	if expirationTime == nil {
		return sharedUtils.NewFailureResult[time.Duration](fmt.Errorf("the 'exp' claim is missing"))
	}
	return sharedUtils.NewSuccessResult(time.Until(expirationTime.Time))
}
