# System for Processing Data from Smart Devices
a Bachelor thesis project of Michal Bureš

## Prerequisites

- Docker 20.10.20 or later
- Docker Compose 2.12.0 or later

## Important notes: read before proceeding

- Check that the ports required by the system, and its complementary services are free on your system:
  - System
    - GraphQL API of the '**Backend core**' backend service
      - 9090
    - Frontend of the system
      - 8080
  - Complementary services
    - Mosquitto MQTT broker
      - 9001
      - 1883
    - PostgreSQL relational database
      - 5432
    - RabbitMQ messaging and streaming broker
      - 5672
      - 15672
    - pgAdmin database administration tool (optional, useful mainly for debugging purposes)
      - 8081

## Running the system

### Start all services:

```shell
docker-compose up --build -d
```

- the `--build` flag ensures that the Docker images of the system services are built from the latest source code...
- the `-d` flag ensures that the containers keep running in case the terminal is closed...

### Stop all services:
```shell
docker-compose down
```

## Using and testing the system

Upon the completion of the `docker-compose up --build -d` command, the system should be fully operational and ready for usage and testing.
You can access the system through its [frontend](http://localhost:8080).
Remember that while running the system this way is fine for simple functionality testing, it may lead to suboptimal performance characteristics, as
the current Docker Compose configuration does not yet represent a performance-calibrated deployment strategy.

![](frontend/resources/images/homepage-graphics.jpg)
