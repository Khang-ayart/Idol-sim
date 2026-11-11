// Dựng HTML (thuần hàm, không đụng DOM) để dễ test bằng node.
import { C, personaById, timeLabel, fameOf, dayOf, slotOf, countComments } from './engine.js';
import { rankInfo, unreadCount } from './world.js';

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

export const fmt = (n) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `${Math.round(n / 1e3)}K` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n);

const shortTime = (idx, t) => timeLabel(idx, t).replace('Ngày ', 'Ng.');
const absMin = (idx, t) => { const s = C.SLOTS[idx % 4]; return Math.floor(idx / 4) * 1440 + s.hour * 60 + s.min + t; };

// Ảnh được mô tả trong dấu *...* sẽ hiện thành khung ảnh giả lập.
const PHOTO_SPLIT = /(\*[^*\n]{1,80}\*)/;
const PHOTO_ONE = /^\*[^*\n]{1,80}\*$/;
export const bodyHtml = (text) =>
  String(text ?? '').split(PHOTO_SPLIT).map((part) => (PHOTO_ONE.test(part) ? `<div class="photo">📷 ${esc(part.slice(1, -1))}</div>` : esc(part))).join('');

function avatar(name, id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) % 360;
  const initial = [...String(name).replace(/[^\p{L}]/gu, '')][0]?.toUpperCase() || '?';
  return `<span class="av" style="background:hsl(${h} 55% 46%)">${esc(initial)}</span>`;
}

export function setupView() {
  return `
  <main class="setup">
    <h1>🎤 Idol Sim</h1>
    <p class="muted">Bạn là một influencer. Mỗi bài đăng sẽ khiến cả một cộng đồng mạng giả lập bàn tán. Mọi tài khoản, page và nhân vật trong game đều là <b>hư cấu</b>.</p>
    <form data-form="setup">
      <label>Nghệ danh<input name="name" required maxlength="30" placeholder="vd: Lâm Vy" /></label>
      <label>Tên thật <span class="muted">(tùy chọn, hợp với nghề sân khấu: ca sĩ, diễn viên, hài...)</span><input name="realName" maxlength="40" placeholder="vd: Nguyễn Thu Vy" /></label>
      <label>Nghề nghiệp
        <select name="job"><option>Ca sĩ</option><option>Diễn viên</option><option>Streamer</option><option>Người mẫu / KOL</option><option>Hài kịch</option></select>
      </label>
      <label>Giới thiệu ngắn<input name="bio" maxlength="80" placeholder="vd: Tân binh lên từ cuộc thi âm nhạc" /></label>
      <label>Bắt đầu từ
        <select name="tier">
          <option value="newbie">Ngày đầu tiên (800 người theo dõi)</option>
          <option value="rising">Đang lên (25K) - nhiều kiểu người hơn</option>
          <option value="star">Ngôi sao (400K) - đủ cả báo, soi, chuyên gia</option>
        </select>
      </label>
      <button class="primary" type="submit">Bắt đầu sự nghiệp</button>
    </form>
  </main>`;
}

function commentHtml(c, idx, ui, depth = 0) {
  const meta = personaById(c.pid);
  const back = ui.backstage
    ? `<div class="chips"><span>${esc(meta?.role)}</span><span>${esc(c.side)} ${c.mood}</span><span>${esc(c.how)}</span><span>hiểu: ${esc(meta?.knows)}</span></div>`
    : '';
  const kids = (c.replies || []).map((r) => commentHtml(r, idx, ui, depth + 1)).join('');
  const canReply = !c.me && !(c.replies || []).some((x) => x.me);
  const repBtn = canReply ? ` · <button class="link rep" data-act="reply" data-cid="${c.id}">Trả lời</button>` : '';
  const repForm = ui.replyTo === c.id
    ? `<form class="repform" data-form="reply" data-cid="${c.id}"><input name="text" maxlength="300" required autocomplete="off" placeholder="Trả lời ${esc(c.name)}..." /><button class="primary small" type="submit">Gửi</button></form>`
    : '';
  return `
  <div class="cm d${Math.min(depth, 2)}${c.me ? ' me' : ''}">
    ${avatar(c.name, c.me ? 'me' : c.pid)}
    <div class="cmb">
      <div class="bubble"><b>${esc(c.name)}</b>${c.me ? ' <span class="badge">bạn</span>' : ''}${c.to ? ` <span class="to">↪ ${esc(c.to)}</span>` : ''}<div>${esc(c.text)}</div></div>
      <div class="cmeta">${shortTime(idx, c.t)} · 👍 ${c.likes}${repBtn}</div>${back}${repForm}
      ${kids ? `<div class="replies">${kids}</div>` : ''}
    </div>
  </div>`;
}

