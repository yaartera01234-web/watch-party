const socket = io();

let myName = '';
let myId = null;
let myAvatar = { type: 'letter' }; // 🖼️ meri DP
let replyTo = null; // ↩️ jis msg ka reply ho raha hai { name, text }
let currentType = 'none'; // 'youtube' | 'mp4' | 'none'
let ytPlayer = null;
let ytReady = false;
let ytPlaying = false;
let suppressYT = false;   // remote command chal raha ho to event ignore karo
let suppressMP4 = false;
let pendingYTVideo = null; // API ready hone se pehle video aye to

const $ = (id) => document.getElementById(id);
const joinScreen = $('join-screen'), app = $('app');
const nameInput = $('name-input'), joinBtn = $('join-btn');
const urlInput = $('url-input'), loadBtn = $('load-btn');
const ytDiv = $('yt-player'), mp4 = $('mp4-player'), noVideo = $('no-video');
const nowPlaying = $('now-playing');
const chatBox = $('chat-messages'), chatInput = $('chat-input'), sendBtn = $('send-btn');
const userList = $('user-list'), userCount = $('user-count'), onlineCount = $('online-count');
const typingInd = $('typing-indicator'), newMsgBtn = $('new-msg-btn');
const replyBar = $('reply-bar'), rbName = $('rb-name'), rbMsg = $('rb-msg');

socket.on('connect', () => { myId = socket.id; });

/* ---------- 🖼️ DP PICKER (join screen) ---------- */
function renderJoinAvatar() {
  const prev = $('avatar-preview');
  prev.innerHTML = '';
  if (myAvatar.type === 'upload' && myAvatar.data) {
    const img = document.createElement('img');
    img.src = myAvatar.data;
    prev.appendChild(img);
  } else if (myAvatar.type === 'dicebear' && myAvatar.url) {
    const img = document.createElement('img');
    img.src = myAvatar.url;
    img.onerror = () => { myAvatar = { type: 'letter' }; renderJoinAvatar(); };
    prev.appendChild(img);
  } else {
    const n = (nameInput.value.trim()[0] || '😎').toUpperCase();
    const sp = document.createElement('span');
    sp.textContent = n;
    prev.appendChild(sp);
  }
}
nameInput.addEventListener('input', () => { if (myAvatar.type === 'letter') renderJoinAvatar(); });
$('avatar-shuffle-btn').onclick = () => {
  const seed = Math.random().toString(36).slice(2, 10);
  myAvatar = { type: 'dicebear', url: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=' + seed };
  renderJoinAvatar();
};
$('avatar-upload-btn').onclick = () => $('avatar-file').click();
$('avatar-file').addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  if (!f.type.startsWith('image/')) { alert('Sirf photo select karo! 📷'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s) / 2, sy = (img.height - s) / 2;
      const c = document.createElement('canvas');
      c.width = 96; c.height = 96;
      c.getContext('2d').drawImage(img, sx, sy, s, s, 0, 0, 96, 96);
      myAvatar = { type: 'upload', data: c.toDataURL('image/jpeg', 0.7) };
      renderJoinAvatar();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(f);
});
renderJoinAvatar();

function avatarEl(avatar, name, color, size) {
  size = size || 34;
  const d = document.createElement('div');
  d.className = 'avatar';
  d.style.width = d.style.height = size + 'px';
  d.style.fontSize = Math.round(size * 0.45) + 'px';
  const letter = ((name || '?').trim()[0] || '?').toUpperCase();
  if (avatar && avatar.type === 'upload' && avatar.data) {
    const img = document.createElement('img');
    img.src = avatar.data; img.alt = '';
    d.appendChild(img);
  } else if (avatar && avatar.type === 'dicebear' && avatar.url) {
    const img = document.createElement('img');
    img.src = avatar.url; img.alt = ''; img.loading = 'lazy';
    img.onerror = () => {
      d.innerHTML = '';
      const sp = document.createElement('span'); sp.textContent = letter;
      d.appendChild(sp); d.style.background = color || '#8b5cf6';
    };
    d.appendChild(img);
  } else {
    const sp = document.createElement('span'); sp.textContent = letter;
    d.appendChild(sp); d.style.background = color || '#8b5cf6';
  }
  return d;
}

