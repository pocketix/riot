package auth

import (
	"testing"
)

type cookiePathTestCase struct {
	testName             string
	redirectURL          string
	expectedCallbackPath string
	expectedRootPath     string
}

func TestCookiePaths(t *testing.T) {
	testCases := []cookiePathTestCase{
		{
			testName:             "localhost (http | no-prefix)",
			redirectURL:          "http://localhost:9090/auth/callback",
			expectedCallbackPath: "/auth/callback",
			expectedRootPath:     "/",
		},
		{
			testName:             "custom deployment (https | no-prefix)",
			redirectURL:          "https://example.com/auth/callback",
			expectedCallbackPath: "/auth/callback",
			expectedRootPath:     "/",
		},
		{
			testName:             "custom deployment (https | prefix)",
			redirectURL:          "https://tyrion.fit.vutbr.cz/riot/api/auth/callback",
			expectedCallbackPath: "/riot/api/auth/callback",
			expectedRootPath:     "/riot/api",
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.testName, func(t *testing.T) {
			actualCallbackPath := getCallbackPathOf(testCase.redirectURL)
			if actualCallbackPath != testCase.expectedCallbackPath {
				t.Fatalf("callback path mismatch: actual = %s, expected %s", actualCallbackPath, testCase.expectedCallbackPath)
			}
			actualRootPath := getRootPathOf(testCase.expectedCallbackPath)
			if actualRootPath != testCase.expectedRootPath {
				t.Fatalf("root path mismatch: actual = %s, expected %s", actualRootPath, testCase.expectedRootPath)
			}
		})
	}
}
