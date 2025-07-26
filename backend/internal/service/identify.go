package service

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type IdentifyOptions struct {
	Host             string `json:"host"`
	Endpoint         string `json:"endpoint"`
	SignatureVersion string `json:"signature_version"`
	DataType         string `json:"data_type"`
	Secure           bool   `json:"secure"`
	AccessKey        string `json:"access_key"`
	AccessSecret     string `json:"access_secret"`
}

type IdentifyResult struct {
	StatusCode int
	Body       []byte
	Err        error
}

// AFTER (remove method parameter)
func buildStringToSign(method, uri, accessKey, dataType, signatureVersion string, timestamp int64) string {
	return fmt.Sprintf("%s\n%s\n%s\n%s\n%s\n%d", method, uri, accessKey, dataType, signatureVersion, timestamp)
}

func Identify(data []byte, options IdentifyOptions) (*IdentifyResult, error) {
	// Trim credentials to prevent hidden whitespace issues
	options.AccessKey = strings.TrimSpace(options.AccessKey)
	options.AccessSecret = strings.TrimSpace(options.AccessSecret)

	// Use milliseconds for both signature and form field
	timestamp := time.Now().UnixNano() / int64(time.Millisecond)

	stringToSign := buildStringToSign(
		"POST",
		options.Endpoint,
		options.AccessKey,
		options.DataType,
		options.SignatureVersion,
		timestamp,
	)

	h := hmac.New(sha1.New, []byte(options.AccessSecret))
	h.Write([]byte(stringToSign))
	signature := base64.StdEncoding.EncodeToString(h.Sum(nil))

	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// Add fields in EXACT order from C# example
	_ = writer.WriteField("access_key", options.AccessKey)
	_ = writer.WriteField("timestamp", strconv.FormatInt(timestamp, 10)) // Milliseconds
	_ = writer.WriteField("signature", signature)
	_ = writer.WriteField("data_type", options.DataType)
	_ = writer.WriteField("signature_version", options.SignatureVersion)
	_ = writer.WriteField("sample_bytes", strconv.Itoa(len(data)))

	// Add file with proper filename and content type
	fileWriter, err := writer.CreateFormFile("sample", "sample.bin")
	if err != nil {
		return nil, err
	}
	if _, err = io.Copy(fileWriter, bytes.NewReader(data)); err != nil {
		return nil, err
	}

	writer.Close()

	protocol := "http"
	if options.Secure {
		protocol = "https"
	}
	url := fmt.Sprintf("%s://%s%s", protocol, options.Host, options.Endpoint)

	req, err := http.NewRequest("POST", url, &buf)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return &IdentifyResult{
		StatusCode: resp.StatusCode,
		Body:       respBody,
		Err:        nil,
	}, nil
}