/* ---------- JOIN ---------- */
function join() {
  const name = nameInput.value.trim();
  if (!name) { alert('Pehle apna name likho! 😊'); return; }
  myName = name.slice(0, 20);
  socket.emit('join', { name: myName, avatar: myAvatar });
  joinScreen.classList.add('hidden');
  app.classList.remove('hidden');
  $('my-name-badge').textContent = '😎 ' + myName;
}
joinBtn.onclick = join;
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') join(); });

/* ---------- URL PARSING ---------- */
function parseURL(url) {
  url = url.trim();
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (yt) return { type: 'youtube', videoId: yt[1], url };
  return { type: 'mp4', url };
}

loadBtn.onclick = () => {
  const val = urlInput.value.trim();
  if (!val) { alert('Pehle YouTube ya MP4 link paste karo! 🔗'); return; }
  const data = parseURL(val);
  loadVideoLocal(data, true);
  socket.emit('video-load', data);
  urlInput.value = '';
};

/* ---------- 🔄 SYNC BUTTON ---------- */
$('sync-btn').onclick = () => {
  if (currentType === 'none') { alert('Pehle koi video lagao! 🎬'); return; }
  let t = 0, playing = false;
  if (currentType === 'youtube' && ytReady && ytPlayer && ytPlayer.getCurrentTime) {
    try { t = ytPlayer.getCurrentTime(); } catch (e) {}
    playing = ytPlaying;
  } else if (currentType === 'mp4') {
    t = mp4.currentTime || 0;
    playing = !mp4.paused;
  }
  socket.emit('sync-all', { time: t, playing });
  addSysMsg('🔄 ' + myName + ' ne sab ko sync kiya');
};

function loadVideoLocal(data, autoplay) {
  currentType = data.type;
  noVideo.classList.add('hidden');
  if (data.type === 'youtube') {
    mp4.pause();
    mp4.classList.add('hidden');
    ytDiv.classList.remove('hidden');
    if (ytReady && ytPlayer && ytPlayer.loadVideoById) {
      suppressYT = true;
      ytPlayer.loadVideoById(data.videoId);
      setTimeout(() => suppressYT = false, 1500);
    } else {
      pendingYTVideo = data.videoId;
    }
    nowPlaying.textContent = '▶ YouTube chal raha hai: ' + data.videoId;
  } else {
    if (ytPlayer && ytPlayer.pauseVideo) { suppressYT = true; ytPlayer.pauseVideo(); setTimeout(() => suppressYT = false, 800); }
    ytDiv.classList.add('hidden');
    mp4.classList.remove('hidden');
    suppressMP4 = true;
    mp4.src = data.url;
    if (autoplay) mp4.play().catch(() => {});
    setTimeout(() => suppressMP4 = false, 1000);
    nowPlaying.textContent = '🎞 MP4 chal raha hai: ' + (data.url.length > 60 ? data.url.slice(0, 60) + '...' : data.url);
  }
}

/* ---------- YOUTUBE API ---------- */
window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player('yt-player', {
    height: '100%', width: '100%',
    playerVars: { autoplay: 1, rel: 0 },
    events: {
      onReady: () => {
        ytReady = true;
        if (pendingYTVideo) {
          suppressYT = true;
          ytPlayer.loadVideoById(pendingYTVideo);
          pendingYTVideo = null;
          setTimeout(() => suppressYT = false, 1500);
        }
      },
      onStateChange: (e) => {
        ytPlaying = (e.data === YT.PlayerState.PLAYING);
        if (e.data === YT.PlayerState.ENDED && currentType === 'youtube') socket.emit('video-ended');
        if (suppressYT || currentType !== 'youtube') return;
        if (e.data === YT.PlayerState.PLAYING) socket.emit('video-play', ytPlayer.getCurrentTime());
        else if (e.data === YT.PlayerState.PAUSED) socket.emit('video-pause', ytPlayer.getCurrentTime());
      }
    }
  });
};
let lastYtTime = 0;
setInterval(() => {
  if (ytReady && ytPlayer && ytPlayer.getCurrentTime && currentType === 'youtube' && !suppressYT) {
    try {
      const t = ytPlayer.getCurrentTime();
      if (Math.abs(t - lastYtTime) > 3) socket.emit('video-seek', t);
      lastYtTime = t;
    } catch (e) {}
  }
}, 1500);

