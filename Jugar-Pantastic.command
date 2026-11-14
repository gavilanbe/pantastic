#!/bin/zsh
# Abre Pantastic! en el navegador.
cd "$(dirname "$0")"
PORT=5183
lsof -ti tcp:$PORT | xargs kill 2>/dev/null
node tools/serve.mjs $PORT &
sleep 0.6
open "http://127.0.0.1:$PORT/"
wait
