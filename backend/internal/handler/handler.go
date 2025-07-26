package handler

import (
	"encoding/base64"
	"encoding/json"
	"io"
	"log"
	"melodify-backend/internal/model"
	"melodify-backend/internal/service"
	"net/http"
	"os"
)

// IdentifyHandler handles music identification requests
func setCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func IdentifyHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		log.Println("IdentifyHandler called with unsupported method:", r.Method)
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Audio string `json:"audio"`
	}

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		log.Println("Error decoding request body:", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}
	audioData, err := base64.StdEncoding.DecodeString(req.Audio)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid base64 audio"})
		return
	}

	// Load config (for demo, from file; in prod, use env or secret manager)
	f, err := os.Open("../../config/identify.json")
	if err != nil {
		log.Println("Could not open config/identify.json, using example config.", err)
		f, err = os.Open("../config/identify.example.json")
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Server config error"})
			return
		}
	}
	defer f.Close()
	var opts service.IdentifyOptions
	b, _ := io.ReadAll(f)
	json.Unmarshal(b, &opts)

	result, err := service.Identify(audioData, opts)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(result.StatusCode)
	log.Println("Identify response body:", string(result.Body))
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status_code": result.StatusCode,
		"body":        string(result.Body),
	})
}

func RootHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	w.Write([]byte("Welcome to Melodify AI Backend!"))
}

func ProcessHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var req model.ProcessRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	resp := model.ProcessResponse{
		Rating:      7,
		Suggestions: "Try to keep your pitch steady and add more emotion!",
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
