# Use an official Go runtime as a parent image
FROM golang:1.24.1-alpine AS build
# Set the working directory inside the container
WORKDIR /app
# Copy the go.mod file, go.sum file, and src directory from time-series-store
COPY ./commons/go.mod ./commons/go.sum /app/commons/
COPY ./time-series-store/go.mod ./time-series-store/go.sum /app/time-series-store/

# Change working directory to where the Go app's main module is located
WORKDIR /app/time-series-store

# Download all dependencies
RUN go mod download

# Copy source code
COPY ./commons/src /app/commons/src
COPY ./time-series-store/src /app/time-series-store/src

# Build the Go app
RUN CGO_ENABLED=0 GOOS=linux go build -o RIoT-time-series-store src/main.go

# Move to production alpine image
FROM alpine AS prod

COPY --from=build /app/time-series-store/RIoT-time-series-store /app/time-series-store/RIoT-time-series-store

CMD ["/app/time-series-store/RIoT-time-series-store"]
