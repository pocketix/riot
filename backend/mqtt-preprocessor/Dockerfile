# Use an official Go runtime as a parent image
FROM golang:1.22-alpine
# Set the working directory inside the container
WORKDIR /app
# Copy the go.mod file, go.sum file, and src directory from mqtt-preprocessor
COPY ./mqtt-preprocessor/go.mod ./mqtt-preprocessor/go.sum /app/mqtt-preprocessor/
COPY ./mqtt-preprocessor/src /app/mqtt-preprocessor/src
# Copy the go.mod file, go.sum file, and src directory from commons
COPY ./commons/go.mod ./commons/go.sum /app/commons/
COPY ./commons/src /app/commons/src
# Change working directory to where the Go app's main module is located
WORKDIR /app/mqtt-preprocessor
# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod tidy
RUN go mod download
# Build the Go app
RUN CGO_ENABLED=0 GOOS=linux go build -o SfPDfSD-mqtt-preprocessor src/main.go
# Run the executable
CMD ["/app/mqtt-preprocessor/SfPDfSD-mqtt-preprocessor"]
