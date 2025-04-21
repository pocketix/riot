# Use an official Go runtime as a parent image
FROM golang:1.24.2-alpine AS build
# Set the working directory inside the container
WORKDIR /app

# Copy dependencies for commons and message processing unit
COPY ./commons/go.mod ./commons/go.sum /app/commons/
COPY ./interpret-unit/go.mod ./interpret-unit/go.sum /app/interpret-unit/

# Change working directory to where the Go app's main module is located
WORKDIR /app/interpret-unit

# Download all dependencies
RUN go mod download

# Copy source code
COPY ./commons/src /app/commons/src
COPY ./interpret-unit/src /app/interpret-unit/src

RUN CGO_ENABLED=0 GOOS=linux go build -o RIoT-interpret-unit src/main.go

# Move to production alpine image
FROM alpine AS prod

COPY --from=build /app/interpret-unit/RIoT-interpret-unit /app/interpret-unit/RIoT-interpret-unit

CMD ["/app/interpret-unit/RIoT-interpret-unit"]
