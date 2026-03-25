Share a live preview of the current dev server via ngrok.

Steps:
1. Get the port: run `node scripts/pick-port.js` and note it (also stored in `.port`)
2. Check if the dev server is running on that port: `curl -s --max-time 2 http://localhost:$(cat .port) > /dev/null 2>&1 && echo running || echo stopped`
3. If stopped, start it in the background: `PORT=$(cat .port) pnpm exec next dev > /tmp/dev-server-$(cat .port).log 2>&1 &` — then poll until ready: `for i in $(seq 1 15); do curl -s --max-time 2 http://localhost:$(cat .port) > /dev/null 2>&1 && echo "Server ready on port $(cat .port)" && break || sleep 2; done`
4. Kill any existing ngrok on this port to avoid conflicts: `pkill -f "ngrok http $(cat .port)" 2>/dev/null || true`
5. Start ngrok in the background: `ngrok http $(cat .port) --log=stdout > /tmp/ngrok-$(cat .port).log 2>&1 &`
6. Wait briefly then fetch the public URL from the ngrok API: `sleep 2 && curl -s http://localhost:4040/api/tunnels | node -e "process.stdin.resume(); let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ const t=JSON.parse(d).tunnels; const url=t.find(x=>x.proto==='https')?.public_url || t[0]?.public_url; console.log(url ? 'Preview URL: ' + url : 'Could not get URL - check /tmp/ngrok-' + require('fs').readFileSync('.port','utf8').trim() + '.log'); })"`
7. Print the preview URL clearly for the user
