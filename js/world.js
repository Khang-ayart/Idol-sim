// "Thế giới" quanh người chơi: game show bất ngờ, hạng và mốc fan, tin nhắn (Mess), drama ngoài lề.
// Gắn vào đồng hồ game bằng enableWorld(). Mọi nhân vật nghệ sĩ/nhãn hàng ở đây đều HƯ CẤU.
import {
PERSONAS, personaById, C, analyze, createPost, clockHooks, addNotice, fameOf, dayOf, clamp, stripAccents,
rngOf, pick, chance, shuffle, weighted, fillTpl, nid, stylize, makeCtx, makeFeedPost, replyDelta, r2,
} from './engine.js';
import * as L from './lexicon.js';
const scale = (state, f) => { state.idol.followers = Math.max(100, Math.round(state.idol.followers * f)); };
const fmtN = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${n / 1000}K` : String(n));
export function ensure(state) {
state.inbox ??= [];
state.world ??= [];
state.gameshow ??= null;
state.rank ??= { points: L.RANK_START[state.idol.tier] ?? 0 };
state.milestones ??= null;
state.lastShowIdx ??= -99;
state.dm ??= {};
return state;
}
/* ---------- hạng ---------- */
export function rankIndex(state) {
ensure(state);
let idx = 0;
L.RANKS.forEach((r, i) => { if (state.rank.points >= r.at) idx = i; });
return idx;
}
export const rankInfo = (state) => {
const i = rankIndex(state);
const next = L.RANKS[i + 1];
return { index: i, name: L.RANKS[i].name, points: state.rank.points, next: next ? { name: next.name, at: next.at } : null };
};
export function addPoints(state, n) {
ensure(state);
const old = rankIndex(state);
state.rank.points = Math.max(0, state.rank.points + n);
const now = rankIndex(state);
if (now > old) {
addNotice(state, 'rank', `🏅 Thăng hạng: ${L.RANKS[now].name}!`);
pushMessage(state, managerSender(), 'rank', fillTpl(pick(rngOf(state), L.DM.managerRank), { rank: L.RANKS[now].name }));
} else if (now < old) {
addNotice(state, 'rank', `📉 Tụt hạng xuống: ${L.RANKS[now].name}`);
}
}
// Mốc người theo dõi + lời mời quảng cáo khi đủ nổi.
export function checkProgress(state) {
ensure(state);
if (!state.milestones) { state.milestones = L.MILESTONES.filter((m) => m <= state.idol.followers); }
for (const m of L.MILESTONES) {
if (state.idol.followers >= m && !state.milestones.includes(m)) {
state.milestones.push(m);
addNotice(state, 'milestone', `🎉 Bạn vừa đạt ${fmtN(m)} người theo dõi`);
addPoints(state, 15);
}
}
if (fameOf(state) >= 20 && !state.dm.brand) {
state.dm.brand = true;
pushMessage(state, brandSender, 'brand', pick(rngOf(state), L.DM.brand), [
{ id: 'accept', label: 'Nhận lời' }, { id: 'decline', label: 'Từ chối lịch sự' },
]);
}
}
/* ---------- tin nhắn (Mess) ---------- */
const personaSender = (p) => ({ id: p.id, name: p.name, kind: 'persona', role: p.role, label: `${p.job} (giả lập)` });
const artistSender = (a) => ({ id: a.id, name: a.name, kind: 'artist', role: 'artist', label: `${a.job} (hư cấu)` });
const managerSender = () => { const p = personaById('anhkiet'); return { id: p.id, name: p.name, kind: 'manager', role: 'manager', label: 'Quản lý nghệ sĩ (giả lập)' }; };
const brandSender = { id: 'brand', name: 'Nhãn hàng Sao Mai', kind: 'brand', role: 'brand', label: 'Nhãn hàng (hư cấu)' };
export function pushMessage(state, from, kind, text, actions = null, extra = {}) {
ensure(state);
const m = { id: nid(state, 'm'), idx: state.idx, from, kind, actions, resolved: false, unread: true, thread: [{ me: false, text, idx: state.idx }], ...extra };
state.inbox.push(m);
return m;
}
export const unreadCount = (state) => (state.inbox || []).filter((m) => m.unread).length;
export const markAllRead = (state) => (state.inbox || []).forEach((m) => { m.unread = false; });
function maybeFanDM(state) {
const r = rngOf(state);
if (unreadCount(state) >= 5 || !chance(r, 0.35)) return;
const fame = fameOf(state);
const pool = PERSONAS.filter((p) => p.minFame <= fame && ['fan', 'critic', 'hater', 'elder', 'neutral'].includes(p.role));
if (!pool.length) return;
const p = weighted(r, pool.map((x) => ({ p: x, w: 1 + Math.abs(state.accounts[x.id].stance) / 20 }))).p;
const bank = L.DM[p.role] || L.DM.neutral;
pushMessage(state, personaSender(p), 'persona', fillTpl(pick(r, bank), { idol: state.idol.name }));
}
function maybeArtistDM(state) {
const r = rngOf(state);
if (fameOf(state) < 8 || unreadCount(state) >= 5 || !chance(r, 0.22)) return;
const A = pick(r, L.ARTISTS.filter((a) => !a.senior));
const drama = state.world.at(-1);
const type = pick(r, ['collab', 'gossip', 'checkin']);
if (type === 'gossip' && drama) pushMessage(state, artistSender(A), 'gossip', fillTpl(pick(r, L.DM.gossip), { A: drama.subject }));
else if (type === 'collab') pushMessage(state, artistSender(A), 'collab', pick(r, L.DM.collab), [{ id: 'accept', label: 'Nhận lời hợp tác' }, { id: 'decline', label: 'Từ chối lịch sự' }]);
else pushMessage(state, artistSender(A), 'checkin', pick(r, L.DM.checkin));
}
// Gọi sau mỗi đợt phản ứng của một bài đăng.
export function onPostReacted(state, post, wave) {
ensure(state);
const r = rngOf(state);
if (wave === 2 && !post.dmSent) {
post.dmSent = true;
const cands = post.comments.map((c) => personaById(c.pid)).filter((p) => p && ['fan', 'critic', 'elder'].includes(p.role));
if (cands.length && chance(r, 0.5)) {
const p = pick(r, cands);
const bank = p.role === 'fan' ? L.DM.postFan : p.role === 'critic' ? L.DM.postCritic : L.DM.postElder;
pushMessage(state, personaSender(p), 'persona', fillTpl(pick(r, bank), { quote: post.analysis.quote }));
}
}
if (wave === 5) addPoints(state, clamp(Math.round((post.followerDelta / Math.max(1, post.reach)) * 10), -3, 5));
}
export function replyMessage(state, id, input = {}) {
ensure(state);
if (typeof input === 'string') input = { text: input };
const m = state.inbox.find((x) => x.id === id);
if (!m) throw new Error('Không tìm thấy tin nhắn');
m.unread = false;
if (m.thread.some((t) => t.me)) throw new Error('Bạn đã trả lời tin nhắn này rồi');
const r = rngOf(state);
if (m.actions) {
const act = m.actions.find((x) => x.id === input.action);
if (!act) throw new Error('Hãy chọn một lựa chọn');
m.thread.push({ me: true, text: act.label, idx: state.idx });
m.resolved = true;
const yes = act.id === 'accept';
let answer = 'Cảm ơn bạn đã trả lời.';
if (m.kind === 'collab') {
if (yes) { addPoints(state, 10); scale(state, 1.004); answer = 'Tuyệt, mình sẽ liên hệ sớm!'; } else answer = 'Không sao, hẹn dịp khác nhé.';
} else if (m.kind === 'brand') {
if (yes) { addPoints(state, 10); scale(state, 1.003); answer = pick(r, L.SENDER_REPLY.brand.pos); pushMessage(state, managerSender(), 'manager', pick(r, L.DM.managerAd)); }
else answer = pick(r, L.SENDER_REPLY.brand.neg);
} else if (m.kind === 'gameshow-invite') {
respondInvite(state, yes);
answer = yes ? 'Tuyệt vời! Hẹn bạn ở trường quay (xem tab Game show).' : 'Rất tiếc, hy vọng lần sau.';
} else if (m.kind === 'drama-involve') {
resolveInvolve(state, m, act.id);
}
m.thread.push({ me: false, text: answer, idx: state.idx });
return { action: act.id };
}
const text = String(input.text || '').trim().slice(0, 300);
if (!text) throw new Error('Tin nhắn đang trống');
const a = analyze(text);
const delta = replyDelta(a, stripAccents(text.toLowerCase()));
m.thread.push({ me: true, text, idx: state.idx });
m.resolved = true;
const kind = delta >= 3 ? 'pos' : delta <= -3 ? 'neg' : 'neu';
let answer;
if (m.from.kind === 'persona') {
const P = personaById(m.from.id);
const acc = state.accounts[P.id];
acc.stance = clamp(acc.stance + Math.round(delta * 0.8), -100, 100);
acc.memory.push({ postId: 'dm', idx: state.idx, tags: a.tags, mood: r2(delta / 12), delta: Math.round(delta * 0.8), quote: a.quote,
why: delta >= 0 ? 'idol nhắn riêng trả lời tử tế' : 'idol nhắn riêng trả lời khó chịu' });
const R = C.IDOL_REPLY[P.role] || C.IDOL_REPLY.generic;
answer = stylize(fillTpl(pick(r, R[kind]), { idol: state.idol.name }), P.style, r);
} else {
answer = pick(r, (L.SENDER_REPLY[m.from.kind] || L.SENDER_REPLY.artist)[kind]);
}
m.thread.push({ me: false, text: answer, idx: state.idx });
scale(state, 1 + delta / 3000);
return { delta };
}
/* ---------- drama thế giới (không nhất thiết liên quan tới người chơi) ---------- */
export function maybeWorldDrama(state, force = false) {
ensure(state);
const r = rngOf(state);
const fame = fameOf(state);
if (!force && (fame < 5 || state.world.length >= 14 || !chance(r, 0.35))) return null;
const sc = pick(r, L.WORLD_SCENARIOS);
const [A, B] = shuffle(r, L.ARTISTS.filter((a) => !a.senior));
const text = fillTpl(sc.text, { A: A.name, B: B.name });
const involves = fame >= 12 && chance(r, 0.3);
const wp = {
id: nid(state, 'w'), world: true, scenario: sc.id, subject: A.name, subjectB: B.name, idx: state.idx, text,
analysis: analyze(text), moods: {}, remembered: {}, used: {}, contradictions: [], heat: sc.heat,
reach: 500, wave: 0, comments: [], likes: 0, shares: 0, involves, resolved: false,
};
state.world.push(wp);
const ctx = makeCtx(state, wp, 8);
const byRole = (role) => shuffle(r, PERSONAS.filter((p) => p.role === role && p.minFame <= fame))[0] ?? PERSONAS.find((p) => p.role === role);
const post = (pers, kind) => makeFeedPost(ctx, pers, kind, { idx: state.idx, t: Math.round(r() * 40) });
post(byRole('page'), 'wnews');
post(byRole('hong'), 'wask');
post(sc.heat >= 50 ? byRole('fan') : byRole('hater'), sc.heat >= 50 ? 'wdefend' : 'wrant');
addNotice(state, 'world', `📰 Trong giới: ${text}`);
if (involves) {
pushMessage(state, artistSender(A), 'drama-involve', fillTpl(pick(r, L.DM.involve), { A: A.name, B: B.name }), [
{ id: 'A', label: `Đứng về phía ${A.name}` }, { id: 'B', label: `Đứng về phía ${B.name}` }, { id: 'silent', label: 'Không bình luận' },
], { worldId: wp.id });
}
return wp;
}
function resolveInvolve(state, m, choice) {
const wp = state.world.find((w) => w.id === m.worldId);
if (!wp) return;
const r = rngOf(state);
const ctx = makeCtx(state, wp, 8);
let kind, who;
if (choice === 'silent') {
kind = 'wtakeSilent'; who = wp.subject;
if (chance(r, 0.4)) scale(state, 0.99);
} else {
kind = 'wtakeSide'; who = choice === 'A' ? wp.subject : wp.subjectB;
scale(state, 1.012);
if (chance(r, 0.3)) scale(state, 0.97);
}
const cak = PERSONAS.find((p) => p.role === 'cakhia');
makeFeedPost(ctx, cak, kind, { idx: state.idx, t: Math.round(r() * 30), vars: { user: state.idol.name, idol: who } });
wp.resolved = true;
}
/* ---------- game show ---------- */
export function maybeInviteGameshow(state) {
ensure(state);
const gs = state.gameshow;
if (gs && (gs.status === 'invited' || gs.status === 'live')) return false;
const first = state.lastShowIdx === -99 && dayOf(state.idx) >= 2;
const again = state.idx - state.lastShowIdx >= 8 && fameOf(state) >= 8 && chance(rngOf(state), 0.18);
if (!first && !again) return false;
inviteGameshow(state);
return true;
}
export function inviteGameshow(state) {
ensure(state);
const r = rngOf(state);
const take = (cat, n) => shuffle(r, L.QUESTIONS.filter((q) => q.cat === cat)).slice(0, n);
const questions = shuffle(r, [...take('private', 3), ...take('opinion', 3), ...take('funny', 2), ...take('trap', 2)]);
const host = pick(r, L.ARTISTS.filter((a) => a.senior));
const title = pick(r, L.SHOW_TITLES);
state.gameshow = { status: 'invited', title, host: { name: host.name, job: host.job }, questions, i: 0, score: 30, log: [], invitedIdx: state.idx };
state.lastShowIdx = state.idx;
addNotice(state, 'gameshow', `🎬 Lời mời bất ngờ: chương trình "${title}" muốn mời bạn tham gia mười câu hỏi.`);
pushMessage(state, artistSender(host), 'gameshow-invite', fillTpl(pick(r, L.DM.hostInvite), { title }),
[{ id: 'accept', label: 'Nhận lời' }, { id: 'decline', label: 'Từ chối lịch sự' }]);
return state.gameshow;
}
export function respondInvite(state, accept) {
ensure(state);
const gs = state.gameshow;
if (!gs || gs.status !== 'invited') throw new Error('Không có lời mời game show nào đang chờ');
gs.status = accept ? 'live' : 'declined';
state.lastShowIdx = state.idx;
const msg = state.inbox.find((m) => m.kind === 'gameshow-invite' && !m.resolved);
if (msg) {
msg.resolved = true;
msg.thread.push({ me: true, text: accept ? 'Nhận lời' : 'Từ chối lịch sự', idx: state.idx });
msg.thread.push({ me: false, text: accept ? 'Tuyệt vời! Hẹn bạn ở trường quay (xem tab Game show).' : 'Rất tiếc, hy vọng lần sau.', idx: state.idx });
}
return gs;
}
function scoreAnswer(state, q, text) {
const r = rngOf(state);
const a = analyze(text);
const plain = stripAccents(text.toLowerCase());
const words = text.trim().split(/\s+/).filter(Boolean).length;
let d = 0;
const reasons = [];
const add = (n, why) => { d += n; reasons.push(`${n > 0 ? '+' : ''}${n} ${why}`); };
if (words < 3) add(-4, 'trả lời quá cụt'); else if (words >= 8) add(2, 'trả lời có nội dung');
if (/\b(khong biet|no comment|khong tra loi|khong noi)\b/.test(plain)) add(-4, 'né câu hỏi');
if (a.tags.includes('apology')) add(2, 'chân thành nhận lỗi');
if (a.tags.includes('sad') && q.cat === 'private') add(3, 'chia sẻ thật lòng');
if (a.tags.includes('charity')) add(3, 'tử tế');
if (a.jokes.length || a.humor) add(q.cat === 'funny' ? 6 : 2, 'có duyên, gây cười');
if (a.tags.includes('cakhia') || a.tags.includes('coworker')) add(q.cat === 'trap' ? -9 : -5, 'đụng tới người khác');
if (a.tags.includes('flex')) add(-3, 'khoe của');
if (q.cat === 'trap' && /\b(fan|khan gia|moi nguoi|nguoi nghe)\b/.test(plain) && !a.tags.includes('cakhia')) add(3, 'khéo léo hướng về khán giả');
const tn = Math.round(a.tone * 3);
if (tn) add(tn, tn > 0 ? 'tích cực' : 'tiêu cực');
for (const tag of a.tags) {
const key = C.CONTRADICTIONS[tag];
if (key && state.claims.some((c) => c.key === key)) { add(-8, 'mâu thuẫn với điều từng nói'); break; }
}
const jitter = Math.round((r() - 0.5) * 4);
if (jitter) add(jitter, 'cảm xúc khán giả');
return { d: clamp(d, -12, 12), reasons, a };
}
export function answerGameshow(state, text) {
ensure(state);
const gs = state.gameshow;
if (!gs || gs.status !== 'live') throw new Error('Không có game show nào đang diễn ra');
text = String(text || '').trim().slice(0, 400);
if (!text) throw new Error('Câu trả lời đang trống');
const q = gs.questions[gs.i];
const { d, reasons, a } = scoreAnswer(state, q, text);
for (const k of a.claims) state.claims.push({ key: k, postId: 'gameshow', idx: state.idx, quote: a.quote });
gs.score = Math.max(0, gs.score + d);
const kind = d >= 3 ? 'pos' : d <= -3 ? 'neg' : 'neu';
const r = rngOf(state);
const fame = fameOf(state);
const crowdPool = PERSONAS.filter((p) => p.minFame <= fame && ['fan', 'cakhia', 'hong', 'critic', 'hater', 'neutral'].includes(p.role));
const roles = kind === 'neg' ? ['hater', 'cakhia', 'critic', 'hong'] : kind === 'pos' ? ['fan', 'neutral', 'hong'] : null;
const picks = shuffle(r, roles ? crowdPool.filter((p) => roles.includes(p.role)) : crowdPool).slice(0, 2);
const entry = {
q: q.text, cat: q.cat, a: text, delta: d, reasons, host: pick(r, L.HOST_LINES[kind]), score: gs.score,
crowd: picks.map((p) => ({ pid: p.id, name: p.name, text: stylize(pick(r, L.AUDIENCE_LINES[kind]), p.style, r) })),
};
gs.log.push(entry);
gs.i++;
let finished = false;
if (gs.score <= 0) { finishGameshow(state, 'lost'); finished = true; }
else if (gs.i >= gs.questions.length) { finishGameshow(state); finished = true; }
return { entry, finished, status: gs.status };
}
const OUTCOME = {
won: { f: 1.15, p: 40, text: '🏆 Bạn chiến thắng game show!' },
ok: { f: 1.06, p: 15, text: '👏 Bạn hoàn thành game show với điểm khá.' },
weak: { f: 1.01, p: 3, text: 'Bạn về đích game show nhưng chưa để lại nhiều ấn tượng.' },
lost: { f: 0.97, p: -10, text: '💥 Bạn hết điểm và bị loại khỏi game show.' },
};
function finishGameshow(state, forced) {
const gs = state.gameshow;
const status = forced || (gs.score >= 70 ? 'won' : gs.score >= 45 ? 'ok' : 'weak');
const fx = OUTCOME[status];
const before = state.idol.followers;
scale(state, fx.f);
gs.status = status;
gs.result = { followerDelta: state.idol.followers - before, points: fx.p };
addPoints(state, fx.p);
addNotice(state, 'gameshow', fx.text);
pushMessage(state, artistSender({ id: 'host', name: gs.host.name, job: gs.host.job }), 'gameshow-thanks', fillTpl(pick(rngOf(state), L.DM.hostThanks), { title: gs.title }));
// Câu trả lời gây chú ý nhất được "cắt" thành bài đăng để cộng đồng bàn tán như mọi bài khác.
const best = [...gs.log].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
if (best) {
const post = createPost(state, best.a.slice(0, 200));
post.source = 'gameshow';
post.sourceTitle = gs.title;
gs.postId = post.id;
}
state.lastShowIdx = state.idx;
}
/* ---------- gắn vào đồng hồ ---------- */
function worldHook(state, events) {
ensure(state);
const before = state.notices.length;
maybeInviteGameshow(state);
maybeWorldDrama(state);
maybeFanDM(state);
maybeArtistDM(state);
const r = rngOf(state);
for (const n of events.notices.slice()) {
if (n.kind === 'warning') pushMessage(state, managerSender(), 'manager', pick(r, n.text === C.NOTICES.dig ? L.DM.managerDig : L.DM.managerGuess));
}
checkProgress(state);
events.notices.push(...state.notices.slice(before));
}
export function enableWorld() {
if (!clockHooks.includes(worldHook)) clockHooks.push(worldHook);
}