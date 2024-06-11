# Use an official Go runtime as a parent image
FROM golang:1.22-alpine
# Set the working directory inside the container
WORKDIR /app
# Copy the go.mod file, go.sum file, and src directory from backend-core
COPY ./backend-core/go.mod ./backend-core/go.sum /app/backend-core/
COPY ./backend-core/src /app/backend-core/src
# Copy the go.mod file, go.sum file, and src directory from commons
COPY ./commons/go.mod ./commons/go.sum /app/commons/
COPY ./commons/src /app/commons/src
# Change working directory to where the Go app's main module is located
WORKDIR /app/backend-core
# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod tidy
RUN go mod download
# Run unit tests
RUN go test ./...
# Build the Go app
RUN CGO_ENABLED=0 GOOS=linux go build -o RIoT-backend-core src/main.go
# Run the executable
CMD ["/app/backend-core/RIoT-backend-core"]
