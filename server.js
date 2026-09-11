const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Colourful palette for user names
const COLORS = [
  '#FF5C8A', '#FF9F45', '#FFD93D', '#6BCB77',
  '#4D96FF', '#9B5DE5', '#F15BB5', '#00BBF9',
  '#00F5D4', '#FEE440', '#FF6B6B', '#4ECDC4'
];

const users = {}; // socket.id -> { name, color, avatar }
let currentVideo = { type: 'none', url: '', videoId: '', time: 0, playing: false, updatedAt: Date.now() };

// 📋 Shared playlist state (sab ke liye same queue!)
let queue = [];       // [{ type, url, videoId, label, by }]
let qIndex = -1;      // -1 = kuch play nahi ho raha
let lastAdvance = 0;  // duplicate 'ended' events ka guard

function getUserList() {
  return Object.values(users);
}

// Late joiner ke liye: agar video play ho rahi hai to guzra hua waqt add karo
function stateForNewUser() {
  const s = { ...currentVideo };
  if (s.playing && s.type !== 'none') {
    s.time = Math.max(0, s.time + (Date.now() - s.updatedAt) / 1000);
  }
  return s;
}

function broadcastQueue() {
  io.emit('queue-state', { items: queue, index: qIndex });
}

function serverLabel(d) {
  if (d.type === 'youtube') return 'YT: ' + (d.videoId || '');
  try {
    const seg = String(d.url || '').split('?')[0].split('/').pop() || '';
    const name = decodeURIComponent(seg);
    if (/\.(mp3|wav|ogg|m4a)$/i.test(name)) return '🎵 ' + (name.slice(0, 28) || 'MP3 song');
    return '🎞 ' + (name.slice(0, 28) || 'video');
  } catch (e) { return '🎞 video'; }
}

// queue ka i-wan item sab ke pas chalao
function playIndex(i) {
  if (i < 0 || i >= queue.length) return false;
  qIndex = i;
  const it = queue[i];
  currentVideo = {
    type: it.type, url: it.url || '', videoId: it.videoId || '',
    time: 0, playing: true, updatedAt: Date.now()
  };
  lastAdvance = Date.now();
  io.emit('video-load', { ...currentVideo, by: '📋 Playlist' });
  broadcastQueue();
  return true;
}

function playNext() {
  if (!playIndex(qIndex + 1)) {
    // playlist khatam
    qIndex = queue.length;
    currentVideo.playing = false;
    currentVideo.updatedAt = Date.now();
    io.emit('queue-ended');
    broadcastQueue();
  }
}

// 🖼️ DP validate karo (size limit ke sath — safety!)
function cleanAvatar(a) {
  if (!a || typeof a !== 'object') return { type: 'letter' };
  if (a.type === 'upload' && typeof a.data === 'string' && a.data.startsWith('data:image/')) {
    return { type: 'upload', data: a.data.slice(0, 100000) };
  }
  if (a.type === 'dicebear' && typeof a.url === 'string' && a.url.startsWith('https://api.dicebear.com/')) {
    return { type: 'dicebear', url: a.url.slice(0, 300) };
  }
  return { type: 'letter' };
}