function myCard(state, post, ui) {
  const slot = C.SLOTS[post.idx % 4];
  const n = countComments(post.comments);
  const waveLbl = post.wave ? `Đợt ${post.wave}/5: ${C.WAVES[post.wave - 1].name}` : 'Chưa có phản ứng';
  const next = post.wave < 5 ? `<button data-act="wave" data-id="${post.id}" class="primary small">Xem đợt tiếp theo ▸ (${C.WAVES[post.wave].name})</button>` : `<span class="muted">Đã xem hết 5 đợt</span>`;
  const back = ui.backstage ? `<div class="chips"><span>tags: ${esc(post.analysis.tags.join(', '))}</span><span>độ nóng ${post.heat}</span>${post.contradictions.length ? '<span>có mâu thuẫn với bài cũ</span>' : ''}${post.analysis.jokes.map((j) => `<span>joke: ${esc(j.label)}${j.meaning ? '' : ' (chưa có nghĩa)'}</span>`).join('')}${post.analysis.songs.map((x) => `<span>bài: ${esc(x.title)} - ${esc(x.artist)}</span>`).join('')}${post.analysis.lyricLike ? '<span>giống câu hát, chưa nhận ra bài</span>' : ''}</div>` : '';
  return `
  <article class="card mine">
    <header>${avatar(state.idol.name, 'me')}<div><b>${esc(state.idol.name)}</b> <span class="badge">bạn</span><div class="muted">${shortTime(post.idx, 0)} · ${slot.icon} ${esc(slot.name)}</div></div></header>
    ${post.source === 'gameshow' ? `<div class="muted">🎬 Trích từ game show "${esc(post.sourceTitle)}"</div>` : ''}<p class="body">${bodyHtml(post.text)}</p>
    <div class="stats">👍 ${fmt(post.likes)} · 💬 ${n} · 🔁 ${fmt(post.shares)}${post.wave === 5 ? ` · ${post.followerDelta >= 0 ? '📈 +' : '📉 '}${fmt(post.followerDelta)} người theo dõi` : ''}</div>
    ${back}
    <div class="wave"><span class="muted">${esc(waveLbl)}</span>${next}</div>
    <div class="comments">${post.comments.map((c) => commentHtml(c, post.idx, ui)).join('')}</div>
  </article>`;
}

const KIND_LABEL = { wnews: 'Tin giải trí', wask: 'Bài viết', wdefend: 'Bài viết', wrant: 'Bài viết', wtakeSide: 'Meme', wtakeSilent: 'Meme', newsHot: 'Tin tức', newsCalm: 'Tin tức', dig: 'Bài đào lại', digNews: 'Tin tức', ask: 'Bài viết', guess: 'Bài viết', defend: 'Bài viết', rant: 'Bài viết', analysis: 'Phân tích', meme: 'Meme' };

function feedCard(f, ui) {
  const p = personaById(f.pid);
  return `
  <article class="card">
    <header>${avatar(f.name, f.pid)}<div><b>${esc(f.name)}</b> <span class="badge sim">giả lập</span><div class="muted">${shortTime(f.idx, f.t)} · ${esc(KIND_LABEL[f.kind] || 'Bài viết')} · ${esc(p?.job || '')}</div></div></header>
    <p class="body">${esc(f.text)}</p>
    <div class="stats">👍 ${fmt(f.likes)} · 💬 ${countComments(f.comments)} · 🔁 ${fmt(f.shares)}</div>
    <div class="comments">${f.comments.map((c) => commentHtml(c, f.idx, ui)).join('')}</div>
  </article>`;
}

function feedList(state, ui) {
  const items = [
    ...state.posts.map((p) => ({ html: () => myCard(state, p, ui), key: absMin(p.idx, 0), seq: +p.id.slice(1) })),
    ...state.feed.map((f) => ({ html: () => feedCard(f, ui), key: absMin(f.idx, f.t), seq: +f.id.slice(1) })),
  ].sort((a, b) => b.key - a.key || b.seq - a.seq);
  if (!items.length) return '<p class="empty muted">Bảng tin còn trống. Hãy đăng bài đầu tiên của bạn!</p>';
  return items.map((i) => i.html()).join('');
}

function timelineView(state) {
  const claims = state.claims.length
    ? `<h3>Những điều bạn từng khẳng định</h3><ul>${state.claims.map((c) => `<li><b>${esc(C.CLAIM_LABELS[c.key])}</b> · ${shortTime(c.idx, 0)}<br><span class="muted">"${esc(c.quote)}"</span></li>`).join('')}</ul>`
    : '<p class="muted">Chưa có tuyên bố nào. Thử viết thứ gì đó như "mình sẽ không bao giờ nhận quảng cáo", rồi xem cộng đồng nhớ lâu đến đâu.</p>';
  const posts = [...state.posts].reverse().map((p) => `<li>${shortTime(p.idx, 0)} · "${esc(p.analysis.quote)}" <span class="muted">(${esc(p.analysis.tags.map((t) => C.TAG_LABELS[t]).join(', '))})</span></li>`).join('');
  return `<section class="panel">${claims}<h3>Bài đã đăng</h3><ul>${posts || '<li class="muted">Chưa có bài nào</li>'}</ul></section>`;
}

