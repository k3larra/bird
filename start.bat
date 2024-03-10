@echo off

REM Navigate to your project directory
cd flask\birdweb/

REM Activate the virtual environment
.venv\Scripts\activate

REM Set the FLASK_APP environment variable
set FLASK_APP=birdnest

REM Optionally, enable debug mxode
REM set FLASK_ENV=development

REM Start the Flask server
start cmd /k flask run --debugger

REM Navigate to your Node.js server directory
cd ../../node/

REM Start the Node.js server
start cmd /k node nodebird.js