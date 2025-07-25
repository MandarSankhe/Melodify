# Melodify Backend

## Structure

- `cmd/melodify/` - Main application entrypoint
- `internal/handler/` - HTTP handlers
- `internal/model/` - Request/response models
- `internal/service/` - Business logic (future)
- `pkg/` - Public packages (if any)
- `config/` - Configuration files

## Run Locally

```sh
cd cmd/melodify
# Run the server
# (make sure Go modules are enabled)
go run .
```

Server will start on `:8080`.
