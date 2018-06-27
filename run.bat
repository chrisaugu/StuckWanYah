@echo off

rem Starting StuckWanYah server

echo Starting MongoDB Client

cd ..\..\..\..\Program Files\MongoDB\Server\3.2\bin

call mongod --config mongodb.config

cd ..\..\..\..\Users\WebstormProjects

echo Starting StuckWanYah server

nodemon server.js

:end