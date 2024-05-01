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

### Start all services

The following command can be used to start the complementary services and the system in configuration 1-1-1.

```shell
docker-compose up --build -d 
```

- the `--build` flag ensures that the Docker images of the system services are built from the latest source code...
- the `-d` flag ensures that the containers keep running in case the terminal is closed...

#### Start multiple instances of 'Message processing unit'

To start multiple instance of 'Message processing unit', one uses the parameter `--scale` together with the service
identifier `sfpdfsd-message-processing-unit` and number of instances he plans to start. The following command can be used
to start the system in configuration 1-3-1: 1 instance of '**Backend core**', 3 instances of '**Message processing unit**' and 1 instance
of '**MQTT preprocessor**'.

```shell
docker-compose up --build -d --scale sfpdfsd-message-processing-unit=3
```

Notice: For this to benefit the system performance characteristics, one has to simulate the deployment of '**Message processing unit**' instance onto separate nodes (machines) using a resource-constrained containers.

### Stop all services

```shell
docker-compose down
```

## Using and testing the system

Upon the completion of the `docker-compose up --build -d` command, the system should be fully operational and ready for usage and testing.
You can access the system through its [frontend](http://localhost:8080).
Remember that while running the system this way is fine for functionality testing, it may lead to suboptimal performance characteristics, as
the system running on a single node (machine) in 1-1-1 configuration does not represent an optimal deployment.

![](frontend/resources/images/homepage-graphics.jpg)
