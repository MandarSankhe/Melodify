package model

type IdentifyRequest struct {
	Audio []byte `json:"audio"`
}

type IdentifyResponse struct {
	StatusCode int    `json:"status_code"`
	Body       string `json:"body"`
	Error      string `json:"error,omitempty"`
}
