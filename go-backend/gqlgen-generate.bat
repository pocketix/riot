@echo off
REM Run gqlgen generate using the gqlgen version that's specified in go.mod
go run github.com/99designs/gqlgen -v generate

REM Pause the output so you can see any messages
pause
