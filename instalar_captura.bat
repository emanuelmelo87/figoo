@echo off
title figoo - Instalar Captura Rapida
echo.
echo  figoo . Captura Rapida - Instalacao
echo  =====================================
echo.

:: Verifica se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo  ERRO: Python nao encontrado.
    echo  Instale em https://python.org e marque "Add to PATH"
    pause
    exit /b 1
)

echo  Python encontrado. Instalando dependencias...
echo.
pip install requests cryptography pystray Pillow keyboard

echo.
echo  =====================================
echo  Instalacao concluida!
echo.
echo  Para iniciar: execute  iniciar_captura.bat
echo  Ou corra directamente: python captura_rapida.py
echo.
pause
