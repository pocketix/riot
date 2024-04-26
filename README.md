# System for Processing Data from Smart Devices
a Bachelor thesis project of Michal Bureš

## Prerequisites

- Supported operating system
  - Windows
    - Including PowerShell 5.1 or later
  - Linux
    - No extra requirements regarding Linux
  - WSL
    - Use Linux commands
- Go runtime
  - Version 1.21 or later
- Docker
  - Version 20.10.20 or later
- Docker compose
  - Version 1.25.0 or later
- Npm
  - 8.19.2 or later

## Important notes: read before proceeding

- For all commands to work, one must run them from the root directory of the project
- The root directory contains the following files and directories:
  - README.md (file)
  - docker-compose.yml (file)
  - .gitingore (file)
  - .gitattributes (file)
  - docker (directory)
  - backend (directory)
  - frontend (directory)
- Without the complementary services running the system will either not work as expected or not at all
  - The pgAdmin service is optional – it is useful mainly for debugging purposes
- Without at least one instance of all backend services ('**Backend core**', '**Message processing unit**', '**MQTT preprocessor**') running, the frontend of the system will not work as expected
- Check that the ports required by the system, and it's complementary services are free on your system:
  - Mosquitto MQTT broker
    - 9001
    - 1883
  - PostgreSQL database
    - 5432
  - RabbitMQ messaging and streaming broker
    - 5672
    - 15672
  - pgAdmin database administration tool (optional)
    - 8081
  - GraphQL API of the '**Backend core**' service
    - 9090
  - Frontend of the system
    - 1234

## Run the complementary services (Mosquitto MQTT broker, PostgreSQL database, RabbitMQ messaging and streaming broker and pgAdmin database administration tool)
- To run all complementary services, run:
```shell
docker-compose up
```
- To stop all complementary services, run:
```shell
docker-compose down
```

## Build and run the backend services

### 1. 'Backend core'

#### Windows (requires PowerShell 5.1 or later)

```shell
cd backend/backend-core/src; if (Test-Path "../../bin/SfPDfSD-backend-core.exe") {Remove-Item "../../bin/SfPDfSD-backend-core.exe" -Force}; go build -o ../../bin/SfPDfSD-backend-core.exe; cd ../../..; if (Test-Path "./backend/bin/SfPDfSD-backend-core.exe") {./backend/bin/SfPDfSD-backend-core.exe} else {Write-Output "'Backend core': executable not found."}
```

#### Linux

```shell
cd backend/backend-core/src && rm -rf ./../../bin/SfPDfSD-backend-core && go build -o ../../bin/SfPDfSD-backend-core && cd ../.. && ./bin/SfPDfSD-backend-core
```

### 2. 'Message processing unit'

TODO: Implement & supply commands

### 3. 'MQTT preprocessor'

TODO: Implement & supply commands

## Build and run the frontend of the system

The following command should work on both Windows (PowerShell 5.1 or later) and Linux.:

```shell
cd frontend; npm install; npm run start
```

## Using and testing the system

Upon completing all previously mentioned steps, the system should be fully operational and ready for usage and testing.
You can access the system through its [frontend](http://localhost:1234).
Remember that running the provided commands leads to running a single instance of all backend services along with the complementary services
and frontend on a single machine. This is fine for functionality testing. However, the system is not actually supposed to be
deployed this way and so running it like this can lead to suboptimal performance characteristics.

![](frontend/resources/images/homepage-graphics.jpg)