/* ---------- MP4 SYNC EVENTS ---------- */
mp4.addEventListener('play', () => { if (!suppressMP4 && currentType === 'mp4') socket.emit('video-play', mp4.currentTime); });
mp4.addEventListener('pause', () => { if (!suppressMP4 && currentType === 'mp4') socket.emit('video-pause', mp4.currentTime); });
mp4.addEventListener('seeked', () => { if (!suppressMP4 && currentType === 'mp4') socket.emit('video-seek', mp4.currentTime); });

/* ---------- SOCKET: VIDEO SYNC ---------- */
socket.on('video-load', (data) => {
  loadVideoLocal(data, true);
  addSysMsg('🎬 ' + data.by + ' ne nayi video lagai');
});
socket.on('video-state', (data) => {
  if (!data || data.type === 'none') return;
  loadVideoLocal(data, false);
  setTimeout(() => {
    if (data.type === 'youtube' && ytReady && ytPlayer.seekTo) {
      suppressYT = true;
      ytPlayer.seekTo(data.time || 0, true);
      if (data.playing) ytPlayer.playVideo(); else ytPlayer.pauseVideo();
      setTimeout(() => suppressYT = false, 1200);
    } else if (data.type === 'mp4') {
      suppressMP4 = true;
      mp4.currentTime = data.time || 0;
      if (data.playing) mp4.play().catch(() => {}); else mp4.pause();
      setTimeout(() => suppressMP4 = false, 1000);
    }
  }, 1200);
});
socket.on('video-play', (t) => {
  if (currentType === 'youtube' && ytReady && ytPlayer.playVideo) {
    suppressYT = true;
    try { if (Math.abs(ytPlayer.getCurrentTime() - t) > 2) ytPlayer.seekTo(t, true); } catch (e) {}
    ytPlayer.playVideo();
    setTimeout(() => suppressYT = false, 1200);
  } else if (currentType === 'mp4') {
    suppressMP4 = true;
    if (Math.abs(mp4.currentTime - t) > 2) mp4.currentTime = t;
    mp4.play().catch(() => {});
    setTimeout(() => suppressMP4 = false, 1000);
  }
});
socket.on('video-pause', (t) => {
  if (currentType === 'youtube' && ytReady && ytPlayer.pauseVideo) {
    suppressYT = true;
    try { if (Math.abs(ytPlayer.getCurrentTime() - t) > 2) ytPlayer.seekTo(t, true); } catch (e) {}
    ytPlayer.pauseVideo();
    setTimeout(() => suppressYT = false, 1200);
  } else if (currentType === 'mp4') {
    suppressMP4 = true;
    if (Math.abs(mp4.currentTime - t) > 2) mp4.currentTime = t;
    mp4.pause();
    setTimeout(() => suppressMP4 = false, 1000);
  }
});
socket.on('video-seek', (t) => {
  if (currentType === 'youtube' && ytReady && ytPlayer.seekTo) {
    suppressYT = true;
    try { ytPlayer.seekTo(t, true); } catch (e) {}
    setTimeout(() => suppressYT = false, 1200);
  } else if (currentType === 'mp4') {
    suppressMP4 = true;
    mp4.currentTime = t;
    setTimeout(() => suppressMP4 = false, 1000);
  }
});
socket.on('video-sync-force', (d) => {
  const t = d.time || 0;
  if (currentType === 'youtube' && ytReady && ytPlayer.seekTo) {
    suppressYT = true;
    try { ytPlayer.seekTo(t, true); } catch (e) {}
    if (d.playing) ytPlayer.playVideo(); else ytPlayer.pauseVideo();
    setTimeout(() => suppressYT = false, 1500);
  } else if (currentType === 'mp4') {
    suppressMP4 = true;
    try { mp4.currentTime = t; } catch (e) {}
    if (d.playing) mp4.play().catch(() => {}); else mp4.pause();
    setTimeout(() => suppressMP4 = false, 1200);
  }
  addSysMsg('🔄 ' + d.by + ' ne sab ko sync kiya');
});

