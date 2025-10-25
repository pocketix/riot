# Use an official Go runtime as a parent image
FROM golang:1.24.1-alpine AS build
# Set the working directory inside the container
WORKDIR /app

# Copy dependencies for commons and backend core
COPY ./commons/go.mod ./commons/go.sum /app/commons/
COPY ./backend-core/go.mod ./backend-core/go.sum /app/backend-core/

WORKDIR /app/backend-core

# Download all dependencies
RUN go mod download

# Copy source code
COPY ./commons/src /app/commons/src
COPY ./backend-core/src /app/backend-core/src

RUN CGO_ENABLED=0 GOOS=linux go build -o RIoT-backend-core src/main.go

# Move to production alpine image
FROM alpine AS prod

COPY --from=build /app/backend-core/RIoT-backend-core /app/backend-core/RIoT-backend-core

# Copy the GraphQL schema file
COPY --from=build /app/backend-core/src/api/graphql/schema.graphqls /app/backend-core/schema.graphqls

CMD ["/app/backend-core/RIoT-backend-core"]
