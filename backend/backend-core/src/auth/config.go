package auth

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var GoogleOAuth2Config = &oauth2.Config{ // TODO: Revisit and calibrate this config
	ClientID:     sharedUtils.GetEnvironmentVariableValue("GOOGLE_OAUTH2_CLIENT_ID").GetPayloadOrDefault("939239491866-unqfnuoqc0loboqoq9l4shji2i1atpei.apps.googleusercontent.com"),
	ClientSecret: sharedUtils.GetEnvironmentVariableValue("GOOGLE_OAUTH2_CLIENT_SECRET").GetPayloadOrDefault("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"),
	RedirectURL:  "http://localhost:9090/auth/callback",
	Scopes:       sharedUtils.SliceOf("openid", "profile", "email"),
	Endpoint:     google.Endpoint,
}