function noticesView(state) {
  if (!state.notices.length) return '<p class="empty muted">Chưa có thông báo. Tin đồn sẽ báo trước ở đây trước khi nổ ra.</p>';
  return `<section class="panel">${[...state.notices].reverse().map((n) => `<div class="notice ${esc(n.kind)}"><span class="muted">${shortTime(n.idx, 0)}</span><div>${esc(n.text)}</div></div>`).join('')}</section>`;
}

const OUTCOME_TEXT = {
  won: '🏆 Bạn chiến thắng game show!', ok: '👏 Bạn hoàn thành với điểm khá.', weak: 'Bạn về đích nhưng chưa để lại nhiều ấn tượng.', lost: '💥 Bạn hết điểm và bị loại.',
};

function gameshowView(state) {
  const gs = state.gameshow;
  if (!gs) return '<section class="panel"><h3>🎬 Game show</h3><p class="muted">Chưa có lời mời nào. Game show sẽ mời bất ngờ khi bạn bắt đầu có tiếng. Mười câu hỏi về đời tư, suy nghĩ, hài hước và cả câu gài bẫy: được khen thì cộng điểm, bị chê thì trừ, về 0 là thua.</p></section>';
  const head = `<h3>🎬 ${esc(gs.title)}</h3><p class="muted">Dẫn chương trình: ${esc(gs.host.name)} (${esc(gs.host.job)}, hư cấu)</p>`;
  if (gs.status === 'invited') {
    return `<section class="panel">${head}<p>Lời mời bất ngờ: mười câu hỏi trực tiếp. Bạn có nhận lời không?</p>
      <div class="row"><button class="primary" data-act="gs-accept">Nhận lời</button><button data-act="gs-decline">Từ chối lịch sự</button></div></section>`;
  }
  if (gs.status === 'declined') return `<section class="panel">${head}<p class="muted">Bạn đã từ chối lời mời này.</p></section>`;
  const bar = `<div class="bar"><i style="width:${Math.min(100, gs.score)}%"></i></div><div class="muted">Điểm: <b>${gs.score}</b> · đạt 70 để thắng · về 0 là bị loại</div>`;
  const log = [...gs.log].reverse().map((e) => `
    <div class="gsq">
      <div class="muted">${esc(e.q)}</div>
      <div class="bubble mine">${esc(e.a)}</div>
      <div class="chips"><span class="${e.delta >= 0 ? 'up' : 'down'}">${e.delta >= 0 ? '+' : ''}${e.delta} điểm</span>${e.reasons.map((x) => `<span>${esc(x)}</span>`).join('')}</div>
      <div class="host">🎤 ${esc(e.host)}</div>
      ${e.crowd.map((c) => `<div class="cm d1">${avatar(c.name, c.pid)}<div class="cmb"><div class="bubble"><b>${esc(c.name)}</b><div>${esc(c.text)}</div></div></div></div>`).join('')}
    </div>`).join('');
  if (gs.status === 'live') {
    const q = gs.questions[gs.i];
    return `<section class="panel">${head}${bar}
      <h4>Câu ${gs.i + 1}/${gs.questions.length}</h4>
      <p class="question">${esc(q.text)}</p>
      <form data-form="gs-answer" class="gsform"><textarea name="text" rows="3" maxlength="400" required placeholder="Trả lời của bạn..."></textarea><button class="primary" type="submit">Trả lời</button></form>
      ${log}</section>`;
  }
  const r = gs.result || { followerDelta: 0, points: 0 };
  return `<section class="panel">${head}${bar}<p><b>${OUTCOME_TEXT[gs.status]}</b></p>
    <p class="muted">${r.followerDelta >= 0 ? '📈 +' : '📉 '}${fmt(r.followerDelta)} người theo dõi · ${r.points >= 0 ? '+' : ''}${r.points} điểm hạng. Câu trả lời gây chú ý nhất đã lên bảng tin để cộng đồng bàn tán.</p>${log}</section>`;
}

