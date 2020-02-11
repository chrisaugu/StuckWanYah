@echo off

goto setenv

:setenv
set "title" = "Test StuckWanYah on secure connections"
title %title%
echo "Initializing StuckWanYah server"
echo "Starting StuckWanYah server"
rem echo "Starting MongoDB Client"
rem cd "..\..\..\..\Program Files\MongoDB\Server\3.2\bin"
rem call "mongod --config mongodb.config"

rem cd "..\..\..\..\Users\WebstormProjects\StuckWanYah"
cd ".\instantgame"
echo "Please wait ..."
goto openbrowser

rem PROMPT %username%@%computername%$S$P$_#$S
:startserver
http-server --ssl -c-1 -p 8080 -a 127.0.0.1
goto :eof

:openbrowser
start chrome "https://127.0.0.1:8080"
goto startserver