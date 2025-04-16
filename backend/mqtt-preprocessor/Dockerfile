# Use an official Go runtime as a parent image
FROM golang:1.24.1-alpine AS build
# Set the working directory inside the container
WORKDIR /app

# Copy dependencies for commons and mqtt preprocessor
COPY ./commons/go.mod ./commons/go.sum /app/commons/
COPY ./mqtt-preprocessor/go.mod ./mqtt-preprocessor/go.sum /app/mqtt-preprocessor/

# Change working directory to where the Go app's main module is located
WORKDIR /app/mqtt-preprocessor

# Download all dependencies
RUN go mod download

# Copy source code
COPY ./commons/src /app/commons/src
COPY ./mqtt-preprocessor/src /app/mqtt-preprocessor/src

# Build the Go app
RUN CGO_ENABLED=0 GOOS=linux go build -o RIoT-mqtt-preprocessor src/main.go

# Move to production alpine image
FROM alpine AS prod

COPY --from=build /app/mqtt-preprocessor/RIoT-mqtt-preprocessor /app/mqtt-preprocessor/RIoT-mqtt-preprocessor

CMD ["/app/mqtt-preprocessor/RIoT-mqtt-preprocessor"]
