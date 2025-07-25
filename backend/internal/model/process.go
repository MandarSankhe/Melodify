package model

type ProcessRequest struct {
	Audio string `json:"audio"`
}

type ProcessResponse struct {
	Rating      int    `json:"rating"`
	Suggestions string `json:"suggestions"`
}
