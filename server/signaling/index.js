const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT ? parseInt(process.env.PORT) : 6001 });

console.log('Signaling server listening on port', process.env.PORT || 6001);

// Maps
const users = new Map(); // userId -> ws
const callQueues = new Map(); // calleeId -> [ { callId, offer, callerId } ]

function safeSend(ws, obj) {
  try { ws.send(JSON.stringify(obj)); } catch (e) { }
}

wss.on('connection', (ws, req) => {
  ws.isAlive = true;
  ws.on('pong', () => ws.isAlive = true);

  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }

    const { type, payload } = msg;

    if (type === 'register') {
      const { userId } = payload || {};
      if (userId) {
        users.set(String(userId), ws);
        ws.userId = String(userId);
        // deliver queued calls if any
        const queue = callQueues.get(String(userId)) || [];
        queue.forEach(item => {
          safeSend(ws, { type: 'incoming-call', payload: item });
        });
        callQueues.delete(String(userId));
      }
      return;
    }

    if (type === 'call-created') {
      const { callId, calleeId, offer, callerId } = payload || {};
      const target = users.get(String(calleeId));
      const msgObj = { type: 'incoming-call', payload: { callId, offer, callerId } };
      if (target && target.readyState === WebSocket.OPEN) {
        safeSend(target, msgObj);
      } else {
        const q = callQueues.get(String(calleeId)) || [];
        q.push({ callId, offer, callerId });
        callQueues.set(String(calleeId), q);
      }
      return;
    }

    if (type === 'call-answer') {
      const { callId, answer, toUserId } = payload || {};
      const target = users.get(String(toUserId));
      if (target && target.readyState === WebSocket.OPEN) {
        safeSend(target, { type: 'call-answer', payload: { callId, answer } });
      }
      return;
    }

    if (type === 'ice-candidate') {
      const { callId, candidate, toUserId } = payload || {};
      const target = users.get(String(toUserId));
      if (target && target.readyState === WebSocket.OPEN) {
        safeSend(target, { type: 'ice-candidate', payload: { callId, candidate } });
      }
      return;
    }

    if (type === 'call-end') {
      const { callId, toUserId } = payload || {};
      const target = users.get(String(toUserId));
      if (target && target.readyState === WebSocket.OPEN) {
        safeSend(target, { type: 'call-end', payload: { callId } });
      }
      return;
    }
  });

  ws.on('close', () => {
    if (ws.userId) users.delete(String(ws.userId));
  });
});

// simple ping to detect dead connections
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);
