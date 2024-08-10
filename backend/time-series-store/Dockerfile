# Use an official Go runtime as a parent image
FROM golang:1.22-alpine
# Set the working directory inside the container
WORKDIR /app
# Copy the go.mod file, go.sum file, and src directory from time-series-store
COPY ./time-series-store/go.mod ./time-series-store/go.sum /app/time-series-store/
COPY ./time-series-store/src /app/time-series-store/src
# Copy the go.mod file, go.sum file, and src directory from commons
COPY ./commons/go.mod ./commons/go.sum /app/commons/
COPY ./commons/src /app/commons/src
# Change working directory to where the Go app's main module is located
WORKDIR /app/time-series-store
# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod tidy
RUN go mod download
# Build the Go app
RUN CGO_ENABLED=0 GOOS=linux go build -o RIoT-time-series-store src/main.go
# Run the executable
CMD ["/app/time-series-store/RIoT-time-series-store"]
