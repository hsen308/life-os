@echo off
title LifeOS
cd /d "%~dp0"
echo Starting LifeOS...
start http://localhost:5173
npm run dev
