package ditto

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
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

// SendCommand -> sends a message (Command) to a specific twin in Ditto
func (c *DittoClient) SendCommand(thingID string, featureID string, commandName string, payload interface{}) error {
	// URL format: /things/{thingId}/features/{featureId}/inbox/messages/{messageSubject}
	url := fmt.Sprintf("%s/things/%s/features/%s/inbox/messages/%s", c.BaseURL, thingID, featureID, commandName)

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.SetBasicAuth(c.Username, c.Password)
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