function messView(state) {
  if (!(state.inbox || []).length) return '<p class="empty muted">Chưa có tin nhắn. Fan, nghệ sĩ, quản lý và nhãn hàng (đều giả lập) sẽ nhắn cho bạn theo thời gian.</p>';
  const threads = [...state.inbox].sort((a, b) => b.idx - a.idx).map((m) => {
    const replied = m.thread.some((t) => t.me);
    const bubbles = m.thread.map((t) => `<div class="dm ${t.me ? 'me' : ''}"><div class="bubble">${esc(t.text)}</div><div class="cmeta">${shortTime(t.idx, 0)}</div></div>`).join('');
    const actions = !replied && m.actions
      ? `<div class="row">${m.actions.map((a) => `<button class="small" data-act="dm-action" data-id="${m.id}" data-action="${esc(a.id)}">${esc(a.label)}</button>`).join('')}</div>`
      : !replied
        ? `<form class="repform" data-form="dm-reply" data-id="${m.id}"><input name="text" maxlength="300" required autocomplete="off" placeholder="Nhắn lại ${esc(m.from.name)}..." /><button class="primary small" type="submit">Gửi</button></form>`
        : '';
    return `<article class="card dmcard">
      <header>${avatar(m.from.name, m.from.id)}<div><b>${esc(m.from.name)}</b> ${m.unread ? '<span class="dot"></span>' : ''}<div class="muted">${esc(m.from.label)}</div></div></header>
      <div class="dms">${bubbles}</div>${actions}</article>`;
  }).join('');
  return `<section>${threads}</section>`;
}

export function gameView(state, ui) {
  const slot = slotOf(state.idx);
  const fame = fameOf(state);
  const unread = unreadCount(state);
  const gsBadge = state.gameshow && ['invited', 'live'].includes(state.gameshow.status) ? ' 🔴' : '';
  const tabs = [['feed', 'Bảng tin'], ['gameshow', `🎬 Game show${gsBadge}`], ['mess', `✉️ Mess${unread ? ` (${unread})` : ''}`], ['mine', 'Dòng thời gian'], ['notices', `Thông báo${state.notices.length ? ` (${state.notices.length})` : ''}`]];
  const rank = rankInfo(state);
  const body = ui.tab === 'mine' ? timelineView(state) : ui.tab === 'notices' ? noticesView(state)
    : ui.tab === 'gameshow' ? gameshowView(state) : ui.tab === 'mess' ? messView(state)
    : `<form class="composer" data-form="post">
        <textarea name="text" rows="3" maxlength="600" placeholder="Bạn đang nghĩ gì, ${esc(state.idol.name)}?">${esc(ui.draft || '')}</textarea>
        <div class="muted">📷 Đăng ảnh: mô tả trong dấu *...*, vd <i>*ảnh selfie ở biển*</i></div>
        <div class="row"><span class="muted">${slot.icon} ${esc(slot.name)} · ${slot.mult >= 1 ? 'đông người xem' : 'ít người xem'}${state.idx % 4 === 3 ? ' · khuya dễ "toang"' : ''}</span><button class="primary" type="submit">Đăng</button></div>
      </form>${feedList(state, ui)}`;
  return `
  <header class="top">
    <div class="who">${avatar(state.idol.name, 'me')}<div><b>${esc(state.idol.name)}</b>${state.idol.realName ? ` <span class="muted">(tên thật: ${esc(state.idol.realName)})</span>` : ''}<div class="muted">${esc(state.idol.job)}${state.idol.bio ? ` · ${esc(state.idol.bio)}` : ''}</div></div></div>
    <div class="meters"><div><b>${fmt(state.idol.followers)}</b><span class="muted">người theo dõi</span></div><div><b>${fame}</b><span class="muted">độ nổi</span></div><div><b>🏅 ${esc(rank.name)}</b><span class="muted">${rank.points} điểm${rank.next ? ` · còn ${rank.next.at - rank.points} để lên hạng` : ''}</span></div></div>
    <div class="clock"><span>📅 Ngày ${dayOf(state.idx)} · ${slot.icon} ${esc(slot.name)}</span><button data-act="tick">⏭ Sang khung giờ tiếp theo</button></div>
  </header>
  <nav class="tabs">${tabs.map(([k, l]) => `<button data-act="tab" data-tab="${k}" class="${ui.tab === k ? 'on' : ''}">${l}</button>`).join('')}</nav>
  <main class="content">${body}</main>
  <footer class="foot">
    <label><input type="checkbox" data-act="backstage" ${ui.backstage ? 'checked' : ''}/> Xem hậu trường (vai, tâm trạng)</label>
    <label><input type="checkbox" data-act="ai" ${ui.ai ? 'checked' : ''}/> Dùng Claude viết lại bình luận</label>
    ${ui.ai ? `<input type="password" data-act="aikey" placeholder="Anthropic API key (chỉ lưu trong phiên)" value="${esc(ui.aiKey || '')}"/>` : ''}
    <button data-act="reset" class="link">Chơi lại từ đầu</button>
    <p class="muted">Toàn bộ tài khoản, page, bài viết là nội dung giả lập, không phải người dùng hay cơ quan báo chí thật.</p>
  </footer>`;
}
