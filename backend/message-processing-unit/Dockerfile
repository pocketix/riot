# Use an official Go runtime as a parent image
FROM golang:1.24.1-alpine AS build
# Set the working directory inside the container
WORKDIR /app

# Copy dependencies for commons and message processing unit
COPY ./commons/go.mod ./commons/go.sum /app/commons/
COPY ./message-processing-unit/go.mod ./message-processing-unit/go.sum /app/message-processing-unit/

# Change working directory to where the Go app's main module is located
WORKDIR /app/message-processing-unit

# Download all dependencies
RUN go mod download

# Copy source code
COPY ./commons/src /app/commons/src
COPY ./message-processing-unit/src /app/message-processing-unit/src

RUN CGO_ENABLED=0 GOOS=linux go build -o RIoT-message-processing-unit src/main.go

# Move to production alpine image
FROM alpine AS prod

COPY --from=build /app/message-processing-unit/RIoT-message-processing-unit /app/message-processing-unit/RIoT-message-processing-unit

CMD ["/app/message-processing-unit/RIoT-message-processing-unit"]
