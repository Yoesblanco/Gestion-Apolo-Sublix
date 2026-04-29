@echo off
title Gestion Apolo Sublix - Lanzador
color 0b

echo ==========================================
echo    INICIANDO SISTEMA APOLO SUBLIX
echo ==========================================
echo.

:: Obtener la ruta del script
set BASE_DIR=%~dp0

echo [1/3] Iniciando Servidor de Datos (Backend)...
start "Backend - Apolo Sublix" /min cmd /c "cd /d %BASE_DIR%server && node index.js"

echo [2/3] Iniciando Interfaz de Usuario (Frontend)...
start "Frontend - Apolo Sublix" /min cmd /c "cd /d %BASE_DIR% && npm run dev"

echo [3/3] Esperando que los motores calienten...
timeout /t 8 /nobreak > nul

echo.
echo [!] Abriendo aplicacion en el navegador...
start http://localhost:5173

echo.
echo ==========================================
echo    SISTEMA LISTO Y CORRIENDO
echo ==========================================
echo Puedes cerrar esta ventana, pero NO cierres las
echo ventanas que se abrieron minimizadas.
echo.
pause
