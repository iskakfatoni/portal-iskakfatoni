@echo off
title Build Portal Iskak Fatoni Desktop App (.EXE)
echo ============================================================
echo   BUILD PORTAL ISKAK FATONI - WINDOWS DESKTOP APP (.EXE)
echo ============================================================
echo.

set CSC="C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"

if not exist %CSC% (
    echo [ERROR] C# Compiler csc.exe tidak ditemukan di direktori .NET Framework!
    pause
    exit /b 1
)

echo [1/2] Menyusun C# Source Code ke Portal-IskakFatoni.exe...
%CSC% /target:winexe /optimize+ /platform:x64 /win32icon:app_icon.ico /reference:System.dll,System.Windows.Forms.dll,System.Drawing.dll,System.Core.dll,Microsoft.Web.WebView2.Core.dll,Microsoft.Web.WebView2.WinForms.dll /out:Portal-IskakFatoni.exe src\Program.cs

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Proses kompilasi gagal!
    pause
    exit /b 1
)

echo.
echo ============================================================
echo [SUKSES] File Portal-IskakFatoni.exe berhasil dibuat!
echo Lokasi: %~dp0Portal-IskakFatoni.exe
echo ============================================================
echo.
pause
