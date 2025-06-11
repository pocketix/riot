package auth

import (
	"context"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

const (
	UserIDContextIdentifier           = "userID"
	APIAccessSummaryContextIdentifier = "apiAccessSummary"
)

func WithJWTPayload(originalContext context.Context, jwtPayload JWTPayload) context.Context {
	temp := context.WithValue(originalContext, UserIDContextIdentifier, jwtPayload.UserID)
	return context.WithValue(temp, APIAccessSummaryContextIdentifier, jwtPayload.APIAccessSummary)
}

func GetUserID(context context.Context) sharedUtils.Optional[uint] {
	rawUserID := context.Value(UserIDContextIdentifier)
	if rawUserID == nil {
		return sharedUtils.NewEmptyOptional[uint]()
	}
	return sharedUtils.NewOptionalOf[uint](rawUserID.(uint))
}

func GetAPIAccessSummary(context context.Context) sharedUtils.Optional[APIAccessSummary] {
	rawAPIAccessSummary := context.Value(APIAccessSummaryContextIdentifier)
	if rawAPIAccessSummary == nil {
		return sharedUtils.NewEmptyOptional[APIAccessSummary]()
	}
	return sharedUtils.NewOptionalOf[APIAccessSummary](rawAPIAccessSummary.(APIAccessSummary))
}
