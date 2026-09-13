/* Attach to a node --inspect target, pause it, and dump the blocked stack. */
const port = process.argv[2] || '9230';

async function main() {
  const list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
  const wsUrl = list[0].webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = {};
  const send = (method, params) => new Promise((res) => {
    const mid = ++id;
    pending[mid] = res;
    ws.send(JSON.stringify({ id: mid, method, params: params || {} }));
  });
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending[msg.id]) { pending[msg.id](msg.result); delete pending[msg.id]; }
    if (msg.method === 'Debugger.paused') {
      const frames = (msg.params.callFrames || []).slice(0, 12).map((f) =>
        f.functionName + ' @ ' + (f.url || '?') + ':' + (f.location.lineNumber + 1));
      console.log('=== BLOCKED STACK ===');
      frames.forEach((f) => console.log('  ' + f));
      process.exit(0);
    }
  };
  await new Promise((r) => { ws.onopen = r; });
  await send('Debugger.enable');
  await send('Debugger.pause');
  setTimeout(() => { console.log('pause-timeout — no paused event'); process.exit(1); }, 8000);
}
main().catch((e) => { console.error('inspector-error: ' + e.message); process.exit(1); });
