package main

import (
	"log"
	"melodify-backend/internal/handler"
	"net/http"
)

func main() {
	http.HandleFunc("/", handler.RootHandler)
	http.HandleFunc("/process", handler.ProcessHandler)
	http.HandleFunc("/identify", handler.IdentifyHandler)
	log.Println("Server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
