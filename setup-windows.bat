@echo off
echo Installing ComicCraft backend...
cd backend
call npm install
if not exist .env copy .env.example .env
cd ..\frontend
echo Installing ComicCraft frontend...
call npm install
cd ..
echo.
echo Setup complete.
echo 1. Edit backend\.env and add GEMINI_API_KEY
echo 2. Open Terminal 1: cd backend ^&^& npm run dev
echo 3. Open Terminal 2: cd frontend ^&^& npm run dev
pause
