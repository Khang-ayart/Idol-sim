// Engine mô phỏng phản ứng cộng đồng mạng (chạy offline, thuần JS, không phụ thuộc DOM).
// State là JSON thuần để lưu/khôi phục; mọi ngẫu nhiên đi qua state.rng nên có thể tái lập theo seed.
import { PERSONAS, personaById } from './personas.js';
import * as C from './content.js';
import * as L from './lexicon.js';

export { PERSONAS, personaById, C };

/* ---------- tiện ích ---------- */
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const r2 = (x) => +x.toFixed(2) || 0; // làm tròn 2 số lẻ, tránh -0
export const stripAccents = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

function rngOf(state) {
  return () => {
    state.rng = (state.rng + 0x6d2b79f5) | 0;
    let t = state.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const chance = (r, p) => r() < p;
function shuffle(r, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function weighted(r, items) {
  const total = items.reduce((s, i) => s + i.w, 0);
  let x = r() * total;
  for (const it of items) {
    x -= it.w;
    if (x <= 0) return it;
  }
  return items[items.length - 1];
}
// Chọn câu chưa dùng trong cùng một bài; hết câu mới thì trả null để chuyển kiểu khác.
function pickFresh(r, post, arr) {
  post.used ??= {};
  const fresh = arr.filter((l) => !post.used[l]);
  if (!fresh.length) return null;
  const l = pick(r, fresh);
  post.used[l] = 1;
  return l;
}
const fillTpl = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
const nid = (state, prefix) => `${prefix}${++state.ids}`;
const callName = (name) => name.replace(/[^\p{L}\s]/gu, '').trim();

export const dayOf = (idx) => Math.floor(idx / 4) + 1;
export const slotOf = (idx) => C.SLOTS[idx % 4];
export const fameOf = (state) =>
  clamp(Math.round((Math.log10(Math.max(state.idol.followers, 10)) - 2.5) * 30), 0, 100);

export function timeLabel(idx, t = 0) {
  const s = C.SLOTS[idx % 4];
  const abs = Math.floor(idx / 4) * 1440 + s.hour * 60 + s.min + Math.round(t);
  const d = Math.floor(abs / 1440) + 1;
  const m = abs % 1440;
  return `Ngày ${d}, ${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function countComments(list) {
  return list.reduce((n, c) => n + 1 + countComments(c.replies || []), 0);
}

/* ---------- kiểu gõ ---------- */
function stylize(text, st = {}, r) {
  let s = text;
  if (st.plain) s = stripAccents(s);
  if (st.lower) s = s.toLowerCase();
  if (st.dropPunct) s = s.replace(/[.,]/g, '');
  if (st.slang?.length && chance(r, 0.45)) s = chance(r, 0.5) ? `${pick(r, st.slang)} ${s}` : `${s} ${pick(r, st.slang)}`;
  if (st.typo && chance(r, st.typo)) {
    const idxs = [...s].map((ch, i) => (/\p{L}/u.test(ch) ? i : -1)).filter((i) => i >= 0);
    if (idxs.length) {
      const i = pick(r, idxs);
      s = s.slice(0, i) + s[i] + s.slice(i);
    }
  }
  if (st.excl && chance(r, st.excl)) s += '!'.repeat(1 + Math.floor(r() * 3));
  if (st.emoji?.length && chance(r, 0.5)) s += ` ${pick(r, st.emoji)}`;
  return s;
}

/* ---------- phân tích bài đăng ---------- */
export function analyze(text) {
  const raw = text.trim();
  const plain = stripAccents(raw.toLowerCase());
  const claims = Object.entries(C.CLAIM_PATTERNS).filter(([, re]) => re.test(plain)).map(([k]) => k);
  let scrub = plain;
  for (const re of Object.values(C.CLAIM_PATTERNS)) scrub = scrub.replace(new RegExp(re.source, 'g'), ' ');
  const jokes = L.LEXICON.filter((e) => e.re.test(plain)).map((e) => ({ id: e.id, label: e.label, kind: e.kind, meaning: e.meaning }));
  for (const e of L.LEXICON) scrub = scrub.replace(new RegExp(e.re.source, 'g'), ' ');
  const tags = Object.entries(C.TAG_PATTERNS).filter(([, re]) => re.test(scrub)).map(([k]) => k);
  const humor = /haha|hihi|kkk|:\)\)|=\)\)|😂|🤣/.test(raw.toLowerCase());
  if (jokes.some((j) => j.kind === 'joke') || humor) tags.push('joke');
  const groups = L.GROUPS.filter((g) => g.re.test(plain) || g.raw?.test(raw)).map((g) => g.name);
  const songs = L.SONGS.filter((sg) => sg.re.test(plain) && (!sg.ambiguous || groups.includes(sg.artist) || sg.q.test(plain)))
    .map((sg) => ({ title: sg.title, artist: sg.artist }));
  if (songs.length || groups.length) tags.push('music');
  const lyricLike = !songs.length && (/[♪♫]/.test(raw) || /\b(lyrics?|loi bai hat|cau hat|trich bai)\b/.test(plain));
  if (!tags.length) tags.push('daily');
  const mentions = raw.match(/@[\p{L}\d_.]+/gu) || [];
  const posN = (plain.match(/\b(yeu|thich|vui|cam on|hanh phuc|tuyet|hao hung|tu hao)\b/g) || []).length;
  const negN = (plain.match(/\b(ghet|chan|buc|te|kem|do dom|phien|xau|that vong)\b/g) || []).length;
  const tone = clamp((posN - negN) / 3, -1, 1);
  const photoRe = /\*([^*\n]{1,80})\*/g;
  const photos = [...raw.matchAll(photoRe)].map((m) => m[1].trim().replace(/^(ảnh|hình|photo|pic)\s+/iu, ''));
  const body = raw.replace(photoRe, ' ').replace(/\s+/g, ' ').trim();
  const sentences = body.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
  let q = sentences.filter((s) => s.length <= 90).sort((a, b) => b.length - a.length)[0] || sentences[0] || photos[0] || raw;
  if (q.length > 90) q = q.slice(0, 90).replace(/\s+\S*$/, '') + '…';
  q = q.replace(/[.!?]+$/, '');
  return { tags, claims, tone, mentions, photos, jokes, humor, songs, groups, lyricLike, quote: q, vague: tags.includes('cakhia') && !mentions.length };
}

/* ---------- khởi tạo ---------- */
export function createGame({ name, realName = '', job = 'Ca sĩ', bio = '', tier = 'newbie', seed = Date.now() }) {
  const followers = { newbie: 800, rising: 25000, star: 400000 }[tier] ?? 800;
  const accounts = {};
  for (const p of PERSONAS) accounts[p.id] = { stance: p.stance, memory: [] };
  return {
    v: 1, rng: seed | 0, ids: 0, idx: 0,
    idol: { name, realName: String(realName || '').trim(), job, bio, tier, followers, startFollowers: followers },
    posts: [], feed: [], claims: [], rumors: [], notices: [], accounts, lastApologyIdx: -99,
  };
}

/* ---------- tạo bài đăng của người chơi ---------- */
export function createPost(state, text) {
  text = String(text || '').trim().slice(0, 600);
  if (!text) throw new Error('Bài đăng đang trống');
  const a = analyze(text);
  const slot = slotOf(state.idx);
  const post = {
    id: nid(state, 'p'), idx: state.idx, text, analysis: a, wave: 0,
    comments: [], moods: {}, remembered: {}, likes: 0, shares: 0, followerDelta: 0,
  };
  post.contradictions = [];
  for (const t of a.tags) {
    const key = C.CONTRADICTIONS[t];
    if (!key) continue;
    const old = [...state.claims].reverse().find((cl) => cl.key === key);
    if (old) post.contradictions.push({ key: old.key, postId: old.postId, idx: old.idx, quote: old.quote });
  }
  for (const c of a.claims) state.claims.push({ key: c, postId: post.id, idx: state.idx, quote: a.quote });
  if (a.tags.includes('apology')) {
    state.lastApologyIdx = state.idx;
    state.rumors.forEach((rm) => { if (rm.phase !== 'done') rm.handled = true; });
  }
  const fame = fameOf(state);
  const sameSlot = state.posts.filter((p) => p.idx === state.idx).length;
  let heat = 15 + sameSlot * 8;
  const add = { cakhia: 30, dating: 15, flex: 15, ad: 10, coworker: 10, apology: -12, charity: -8, daily: -5, joke: -8, music: -3 };
  for (const t of a.tags) heat += add[t] || 0;
  if (post.contradictions.length) heat += 25;
  if (state.idx % 4 === 3) heat += 10;
  post.heat = clamp(heat, 0, 100);
  post.reach = Math.round(state.idol.followers * slot.mult);
  post.likes = Math.round(post.reach * 0.01);

  if (fame >= 12) {
    if (post.contradictions.length && !a.tags.includes('apology')) {
      state.rumors.push({ id: nid(state, 'r'), kind: 'dig', postId: post.id, old: post.contradictions[0],
        warnIdx: state.idx + 1, blowIdx: state.idx + 2, phase: 'pending', handled: false });
    } else if (a.vague) {
      state.rumors.push({ id: nid(state, 'r'), kind: 'guess', postId: post.id, old: null,
        warnIdx: state.idx + 1, blowIdx: state.idx + 2, phase: 'pending', handled: false });
    }
  }
  state.posts.push(post);
  return post;
}

/* ---------- tâm trạng, trí nhớ ---------- */
const valueOf = (p, tag) => p.values?.[tag] ?? C.ROLE_VALUES[p.role]?.[tag] ?? 0;
const sideOf = (m) => (m > 0.3 ? 'pos' : m < -0.25 ? 'neg' : 'neu');

function moodFor(ctx, p) {
  const { state, post, r } = ctx;
  if (post.moods[p.id] !== undefined) return post.moods[p.id];
  const a = post.analysis;
  if (post.world) {
    // drama của người khác: không liên quan tới thiện cảm với idol, phân cực ngẫu nhiên theo gu từng người
    const wv = a.tags.reduce((sum, t) => sum + valueOf(p, t), 0) * 0.3 + (r() - 0.5) * 1.4;
    post.moods[p.id] = clamp(wv, -1, 1);
    return post.moods[p.id];
  }
  let v = (state.accounts[p.id].stance / 100) * 0.5;
  const tagSum = a.tags.reduce((s, t) => s + valueOf(p, t), 0) / Math.max(1, a.tags.length * 0.6);
  v += tagSum * 0.35 + a.tone * 0.15 + (r() - 0.5) * 0.4;
  if (post.idx % 4 === 3 && p.role === 'hater') v -= 0.15;
  if (post.contradictions.length && ['soi', 'critic', 'hater'].includes(p.role)) v -= 0.25;
  post.moods[p.id] = clamp(v, -1, 1);
  return post.moods[p.id];
}

function remember(ctx, p, mood) {
  const { state, post } = ctx;
  if (post.world || post.remembered[p.id]) return;
  post.remembered[p.id] = true;
  const acc = state.accounts[p.id];
  const delta = Math.round(mood * 7) || 0; // tránh -0
  acc.stance = clamp(acc.stance + delta, -100, 100);
  const top = [...post.analysis.tags].sort((a, b) => Math.abs(valueOf(p, b)) - Math.abs(valueOf(p, a)))[0];
  const lead = mood > 0.3 ? 'thấy hợp vì' : mood < -0.25 ? 'mất thiện cảm vì' : 'chưa rõ lập trường vì';
  acc.memory.push({ postId: post.id, idx: state.idx, tags: post.analysis.tags, mood: r2(mood), delta,
    quote: post.analysis.quote, why: `${lead} bài ${C.TAG_LABELS[top]}` });
  if (acc.memory.length > 30) acc.memory.shift();
}

const agoText = (state, idx) => {
  const d = dayOf(state.idx) - dayOf(idx);
  return d <= 0 ? 'lúc nãy' : d === 1 ? 'hôm qua' : `${d} ngày trước`;
};

function callbackFor(ctx, p, mood) {
  const { state, post } = ctx;
  if (post.world) return '';
  const a = post.analysis;
  const m = [...state.accounts[p.id].memory].reverse()
    .find((e) => e.postId !== post.id && e.tags.some((t) => a.tags.includes(t)) && Math.abs(e.delta) >= 3);
  if (!m) return '';
  const label = C.TAG_LABELS[m.tags.find((t) => a.tags.includes(t))];
  const when = agoText(state, m.idx);
  if (m.mood < -0.25 && mood < -0.25) return `(${when} vụ ${label} mình đã thấy ngợ rồi, giờ lại thế này)`;
  if (m.mood < -0.25 && mood > 0.3) {
    const why = a.tags.includes('apology') ? 'vì bạn chịu nhận lỗi' : a.tags.includes('charity') ? 'vì thấy việc làm tử tế' : 'vì lần này nói rõ ràng hơn';
    return `(${when} vụ ${label} mình có chê, nhưng lần này mình đổi ý ${why})`;
  }
  if (m.mood > 0.3 && mood < -0.25) return `(${when} mình còn khen vụ ${label}, nay thấy hụt hẫng)`;
  return '';
}

/* ---------- sinh bình luận ---------- */
// Hiểu joke/tiếng lóng và nhận ra bài hát (chỉ theo tên bài/nhóm; câu trích chưa nhận ra thì hỏi thật lòng).
function specialLine(ctx, p, vars) {
  const { post, r } = ctx;
  const a = post.analysis;
  if (a.jokes.length && chance(r, 0.4)) {
    const j = pick(r, a.jokes);
    vars.joke = j.label;
    const young = !p.age || p.age < 35;
    const line = pickFresh(r, post, young ? L.JOKE_LINES.get : L.JOKE_LINES.dontget);
    if (line) return { line, how: young ? 'joke-get' : 'joke-dontget' };
    vars.joke = '';
  }
  if ((a.songs.length || a.groups.length || a.lyricLike) && chance(r, 0.45)) {
    const fanK = p.interests?.includes('kpop');
    let line = null, how = '';
    if (a.songs.length) {
      const sg = pick(r, a.songs);
      vars.song = sg.title; vars.artist = sg.artist;
      line = pickFresh(r, post, fanK ? L.SONG_LINES.know : L.SONG_LINES.ask); how = fanK ? 'song' : 'song-ask';
    } else if (a.groups.length) {
      vars.artist = pick(r, a.groups);
      if (fanK) { line = pickFresh(r, post, L.SONG_LINES.group); how = 'song'; }
    } else {
      line = pickFresh(r, post, fanK ? L.SONG_LINES.lyricFan : L.SONG_LINES.lyricAsk); how = 'lyric-ask';
    }
    if (line) return { line, how };
  }
  return null;
}

function composeText(ctx, p, mood, side, o = {}) {
  const { state, post, r } = ctx;
  const a = post.analysis;
  const subject = post.world ? post.subject : state.idol.name;
  const real = post.world ? '' : state.idol.realName;
  const useReal = real && (p.role === 'elder' || p.role === 'law' || (p.role === 'hater' && chance(r, 0.25)));
  const vars = { quote: a.quote, idol: useReal ? real : subject, to: o.to || '', photo: a.photos.length ? pick(r, a.photos) : '', joke: '', song: '', artist: '' };
  const tagKeys = a.tags.filter((t) => C.TAG_LINES[t]);
  const TL = tagKeys.length ? C.TAG_LINES[pick(r, tagKeys)] : null;
  const dig = post.contradictions[0];
  let line = null, how = 'role';
  const special = post.world ? null : specialLine(ctx, p, vars);
  if (special) { line = special.line; how = special.how; }
  else if (p.role === 'soi' && dig && chance(r, 0.85)) {
    line = `đào lại: ${agoText(state, dig.idx)} chính ${state.idol.name} nói "${dig.quote}" mà. giờ lại đăng thế này, sao đây?`;
    how = 'dig';
  } else if (p.knows === 'misread' && TL && chance(r, 0.65)) { line = pickFresh(r, post, TL.misread); how = 'misread'; }
  else if (p.knows === 'partial' && TL && chance(r, 0.3)) { line = pickFresh(r, post, TL.misread); how = 'misread'; }
  else if (a.photos.length && chance(r, 0.3) && (line = pickFresh(r, post, C.PHOTO_LINES[side]))) how = 'photo';
  else if (['insider', 'law', 'critic'].includes(p.role) && TL && chance(r, 0.75)) { line = pickFresh(r, post, TL.insight); how = 'insight'; }
  else if (TL && side !== 'neu' && chance(r, 0.5)) { line = pickFresh(r, post, TL[side]); how = 'tag'; }
  if (!line) { line = pickFresh(r, post, C.ROLE_LINES[p.role][side]) ?? pick(r, C.ROLE_LINES[p.role][side]); how = 'role'; }
  if (how !== 'dig') {
    const cb = callbackFor(ctx, p, mood);
    if (cb && chance(r, 0.5)) { line += ` ${cb}`; how += '+memory'; }
  }
  return { text: stylize(fillTpl(line, vars), p.style, r), how, joke: vars.joke || undefined };
}

function makeComment(ctx, p, o = {}) {
  const { state, r } = ctx;
  const mood = moodFor(ctx, p);
  const side = sideOf(mood);
  const { text, how, joke } = composeText(ctx, p, mood, side, o);
  remember(ctx, p, mood);
  return {
    id: nid(state, 'c'), pid: p.id, name: p.name, text, ...(joke ? { joke } : {}), t: Math.round(o.t), wave: ctx.wave,
    mood: r2(mood), side, how,
    likes: Math.max(0, Math.round(r() * r() * 6 * (1 + ctx.post.heat / 40) * (side === 'neu' ? 0.5 : 1))),
    replies: [],
  };
}

function makeReply(ctx, speaker, target, t, last) {
  const { state, post, r } = ctx;
  const mood = moodFor(ctx, speaker);
  const side = sideOf(mood);
  const agree = side !== 'neu' && side === target.side;
  const R = C.REPLY_LINES[speaker.role] || C.REPLY_LINES.generic;
  const vars = { quote: post.analysis.quote, idol: post.world ? post.subject : state.idol.name, to: callName(target.name) };
  const pool0 = agree ? R.agree : R.disagree;
  let line = pickFresh(r, post, pool0) ?? pick(r, pool0);
  let how = agree ? 'reply-agree' : 'reply-disagree';
  const tagKeys = post.analysis.tags.filter((tg) => C.TAG_LINES[tg]);
  if (side !== 'neu' && tagKeys.length && chance(r, 0.5)) line += ` ${pick(r, C.TAG_LINES[pick(r, tagKeys)][side])}`;
  if (last && chance(r, 0.5)) {
    const night = post.idx % 4 === 3 && chance(r, 0.5);
    line = night ? pick(r, C.NIGHT_ENDERS) : pick(r, C.ENDERS[speaker.role] || C.ENDERS.generic);
    how = 'reply-end';
  }
  return {
    id: nid(state, 'c'), pid: speaker.id, name: speaker.name, to: target.name, text: stylize(fillTpl(line, vars), speaker.style, r),
    t: Math.round(t), wave: ctx.wave, mood: r2(mood), side, how, likes: Math.round(r() * r() * 4), replies: [],
  };
}

function buildChain(ctx, parent, length) {
  const { r, pool } = ctx;
  const A = personaById(parent.pid);
  const want = parent.side === 'pos' ? 'neg' : parent.side === 'neg' ? 'pos' : null;
  const cands = pool.filter((p) => p.id !== A.id && p.role !== 'page').map((p) => {
    let w = 1;
    if (want && sideOf(moodFor(ctx, p)) === want) w += 3;
    if (['cakhia', 'hater', 'critic', 'soi', 'fan'].includes(p.role)) w += 1;
    return { p, w };
  });
  if (!cands.length) return;
  const B = weighted(r, cands).p;
  let t = parent.t + 1 + r() * 10;
  const first = makeReply(ctx, B, parent, t, false);
  parent.replies.push(first);
  let prev = first;
  for (let i = 1; i < length; i++) {
    t += 1 + r() * 12;
    const speaker = i % 2 === 1 ? A : B;
    const reply = makeReply(ctx, speaker, prev, t, i === length - 1);
    first.replies.push(reply);
    prev = reply;
  }
}

const NON_PAGE = ['fan', 'neutral', 'elder', 'hong', 'cakhia', 'hater', 'critic', 'soi', 'insider', 'law'];
const topIds = (list) => new Set(list.map((c) => c.pid));

function populate(ctx, list, roles, count, [t0, t1]) {
  const { r, pool } = ctx;
  const have = topIds(list);
  const cands = shuffle(r, pool.filter((p) => roles.includes(p.role) && !have.has(p.id))).slice(0, count);
  const made = cands.map((p) => makeComment(ctx, p, { t: t0 + r() * (t1 - t0) }));
  list.push(...made);
  list.sort((a, b) => a.t - b.t);
  return made;
}

function makeFeedPost(ctx, pers, kind, extra = {}) {
  const { state, post, r } = ctx;
  const a = post.analysis;
  const vars = { quote: a.quote, idol: post.world ? post.subject : state.idol.name, oldQuote: extra.oldQuote || '', days: extra.days || '', insight: '', summary: post.text };
  if (kind === 'analysis') {
    const tg = a.tags.find((t) => C.TAG_LINES[t]);
    vars.insight = tg ? fillTpl(pick(r, C.TAG_LINES[tg].insight), vars) : 'bài đăng đời thường, ít rủi ro nhưng cũng ít điểm nhấn.';
  }
  Object.assign(vars, extra.vars || {});
  const t = extra.t ?? 0;
  const base = state.idol.followers * (0.01 + r() * 0.03) * (kind.startsWith('news') ? 2 : 1);
  const fp = {
    id: nid(state, 'f'), pid: pers.id, name: pers.name, kind, about: post.id, idx: extra.idx ?? post.idx, t: Math.round(t),
    text: stylize(fillTpl(pick(r, C.FEED_POSTS[kind]), vars), pers.style, r), wave: ctx.wave,
    likes: Math.round(base), shares: Math.round(base * 0.15), comments: [],
  };
  populate(ctx, fp.comments, NON_PAGE, clamp(2 + Math.round(post.heat / 25), 2, 6), [t + 1, t + 240]);
  const chains = shuffle(r, fp.comments).slice(0, post.heat > 50 ? 2 : 1);
  for (const c of chains) buildChain(ctx, c, 2 + Math.floor(post.heat / 30));
  state.feed.push(fp);
  return fp;
}

/* ---------- các đợt phản ứng ---------- */
function makeCtx(state, post, wave) {
  const fame = fameOf(state);
  return { state, post, r: rngOf(state), fame, wave, pool: PERSONAS.filter((p) => p.minFame <= fame) };
}

// Người trẻ giải thích câu đùa cho người chưa hiểu; không bịa nghĩa nếu chưa có trong lexicon.
function explainJoke(ctx, c) {
  const { state, post, r, pool } = ctx;
  const j = post.analysis.jokes.find((x) => x.label === c.joke) || post.analysis.jokes[0];
  const cands = pool.filter((p) => ['fan', 'cakhia', 'hong'].includes(p.role) && p.age < 35 && p.id !== c.pid);
  if (!j || !cands.length) return;
  const B = pick(r, cands);
  const line = j.meaning ? pick(r, L.JOKE_LINES.explain) : pick(r, L.JOKE_LINES.explainNoMeaning);
  c.replies.push({
    id: nid(state, 'c'), pid: B.id, name: B.name, to: c.name,
    text: stylize(fillTpl(line, { to: callName(c.name), joke: j.label, meaning: j.meaning || '' }), B.style, r),
    t: c.t + 2 + Math.round(r() * 8), wave: ctx.wave, mood: 0, side: 'neu', how: 'joke-explain', likes: Math.round(r() * 3), replies: [],
  });
}

const WAVE_FNS = {
  1(ctx, w) {
    const { post, fame } = ctx;
    const n = clamp(Math.round(2 + (fame / 18) * slotOf(post.idx).mult), 2, 6);
    w.newComments += populate(ctx, post.comments, ['fan', 'neutral', 'elder', 'hong'], n, [1, 20]).length;
  },
  2(ctx, w) {
    const { post, fame } = ctx;
    const n = clamp(Math.round(3 + (fame / 10) * slotOf(post.idx).mult), 3, 10);
    w.newComments += populate(ctx, post.comments, ['fan', 'neutral', 'elder', 'hong', 'cakhia', 'critic', 'hater', 'soi'], n, [20, 120]).length;
  },
  3(ctx, w) {
    const { post, r } = ctx;
    w.newComments += populate(ctx, post.comments, ['cakhia', 'hater', 'critic', 'soi', 'fan'], 2 + Math.floor(post.heat / 40), [120, 360]).length;
    const parents = shuffle(r, post.comments).slice(0, clamp(Math.round(post.heat / 22), 1, 4));
    for (const p of parents) buildChain(ctx, p, clamp(2 + Math.floor(post.heat / 25) + (chance(r, 0.5) ? 1 : 0), 2, 8));
    for (const c of post.comments) if (c.how.startsWith('joke-dontget') && !c.replies.length) explainJoke(ctx, c);
    w.newComments = countComments(post.comments) - w.before;
  },
  4(ctx, w) {
    const { post, r, pool } = ctx;
    for (const pg of pool.filter((p) => p.role === 'page')) {
      const kind = pg.knows === 'accurate' ? 'newsCalm' : post.heat >= 35 ? 'newsHot' : 'newsCalm';
      w.newFeed.push(makeFeedPost(ctx, pg, kind, { t: 360 + r() * 120 }));
    }
    const ins = shuffle(r, pool.filter((p) => ['insider', 'law', 'critic'].includes(p.role)))[0];
    if (ins) w.newFeed.push(makeFeedPost(ctx, ins, 'analysis', { t: 400 + r() * 200 }));
    populate(ctx, post.comments, ['insider', 'law', 'critic'], 2, [360, 720]);
    w.newComments = countComments(post.comments) - w.before;
  },
  5(ctx, w) {
    const { post, r, pool, state } = ctx;
    populate(ctx, post.comments, NON_PAGE, 2 + Math.floor(post.heat / 40), [720, 1440]);
    const cak = shuffle(r, pool.filter((p) => p.role === 'cakhia'))[0];
    if (cak && post.heat >= 30) w.newFeed.push(makeFeedPost(ctx, cak, 'meme', { t: 720 + r() * 400 }));
    w.newComments = countComments(post.comments) - w.before;
    // chốt số liệu: người theo dõi tăng/giảm theo tâm trạng trung bình
    const moods = Object.values(post.moods);
    const avg = moods.length ? moods.reduce((s, m) => s + m, 0) / moods.length : 0;
    const gain = Math.round(post.reach * (0.12 + 0.4 * Math.max(0, avg)) * (1 + post.heat / 100));
    const loss = Math.round(post.reach * 0.25 * Math.max(0, -avg));
    post.followerDelta = gain - loss;
    state.idol.followers = Math.max(100, state.idol.followers + post.followerDelta);
  },
};

const LIKE_FRAC = [0.3, 0.55, 0.75, 0.9, 1];

export function nextWave(state, post) {
  if (post.wave >= 5) return null;
  const n = ++post.wave;
  const ctx = makeCtx(state, post, n);
  const w = { n, name: C.WAVES[n - 1].name, newComments: 0, newFeed: [], before: countComments(post.comments) };
  WAVE_FNS[n](ctx, w);
  const moods = Object.values(post.moods);
  const avg = moods.length ? moods.reduce((s, m) => s + m, 0) / moods.length : 0;
  const target = post.reach * (0.05 + 0.1 * clamp((avg + 1) / 2, 0, 1)) * (1 + post.heat / 150);
  post.likes = Math.round(target * LIKE_FRAC[n - 1]);
  post.shares = Math.round(post.likes * (0.08 + post.heat / 400));
  delete w.before;
  return w;
}

/* ---------- đồng hồ trong game, tin đồn ---------- */
export function addNotice(state, kind, text) {
  const n = { id: nid(state, 'n'), idx: state.idx, kind, text };
  state.notices.push(n);
  return n;
}

function blowRumor(state, rm) {
  const post = state.posts.find((p) => p.id === rm.postId);
  const ctx = makeCtx(state, post, 6);
  const { r } = ctx;
  const out = { feed: [], notices: [] };
  const byRole = (role) => PERSONAS.filter((p) => p.role === role);
  const push = (pers, kind, extra = {}) => out.feed.push(makeFeedPost(ctx, pers, kind, { idx: state.idx, t: r() * 60, ...extra }));
  if (rm.kind === 'dig') {
    const extra = { oldQuote: rm.old.quote, days: agoText(state, rm.old.idx) };
    push(byRole('soi')[0], 'dig', extra);
    if (rm.handled) {
      push(byRole('fan')[0], 'defend');
      state.idol.followers = Math.round(state.idol.followers * 0.99);
    } else {
      push(byRole('page')[0], 'digNews', extra);
      push(byRole('hater')[0], 'rant');
      push(byRole('hong')[0], 'ask');
      state.idol.followers = Math.round(state.idol.followers * 0.96);
    }
  } else {
    push(byRole('hong')[0], 'guess');
    push(byRole('cakhia')[0], 'meme');
    if (rm.handled) push(byRole('fan')[0], 'defend');
    else push(byRole('page')[0], 'newsHot');
    state.idol.followers = Math.round(state.idol.followers * (rm.handled ? 1.01 : 1.05));
  }
  out.notices.push(addNotice(state, 'drama',
    rm.kind === 'dig' ? 'Drama: bài cũ của bạn bị đào lại và đang lan rộng.' : 'Drama: dân mạng đang đoán bạn ám chỉ ai, chủ đề đã lên bảng tin.'));
  return out;
}

export const clockHooks = []; // world.js đăng ký hook (game show, tin nhắn, drama thế giới)

export function advanceClock(state) {
  state.idx++;
  const events = { notices: [], feed: [] };
  for (const rm of state.rumors) {
    if (rm.phase === 'pending' && state.idx >= rm.warnIdx) {
      rm.phase = 'warned';
      events.notices.push(addNotice(state, 'warning', C.NOTICES[rm.kind]));
    } else if (rm.phase === 'warned' && state.idx >= rm.blowIdx) {
      rm.phase = 'done';
      const o = blowRumor(state, rm);
      events.notices.push(...o.notices);
      events.feed.push(...o.feed);
    }
  }
  for (const h of clockHooks) h(state, events);
  return events;
}

/* ---------- người chơi trả lời bình luận ---------- */
// Điểm thiện cảm (-12..12) của một câu trả lời: lịch sự/xin lỗi cộng, đá xéo/gắt gỏng trừ.
export function replyDelta(a, plain) {
  let delta = a.tone * 5;
  if (a.tags.includes('apology')) delta += 6;
  if (a.tags.includes('cakhia')) delta -= 8;
  if (/\b(cam on|thuong|yeu|hieu|nhe)\b/.test(plain)) delta += 3;
  if (/\b(im di|lien quan gi|ranh|cau gi|bi dien)\b|!{2,}/.test(plain)) delta -= 6;
  return clamp(Math.round(delta), -12, 12);
}

export function findComment(state, id) {
  const walk = (list, post) => {
    for (const c of list) {
      if (c.id === id) return { c, post };
      const hit = walk(c.replies || [], post);
      if (hit) return hit;
    }
    return null;
  };
  for (const p of state.posts) { const hit = walk(p.comments, p); if (hit) return hit; }
  for (const f of state.feed) { const hit = walk(f.comments, state.posts.find((p) => p.id === f.about) ?? (state.world || []).find((w) => w.id === f.about)); if (hit) return hit; }
  return null;
}

export function replyToComment(state, commentId, text) {
  text = String(text || '').trim().slice(0, 300);
  if (!text) throw new Error('Câu trả lời đang trống');
  const found = findComment(state, commentId);
  if (!found) throw new Error('Không tìm thấy bình luận');
  const { c: target, post } = found;
  if (target.me) throw new Error('Đây là bình luận của bạn');
  if (target.replies.some((x) => x.me)) throw new Error('Bạn đã trả lời bình luận này rồi');
  const ctx = makeCtx(state, post, 7);
  const { r } = ctx;
  const a = analyze(text);
  const plain = stripAccents(text.toLowerCase());
  for (const k of a.claims) state.claims.push({ key: k, postId: post.id, idx: state.idx, quote: a.quote });

  const delta = replyDelta(a, plain);

  const mine = {
    id: nid(state, 'c'), pid: 'me', name: state.idol.name, to: target.name, text, t: target.t + 1 + Math.round(r() * 10),
    wave: 7, mood: 0, side: 'neu', how: 'player', likes: Math.round(r() * 3), replies: [], me: true,
  };
  target.replies.push(mine);

  const P = personaById(target.pid);
  const acc = state.accounts[P.id];
  const mood = clamp(moodFor(ctx, P) + (delta / 12) * 0.8, -1, 1);
  const side = sideOf(mood);
  acc.stance = clamp(acc.stance + Math.round(delta * 0.8), -100, 100);
  acc.memory.push({ postId: post.id, idx: state.idx, tags: a.tags, mood: r2(mood), delta: Math.round(delta * 0.8),
    quote: a.quote, why: delta >= 0 ? 'idol trả lời trực tiếp, thấy được tôn trọng' : 'idol trả lời trực tiếp, thấy khó chịu' });
  const R = C.IDOL_REPLY[P.role] || C.IDOL_REPLY.generic;
  const react = {
    id: nid(state, 'c'), pid: P.id, name: P.name, to: state.idol.name,
    text: stylize(fillTpl(pick(r, R[side]), { idol: state.idol.name }), P.style, r),
    t: mine.t + 1 + Math.round(r() * 8), wave: 7, mood: r2(mood), side, how: 'react-to-idol', likes: Math.round(r() * 4), replies: [],
  };
  mine.replies.push(react);

  // Người xung quanh phản ứng theo hướng của câu trả lời
  const kind = delta >= 3 ? 'pos' : delta <= -3 ? 'neg' : 'neu';
  const bystanders = shuffle(r, ctx.pool.filter((p) => p.id !== P.id && C.BYSTANDER[kind][p.role])).slice(0, kind === 'neu' ? 1 : 2);
  let tt = react.t;
  for (const B of bystanders) {
    tt += 1 + Math.round(r() * 6);
    mine.replies.push({
      id: nid(state, 'c'), pid: B.id, name: B.name, to: state.idol.name, text: stylize(pick(r, C.BYSTANDER[kind][B.role]), B.style, r),
      t: tt, wave: 7, mood: 0, side: kind === 'neg' ? 'neg' : 'pos', how: 'bystander', likes: Math.round(r() * 3), replies: [],
    });
  }
  state.idol.followers = Math.max(100, Math.round(state.idol.followers * (1 + delta / 1500)));
  return { reply: mine, delta };
}

/* ---------- nhận diện bài hát nhờ Claude (tùy chọn) ---------- */
export function addSong(post, song) {
  post.analysis.songs.push(song);
  post.analysis.lyricLike = false;
  if (!post.analysis.tags.includes('music')) post.analysis.tags.push('music');
}

// Dùng cho world.js
export { rngOf, pick, chance, shuffle, weighted, fillTpl, nid, stylize, makeCtx, makeFeedPost, moodFor, sideOf, callName, valueOf };
