import { createGame, createPost, nextWave, advanceClock, replyToComment } from './engine.js';
import { gameView, setupView } from './views.js';
import { refineComments, identifySong } from './ai.js';
import { enableWorld, ensure, checkProgress, onPostReacted, respondInvite, answerGameshow, replyMessage, markAllRead, unreadCount } from './world.js';
import { addSong } from './engine.js';

const KEY = 'idol-sim-save-v1';
const root = document.getElementById('app');
const toastEl = document.getElementById('toast');
const ui = { replyTo: null, tab: 'feed', backstage: false, ai: false, aiKey: sessionStorage.getItem('idol-sim-key') || '', draft: '' };
enableWorld();
let state = load();
if (state) { ensure(state); checkProgress(state); }
let busy = false;

function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); return s?.v === 1 ? s : null; } catch { return null; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* bộ nhớ đầy hoặc bị chặn: bỏ qua */ }
}
function render() { root.innerHTML = state ? gameView(state, ui) : setupView(); }
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3500);
}

function collect(list, wave, out = []) {
  for (const c of list) { if (c.wave === wave) out.push(c); collect(c.replies || [], wave, out); }
  return out;
}

async function runWave(post) {
  const w = nextWave(state, post);
  if (!w) return;
  if (ui.ai && ui.aiKey) {
    try {
      const fresh = [...collect(post.comments, w.n), ...w.newFeed.flatMap((f) => collect(f.comments, w.n))];
      const map = await refineComments({ apiKey: ui.aiKey, idol: state.idol.name, postText: post.text, comments: fresh.slice(0, 40) });
      for (const c of fresh) if (map[c.id]) c.text = map[c.id];
    } catch (e) { toast(`Claude không phản hồi được (${e.message}), dùng bản offline.`); }
  }
  onPostReacted(state, post, w.n);
  checkProgress(state);
  save();
  render();
  toast(`Đợt ${w.n}: ${w.name}`);
}

root.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target.closest('form');
  if (form?.dataset.form === 'setup') {
    const f = new FormData(form);
    state = createGame({ name: f.get('name').trim(), realName: f.get('realName').trim(), job: f.get('job'), bio: f.get('bio').trim(), tier: f.get('tier') });
    save(); render();
  } else if (form?.dataset.form === 'gs-answer') {
    try {
      const { entry, finished, status } = answerGameshow(state, form.elements.text.value);
      checkProgress(state); save(); render();
      toast(finished ? ({ won: '🏆 Chiến thắng game show!', ok: '👏 Hoàn thành game show', weak: 'Về đích game show', lost: '💥 Bị loại khỏi game show' }[status])
        : `${entry.delta >= 0 ? '+' : ''}${entry.delta} điểm`);
    } catch (err) { toast(err.message); }
  } else if (form?.dataset.form === 'dm-reply') {
    try { replyMessage(state, form.dataset.id, { text: form.elements.text.value }); checkProgress(state); save(); render(); toast('Đã gửi tin nhắn'); }
    catch (err) { toast(err.message); }
  } else if (form?.dataset.form === 'reply') {
    try {
      const { delta } = replyToComment(state, form.dataset.cid, form.elements.text.value);
      ui.replyTo = null;
      save(); render();
      toast(delta >= 3 ? 'Câu trả lời được đón nhận tốt' : delta <= -3 ? 'Câu trả lời khiến mọi người xôn xao' : 'Đã trả lời bình luận');
    } catch (err) { toast(err.message); }
  } else if (form?.dataset.form === 'post' && !busy) {
    busy = true;
    try {
      const post = createPost(state, form.elements.text.value);
      ui.draft = '';
      if (ui.ai && ui.aiKey && post.analysis.lyricLike) {
        try {
          const song = await identifySong({ apiKey: ui.aiKey, text: post.text });
          if (song) { addSong(post, { ...song, via: 'claude' }); toast(`Claude đoán đây là "${song.title}" của ${song.artist}`); }
        } catch { /* không nhận diện được: bình luận sẽ hỏi như thường */ }
      }
      await runWave(post);
    } catch (err) { toast(err.message); }
    busy = false;
  }
});

root.addEventListener('input', (e) => {
  if (e.target.name === 'text' && e.target.closest('[data-form="post"]')) ui.draft = e.target.value;
  if (e.target.dataset.act === 'aikey') { ui.aiKey = e.target.value.trim(); sessionStorage.setItem('idol-sim-key', ui.aiKey); }
});

root.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || busy) return;
  const act = el.dataset.act;
  if (act === 'gs-accept' || act === 'gs-decline') {
    try { respondInvite(state, act === 'gs-accept'); save(); render(); toast(act === 'gs-accept' ? 'Chào mừng đến trường quay!' : 'Đã từ chối lời mời'); } catch (err) { toast(err.message); }
  } else if (act === 'dm-action') {
    try { replyMessage(state, el.dataset.id, { action: el.dataset.action }); checkProgress(state); save(); render(); toast('Đã trả lời'); } catch (err) { toast(err.message); }
  } else if (act === 'reply') { ui.replyTo = el.dataset.cid; render(); root.querySelector('.repform input')?.focus(); }
  else if (act === 'tab') { ui.tab = el.dataset.tab; if (ui.tab === 'mess') { render(); markAllRead(state); save(); } else render(); }
  else if (act === 'backstage') { ui.backstage = el.checked; render(); }
  else if (act === 'ai') { ui.ai = el.checked; render(); }
  else if (act === 'wave') {
    busy = true;
    el.disabled = true;
    await runWave(state.posts.find((p) => p.id === el.dataset.id));
    busy = false;
  } else if (act === 'tick') {
    const u0 = unreadCount(state);
    const ev = advanceClock(state);
    save(); render();
    const newDm = unreadCount(state) - u0;
    toast(ev.notices.length ? ev.notices[0].text : newDm > 0 ? `✉️ Bạn có ${newDm} tin nhắn mới` : 'Đã sang khung giờ mới');
  } else if (act === 'reset') {
    if (confirm('Xóa toàn bộ tiến trình và chơi lại từ đầu?')) { localStorage.removeItem(KEY); state = null; render(); }
  }
});

render();