io.on('connection', (socket) => {
  socket.emit('video-state', stateForNewUser());
  socket.emit('user-list', getUserList());
  socket.emit('queue-state', { items: queue, index: qIndex });

  socket.on('join', (data) => {
    let name = 'Guest';
    let avatar = { type: 'letter' };
    if (typeof data === 'string') {
      name = data;
    } else if (data && typeof data === 'object') {
      name = data.name || 'Guest';
      avatar = cleanAvatar(data.avatar);
    }
    name = String(name).trim().slice(0, 20) || 'Guest';
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    users[socket.id] = { name, color, avatar };
    io.emit('user-list', getUserList());
    io.emit('system-message', `${name} party me join ho gaya 🎉`);
    socket.emit('video-state', stateForNewUser());
    socket.emit('queue-state', { items: queue, index: qIndex });
  });

  socket.on('chat-message', (data) => {
    const user = users[socket.id];
    if (!user) return;
    let text = '', reply = null;
    if (typeof data === 'string') {
      text = data;
    } else if (data && typeof data === 'object') {
      text = data.text || '';
      if (data.reply && typeof data.reply === 'object') {
        reply = {
          name: String(data.reply.name || '').slice(0, 20),
          text: String(data.reply.text || '').slice(0, 120)
        };
      }
    }
    text = String(text || '').trim().slice(0, 500);
    if (!text) return;
    const d = new Date();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    io.emit('chat-message', {
      name: user.name,
      color: user.color,
      avatar: user.avatar,
      text,
      reply,
      time,
      senderId: socket.id
    });
  });

  socket.on('typing', () => {
    const user = users[socket.id];
    if (user) socket.broadcast.emit('typing', user.name);
  });
  socket.on('stop-typing', () => socket.broadcast.emit('stop-typing'));

  // ▶ Play now: foran chalao + queue fresh (sirf ye video)
  socket.on('video-load', (data) => {
    const by = users[socket.id] ? users[socket.id].name : 'Someone';
    const item = {
      type: data.type, url: data.url || '', videoId: data.videoId || '',
      label: data.label || serverLabel(data), by
    };
    queue = [item];
    qIndex = 0;
    currentVideo = {
      type: item.type, url: item.url, videoId: item.videoId,
      time: 0, playing: true, updatedAt: Date.now()
    };
    socket.broadcast.emit('video-load', { ...currentVideo, by });
    broadcastQueue();
  });

  socket.on('video-play', (time) => {
    currentVideo.time = Number(time) || 0;
    currentVideo.playing = true;
    currentVideo.updatedAt = Date.now();
    socket.broadcast.emit('video-play', currentVideo.time);
  });

  socket.on('video-pause', (time) => {
    currentVideo.time = Number(time) || 0;
    currentVideo.playing = false;
    currentVideo.updatedAt = Date.now();
    socket.broadcast.emit('video-pause', currentVideo.time);
  });

  socket.on('video-seek', (time) => {
    currentVideo.time = Number(time) || 0;
    currentVideo.updatedAt = Date.now();
    socket.broadcast.emit('video-seek', currentVideo.time);
  });

  // 🔄 Manual re-sync
  socket.on('sync-all', (data) => {
    const t = Math.max(0, Number((data && data.time) || 0));
    const playing = !!(data && data.playing);
    currentVideo.time = t;
    currentVideo.playing = playing;
    currentVideo.updatedAt = Date.now();
    const by = users[socket.id] ? users[socket.id].name : 'Someone';
    socket.broadcast.emit('video-sync-force', { time: t, playing, by });
  });

  // 📋 ---- PLAYLIST EVENTS ----
  socket.on('queue-add', (data) => {
    const name = users[socket.id] ? users[socket.id].name : 'Someone';
    const item = {
      type: data.type, url: data.url || '', videoId: data.videoId || '',
      label: data.label || serverLabel(data), by: name
    };
    queue.push(item);
    io.emit('system-message', `➕ ${name} ne queue me add kiya: ${item.label.slice(0, 40)}`);
    // agar kuch play nahi ho raha ya playlist khatam thi → foran shuru karo
    if (qIndex < 0 || qIndex >= queue.length - 1) playIndex(Math.max(0, qIndex));
    else broadcastQueue();
  });

  socket.on('queue-remove', (idx) => {
    idx = Number(idx);
    if (!Number.isInteger(idx) || idx < 0 || idx >= queue.length) return;
    const [gone] = queue.splice(idx, 1);
    if (idx <= qIndex) qIndex--;
    const name = users[socket.id] ? users[socket.id].name : 'Someone';
    io.emit('system-message', `🗑 ${name} ne hataya: ${(gone.label || '').slice(0, 40)}`);
    broadcastQueue();
  });

  socket.on('queue-clear', () => {
    queue = [];
    qIndex = -1;
    const name = users[socket.id] ? users[socket.id].name : 'Someone';
    io.emit('system-message', `🗑 ${name} ne playlist saaf kar di`);
    broadcastQueue();
  });

  socket.on('queue-play', (idx) => {
    idx = Number(idx);
    if (!Number.isInteger(idx) || idx < 0 || idx >= queue.length) return;
    playIndex(idx); // io.emit → bhejne wale समेत sab load karenge
  });

  // kisi ka video khatam → next auto-play (duplicate guard ke sath)
  socket.on('video-ended', () => {
    if (Date.now() - lastAdvance < 3000) return;
    playNext();
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      delete users[socket.id];
      io.emit('user-list', getUserList());
      io.emit('system-message', `${user.name} chala gaya 👋`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎬 Watch Party running on port ${PORT}`);
});
