# System for Processing Data from Smart Devices
a Bachelor thesis project of Michal Bureš...

## Prerequisites

- Supported operating system
  - Windows
    - Including powershell 7 or later or WSL
    - If you decide to use WSL, use the Linux variants of commands and command sequences
  - Linux
    - No extra requirements regarding Linux, just use some "normal" distribution
- Go
  - Version 1.21 or later
- Docker
  - Version 20.10.20 or later
- Docker compose
  - Version 1.25.0 or later
- Npm
  - 8.19.2 or later

## Important notes

- For all commands and command sequences to work, one must run them from the root directory of the project...
- The root directory contains the following files and directories:
  - README.md (file)
  - docker (directory)
  - docker-compose.yml (file)
  - go-backend (directory)
  - parcel-react-frontend (directory)
- Without the support services running the back-end of the system will either not work as expected or not at all
- Without the back-end of the system running, the front-end of the system will not behave as expected
- Check that the required ports are free on your system:
  - Mosquitto MQTT broker
    - 9001
    - 1883
  - PostgreSQL database
    - 5432
  - pgAdmin
    - 8081
  - System back-end
    - 9090
  - System front-end
    - 1234

## Run the support services (PostgreSQL database, pgAdmin, Mosquitto MQTT broker, ...)
- To run the support services, use:
```shell
docker-compose up
```
- To stop running the support services, use:
```shell
docker-compose down
```
or simply use the Ctrl+C key combination...

## Run the back-end of the system

### Windows (requires PowerShell 7 or later)

```shell
cd go-backend/src && Remove-Item -Path "../bin/SfPDfSD.exe" -Force && go build -o ../bin/SfPDfSD.exe && cd .. && ./bin/SfPDfSD.exe
```

### Linux
```shell
cd go-backend/src && rm -rf ./../bin/SfPDfSD && go build -o ../bin/SfPDfSD && cd .. && ./bin/SfPDfSD
```

## Run the front-end of the system

```shell
cd parcel-react-frontend && npm run start
```

![Project graphics](parcel-react-frontend/resources/images/homepage-graphics.jpg)
