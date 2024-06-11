# Use an official Go runtime as a parent image
FROM golang:1.22-alpine
# Set the working directory inside the container
WORKDIR /app
# Copy the go.mod file, go.sum file, and src directory from message-processing-unit
COPY ./message-processing-unit/go.mod ./message-processing-unit/go.sum /app/message-processing-unit/
COPY ./message-processing-unit/src /app/message-processing-unit/src
# Copy the go.mod file, go.sum file, and src directory from commons
COPY ./commons/go.mod ./commons/go.sum /app/commons/
COPY ./commons/src /app/commons/src
# Change working directory to where the Go app's main module is located
WORKDIR /app/message-processing-unit
# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod tidy
RUN go mod download
# Build the Go app
RUN CGO_ENABLED=0 GOOS=linux go build -o RIoT-message-processing-unit src/main.go
# Run the executable
CMD ["/app/message-processing-unit/RIoT-message-processing-unit"]