/* ---------- 📋 PLAYLIST / QUEUE ---------- */
function makeLabel(d) {
  if (d.type === 'youtube') return 'YT: ' + (d.videoId || '');
  try {
    const u = String(d.url || '').split('?')[0].split('/').pop() || '';
    const name = decodeURIComponent(u);
    if (/\.(mp3|wav|ogg|m4a)$/i.test(name)) return '🎵 ' + (name.slice(0, 28) || 'MP3 song');
    return '🎞 ' + (name.slice(0, 28) || 'MP4 video');
  } catch (e) { return '🎞 video'; }
}
$('queue-btn').onclick = () => {
  const val = urlInput.value.trim();
  if (!val) { alert('Pehle link paste karo! 🔗'); return; }
  const d = parseURL(val);
  d.label = makeLabel(d);
  socket.emit('queue-add', d);
  urlInput.value = '';
};
$('pl-clear').onclick = () => socket.emit('queue-clear');
function renderQueue(items, index) {
  const list = $('pl-list');
  $('pl-count').textContent = items.length;
  list.innerHTML = '';
  if (!items.length) {
    list.innerHTML = '<div class="pl-empty">Koi song queue me nahi — link paste kar ke ➕ Queue dabao 🎶</div>';
    return;
  }
  items.forEach((it, i) => {
    const div = document.createElement('div');
    div.className = 'pl-item' + (i === index ? ' active' : '');
    const num = document.createElement('span'); num.className = 'pl-num'; num.textContent = (i === index ? '▶ ' : '') + (i + 1);
    const lab = document.createElement('span'); lab.className = 'pl-label'; lab.textContent = it.label || it.videoId || 'video';
    const by = document.createElement('span'); by.className = 'pl-by'; by.textContent = it.by || '';
    const x = document.createElement('button'); x.className = 'pl-x'; x.textContent = '❌';
    x.onclick = (e) => { e.stopPropagation(); socket.emit('queue-remove', i); };
    div.onclick = () => socket.emit('queue-play', i);
    div.appendChild(num); div.appendChild(lab); div.appendChild(by); div.appendChild(x);
    list.appendChild(div);
  });
}
socket.on('queue-state', (d) => renderQueue(d.items || [], d.index));
socket.on('queue-ended', () => addSysMsg('📋 Playlist khatam! Nayi queue banao 🎶'));
mp4.addEventListener('ended', () => { if (currentType === 'mp4') socket.emit('video-ended'); });

/* ---------- ↩️ SWIPE REPLY ---------- */
function setReply(msg) {
  replyTo = { name: msg.own ? 'You' : msg.name, text: msg.text };
  rbName.textContent = '↩ Replying to ' + replyTo.name;
  rbMsg.textContent = replyTo.text;
  replyBar.classList.add('show');
  chatInput.focus();
}
function cancelReply() {
  replyTo = null;
  replyBar.classList.remove('show');
}
$('rb-cancel').onclick = cancelReply;

function attachReplyGestures(el, msg) {
  el.addEventListener('dblclick', (e) => { e.preventDefault(); setReply(msg); });
  let sx = 0, sy = 0, dx = 0, swiping = false;
  el.addEventListener('touchstart', (e) => {
    const t = e.touches[0]; sx = t.clientX; sy = t.clientY; dx = 0; swiping = false;
  }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) return;
    const t = e.touches[0]; dx = t.clientX - sx; const dy = t.clientY - sy;
    if (!swiping && dx > 12 && Math.abs(dx) > Math.abs(dy) * 1.5) swiping = true;
    if (swiping) {
      e.preventDefault();
      el.style.transition = 'none';
      el.style.transform = 'translateX(' + Math.min(dx, 110) + 'px)';
    }
  }, { passive: false });
  el.addEventListener('touchend', () => {
    el.style.transition = 'transform 0.2s ease';
    el.style.transform = '';
    if (swiping && dx > 60) setReply(msg);
    swiping = false; dx = 0;
  });
}

