package ditto

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

type DittoClient struct {
	BaseURL  string // "http://nginx:8080/api/2" or "http://localhost:8080/api/2"
	Username string // "devops"
	Password string // "foobar"
	client   *http.Client
}

func NewDittoClient(baseURL, username, password string) *DittoClient {
	return &DittoClient{
		BaseURL:  baseURL,
		Username: username,
		Password: password,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func NewDittoClientFromEnvironment() *DittoClient {
	baseURL := os.Getenv("DITTO_URL")
	if baseURL == "" {
		baseURL = "http://gateway:8080"
	}
	username := os.Getenv("DITTO_USERNAME")
	if username == "" {
		username = "devops"
	}
	password := os.Getenv("DITTO_PASSWORD")
	if password == "" {
		password = "foobar"
	}

	return NewDittoClient(normalizeDittoBaseURL(baseURL), username, password)
}

func normalizeDittoBaseURL(baseURL string) string {
	baseURL = strings.TrimSpace(baseURL)
	baseURL = strings.TrimSuffix(baseURL, "/")
	if strings.HasSuffix(baseURL, "/api/2") {
		return baseURL
	}
	if strings.HasSuffix(baseURL, "/api") {
		return baseURL + "/2"
	}
	return baseURL + "/api/2"
}

func (c *DittoClient) CreateThing(thingID string, features map[string]interface{}) error {
    payload := map[string]interface{}{
        "policyId": "cz.riot:policy-1",
        "attributes": map[string]interface{}{
            "status": "created_by_backend",
        },
        "features": features,
    }

    body, err := json.Marshal(payload)
    if err != nil {
        return fmt.Errorf("failed to marshal payload: %w", err)
    }

    endpoint := fmt.Sprintf("%s/things/%s", c.BaseURL, thingID)
    req, err := http.NewRequest("PUT", endpoint, bytes.NewBuffer(body))
    if err != nil {
        return fmt.Errorf("failed to create request: %w", err)
    }
	req.Header.Set("x-ditto-pre-authenticated", "nginx:ditto")
	req.Header.Set("Content-Type", "application/json")
    
    resp, err := c.client.Do(req)
    if err != nil {
        return fmt.Errorf("failed to send request to Ditto: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode < 200 || resp.StatusCode >= 300 {
        return fmt.Errorf("ditto returned non-2xx status: %d", resp.StatusCode)
    }

    return nil
}

// SendCommand -> sends a message (Command) to a specific twin in Ditto
func (c *DittoClient) SendCommand(thingID string, featureID string, commandName string, payload interface{}) error {
	var url string
	// URL format: /things/{thingId}/features/{featureId}/inbox/messages/{messageSubject}
	if featureID != "" {
		// Feature-level message, e.g., for a specific feature of the device
		url = fmt.Sprintf("%s/things/%s/features/%s/inbox/messages/%s?timeout=0", c.BaseURL, thingID, featureID, commandName)
	} else {
		// Thing-level message, e.g., control command for the whole device
		url = fmt.Sprintf("%s/things/%s/inbox/messages/%s?timeout=0", c.BaseURL, thingID, commandName)
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-ditto-pre-authenticated", "nginx:ditto")

	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request to Ditto: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("ditto returned non-2xx status: %d", resp.StatusCode)
	}

	return nil
}