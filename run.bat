@echo off
echo "Starting server! Please wait ..."
rem "Starting StuckWanYah server"
set title = "Starting StuckWanYah server"
title %title%
echo "Starting MongoDB Client"
cd "..\..\..\..\Program Files\MongoDB\Server\3.2\bin"
call "mongod --config mongodb.config"

cd "..\..\..\..\Users\WebstormProjects\StuckWanYah"
echo "Starting StuckWanYah server"
call "nodemon server.js"