/* ---------- CHAT ---------- */
function isNearBottom() {
  return chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight < 80;
}
function scrollChatDown() {
  chatBox.scrollTop = chatBox.scrollHeight;
}
chatBox.addEventListener('scroll', () => {
  if (isNearBottom()) newMsgBtn.classList.add('hidden');
});
newMsgBtn.onclick = () => { scrollChatDown(); newMsgBtn.classList.add('hidden'); };

function addMsg(m) {
  const name = m.name, color = m.color, avatar = m.avatar, text = m.text, reply = m.reply, time = m.time;
  const wasBottom = isNearBottom();
  const own = m.senderId === myId;
  const row = document.createElement('div');
  row.className = 'msg-row ' + (own ? 'own' : 'other');
  const av = avatarEl(avatar, own ? myName : name, own ? '#ec4899' : color, 34);
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + (own ? 'own' : 'other');
  const senderDiv = document.createElement('div');
  senderDiv.className = 'sender';
  senderDiv.textContent = own ? 'You' : name;
  senderDiv.style.color = own ? '#f9a8d4' : color;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  if (reply) {
    const q = document.createElement('div'); q.className = 'quote';
    const qn = document.createElement('div'); qn.className = 'q-name'; qn.textContent = reply.name || '';
    const qt = document.createElement('div'); qt.className = 'q-text'; qt.textContent = reply.text || '';
    q.appendChild(qn); q.appendChild(qt); bubble.appendChild(q);
  }
  bubble.appendChild(document.createTextNode(text));
  const timeDiv = document.createElement('div');
  timeDiv.className = 'time';
  timeDiv.textContent = time + (own ? ' ✓✓' : '');
  wrap.appendChild(senderDiv);
  wrap.appendChild(bubble);
  wrap.appendChild(timeDiv);
  if (own) { row.appendChild(wrap); row.appendChild(av); }
  else { row.appendChild(av); row.appendChild(wrap); }
  chatBox.appendChild(row);
  attachReplyGestures(row, { name: name, text: text, own: own });
  if (wasBottom || own) scrollChatDown();
  else newMsgBtn.classList.remove('hidden');
}
function addSysMsg(text) {
  const div = document.createElement('div');
  div.className = 'sys-msg';
  div.textContent = text;
  chatBox.appendChild(div);
  if (isNearBottom()) scrollChatDown();
}
socket.on('chat-message', addMsg);
socket.on('system-message', addSysMsg);

function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;
  socket.emit('chat-message', { text: text, reply: replyTo });
  socket.emit('stop-typing');
  chatInput.value = '';
  cancelReply();
}
sendBtn.onclick = sendChat;
chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });

document.querySelectorAll('.emoji').forEach((b) => {
  b.onclick = () => { chatInput.value += b.dataset.e; chatInput.focus(); };
});

let typingTimer;
chatInput.addEventListener('input', () => {
  socket.emit('typing');
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => socket.emit('stop-typing'), 1200);
});
socket.on('typing', (name) => {
  typingInd.textContent = '✍ ' + name + ' likh raha hai...';
  typingInd.classList.remove('hidden');
});
socket.on('stop-typing', () => typingInd.classList.add('hidden'));

/* ---------- USERS ---------- */
socket.on('user-list', (list) => {
  userList.innerHTML = '';
  userCount.textContent = list.length;
  onlineCount.textContent = '🟢 ' + list.length + ' online';
  list.forEach((u) => {
    const chip = document.createElement('span');
    chip.className = 'user-chip';
    chip.style.borderLeftColor = u.color;
    chip.appendChild(avatarEl(u.avatar, u.name, u.color, 20));
    const nm = document.createElement('span');
    nm.textContent = u.name;
    chip.appendChild(nm);
    userList.appendChild(chip);
  });
});
