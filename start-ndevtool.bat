@echo off
SET PATH=C:\Program Files\nodejs;%USERPROFILE%\.local\bin;%PATH%
cd /d "%~dp0"
start "" "node_modules\electron\dist\electron.exe" .
