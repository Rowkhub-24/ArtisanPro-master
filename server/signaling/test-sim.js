const WebSocket = require('ws');

const url = 'ws://localhost:6001';

function makeClient(id) {
  const ws = new WebSocket(url);
  ws.id = id;
  ws.on('open', () => {
    console.log(id, 'connected');
    ws.send(JSON.stringify({ type: 'register', payload: { userId: id } }));
  });
  ws.on('message', (m) => {
    const msg = JSON.parse(m);
    console.log(id, 'recv', msg.type, msg.payload || '');
    if (msg.type === 'incoming-call') {
      // automatically answer
      const callId = msg.payload.callId || 'call1';
      const answer = { type: 'answer', sdp: 'dummy-answer' };
      ws.send(JSON.stringify({ type: 'call-answer', payload: { callId, answer, toUserId: msg.payload.callerId } }));
    }
  });
  ws.on('error', (e) => console.error(id, 'error', e.message));
  return ws;
}

async function main() {
  const a = makeClient('100');
  const b = makeClient('200');

  // wait for both to connect
  await new Promise((r) => setTimeout(r, 1000));

  // send call-created from 100 to 200
  const offer = { type: 'offer', sdp: 'dummy-offer' };
  a.send(JSON.stringify({ type: 'call-created', payload: { callId: 'call1', calleeId: '200', offer, callerId: '100' } }));

  // wait for answer to be relayed back
  await new Promise((r) => setTimeout(r, 1000));

  console.log('Test complete, exiting.');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(2); });
