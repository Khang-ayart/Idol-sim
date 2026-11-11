import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createPost, nextWave, advanceClock, analyze, personaById, replyToComment, addSong } from '../js/engine.js';
import {
  enableWorld, inviteGameshow, respondInvite, answerGameshow, addPoints, checkProgress, rankInfo, replyMessage,
  maybeWorldDrama, onPostReacted, unreadCount, ensure,
} from '../js/world.js';

enableWorld();
const walk = (list, fn) => list.forEach((c) => { fn(c); walk(c.replies || [], fn); });
const texts = (state) => {
  const out = [];
  [...state.posts, ...(state.world || [])].forEach((p) => walk(p.comments, (c) => out.push(c.text)));
  state.feed.forEach((f) => { out.push(f.text); walk(f.comments, (c) => out.push(c.text)); });
  return out;
};
const runWaves = (s, p) => { while (nextWave(s, p)); };

/* ---------- hiểu joke, nhận diện bài hát ---------- */
test('joke: "mồn lèo", "lòng xào dưa" được hiểu là câu đùa, không phải nghĩa đen, không bịa nghĩa', () => {
  const a = analyze('Hôm nay mình mồn lèo quá, lòng xào dưa luôn haha');
  assert.deepEqual(a.jokes.map((j) => j.label).sort(), ['lòng xào dưa', 'mồn lèo']);
  assert.ok(a.tags.includes('joke'));
  assert.ok(!a.tags.includes('food'), 'lòng xào dưa là câu đùa, không phải bài về ăn uống');
  assert.ok(a.jokes.every((j) => j.meaning === null), 'chưa xác nhận nghĩa thì không được tự bịa');
  assert.ok(!a.vague);
});

test('joke: người trẻ hiểu, người lớn tuổi hỏi, người trẻ giải thích (có nghĩa thì nói nghĩa, không thì không bịa)', () => {
  const seen = { get: false, dontget: false, explain: false };
  for (let seed = 1; seed <= 12; seed++) {
    const s = createGame({ name: 'Lâm Vy', tier: 'star', seed });
    const p = createPost(s, 'Hôm nay mình mồn lèo quá, ét o ét haha');
    runWaves(s, p);
    walk(p.comments, (c) => {
      if (c.how.startsWith('joke-get')) seen.get = true;
      if (c.how.startsWith('joke-dontget')) { seen.dontget = true; assert.ok(personaById(c.pid).age >= 35); }
      if (c.how === 'joke-explain') {
        seen.explain = true;
        if (/ét o ét/i.test(c.text)) assert.match(c.text, /SOS/i);
        if (/mồn lèo/i.test(c.text)) assert.doesNotMatch(c.text, /nghĩa là/);
      }
    });
  }
  assert.deepEqual(seen, { get: true, dontget: true, explain: true });
});

test('bài hát: nhận theo tên bài + nhóm, tên bài đa nghĩa không bị nhận nhầm, câu trích chưa nhận ra thì hỏi thật', () => {
  assert.deepEqual(analyze('Đang nghe "Sheesh" của BABYMONSTER').songs, [{ title: 'Sheesh', artist: 'BABYMONSTER' }]);
  assert.equal(analyze('sheesh mệt quá').songs.length, 0);
  assert.equal(analyze('Forever young, forever tired').songs.length, 0);
  assert.equal(analyze('Nghe Batter Up mà mê').songs.length, 0);
  assert.equal(analyze('Nghe Batter Up của Babymonster mà mê').songs[0].artist, 'BABYMONSTER');
  assert.equal(analyze('Hype Boy hay quá').songs[0].artist, 'NewJeans');
  const g = analyze('mình thích Babymonster lắm');
  assert.deepEqual(g.groups, ['BABYMONSTER']);
  assert.ok(g.tags.includes('music'));
  const lyric = analyze('♪ một câu hát nào đó ♪ mình nhớ mãi');
  assert.ok(lyric.lyricLike && lyric.songs.length === 0);

  let know = false, ask = false;
  for (let seed = 1; seed <= 10; seed++) {
    const s = createGame({ name: 'Lâm Vy', tier: 'star', seed });
    const p = createPost(s, 'Đang nghe "Sheesh" của BABYMONSTER cả ngày');
    runWaves(s, p);
    walk(p.comments, (c) => {
      if (c.how.startsWith('song') && c.how !== 'song-ask') { know = true; assert.match(c.text.toLowerCase(), /sheesh|babymonster/); }
      if (c.how.startsWith('song-ask')) ask = true;
    });
  }
  assert.ok(know && ask, 'fan K-pop nhận ra, người khác hỏi');

  let lyricAsk = false;
  for (let seed = 1; seed <= 10 && !lyricAsk; seed++) {
    const s = createGame({ name: 'Lâm Vy', tier: 'star', seed });
    const p = createPost(s, '♪ một câu hát nào đó ♪ mình nhớ mãi');
    runWaves(s, p);
    walk(p.comments, (c) => { if (c.how.startsWith('lyric-ask')) lyricAsk = true; });
  }
  assert.ok(lyricAsk);
  const s2 = createGame({ name: 'Lâm Vy', tier: 'star', seed: 1 });
  const p2 = createPost(s2, '♪ một câu hát nào đó ♪');
  addSong(p2, { title: 'Sheesh', artist: 'BABYMONSTER', via: 'claude' });
  assert.ok(!p2.analysis.lyricLike && p2.analysis.songs.length === 1);
});

/* ---------- game show ---------- */
const GOOD = 'Mình nghĩ quan trọng nhất là luôn tôn trọng khán giả và fan, cảm ơn mọi người đã luôn ủng hộ mình haha';

test('game show: mời bất ngờ từ ngày thứ hai, nhận lời, 10 câu, điểm tích lũy, thắng thì tăng fan và hạng', () => {
  const s = createGame({ name: 'Lâm Vy', tier: 'rising', seed: 6 });
  for (let i = 0; i < 4; i++) advanceClock(s);
  assert.equal(s.gameshow.status, 'invited');
  assert.equal(s.gameshow.questions.length, 10);
  assert.ok(s.inbox.some((m) => m.kind === 'gameshow-invite'));
  assert.throws(() => answerGameshow(s, 'chưa nhận lời'), /không có game show/i);
  respondInvite(s, true);
  const f0 = s.idol.followers, pts0 = s.rank.points;
  let last;
  for (let i = 0; i < 10; i++) {
    last = answerGameshow(s, GOOD);
    assert.ok(last.entry.reasons.length && last.entry.host && last.entry.q);
  }
  assert.ok(last.finished);
  assert.ok(['won', 'ok'].includes(s.gameshow.status), `status=${s.gameshow.status}, score=${s.gameshow.score}`);
  assert.ok(s.idol.followers > f0 && s.rank.points > pts0);
  assert.equal(s.gameshow.log.length, 10);
  const hl = s.posts.find((p) => p.source === 'gameshow');
  assert.ok(hl && hl.sourceTitle === s.gameshow.title, 'câu trả lời nổi bật thành bài đăng để cộng đồng bàn tán');
  assert.throws(() => answerGameshow(s, 'thêm'), /không có game show/i);
});

test('game show: né câu hỏi, đá xéo đồng nghiệp thì tụt điểm về 0 và thua sớm, mất fan', () => {
  const s = createGame({ name: 'Lâm Vy', tier: 'rising', seed: 3 });
  inviteGameshow(s); respondInvite(s, true);
  const f0 = s.idol.followers;
  let res, n = 0;
  while (!res?.finished && n < 10) { res = answerGameshow(s, 'không biết'); n++; }
  assert.equal(s.gameshow.status, 'lost');
  assert.ok(n < 10 && s.gameshow.score === 0);
  assert.ok(s.idol.followers < f0);
  assert.ok(s.notices.some((x) => /bị loại/.test(x.text)));

  const t = createGame({ name: 'Lâm Vy', tier: 'rising', seed: 3 });
  inviteGameshow(t); respondInvite(t, true);
  t.gameshow.questions[0] = { cat: 'trap', text: 'Đồng nghiệp nào hát dở nhất?' };
  const bad = answerGameshow(t, 'Một số người trong giới hát dở thật, đồng nghiệp cũ của mình nghe mà ngán');
  assert.ok(bad.entry.delta <= -5, `delta=${bad.entry.delta}`);
  assert.ok(bad.entry.reasons.some((x) => /đụng tới người khác/.test(x)));
  assert.ok(bad.entry.crowd.length >= 1);
});

test('game show: trả lời mâu thuẫn với điều từng khẳng định bị trừ điểm', () => {
  const s = createGame({ name: 'Lâm Vy', tier: 'rising', seed: 2 });
  createPost(s, 'Mình sẽ không bao giờ nhận quảng cáo nhé.');
  inviteGameshow(s); respondInvite(s, true);
  const r = answerGameshow(s, 'Mình vừa hợp tác với nhãn hàng, mua ngay giảm giá nhé #ad các bạn');
  assert.ok(r.entry.reasons.some((x) => /mâu thuẫn/.test(x)));
});

test('từ chối lời mời: không mất gì, không bị mời lại ngay', () => {
  const s = createGame({ name: 'Lâm Vy', tier: 'rising', seed: 5 });
  inviteGameshow(s); respondInvite(s, false);
  assert.equal(s.gameshow.status, 'declined');
  for (let i = 0; i < 4; i++) advanceClock(s);
  assert.equal(s.gameshow.status, 'declined');
});

/* ---------- hạng & mốc ---------- */
test('hạng: đủ điểm thì thăng hạng kèm thông báo và tin nhắn quản lý; mốc fan được ghi nhận một lần', () => {
  const s = createGame({ name: 'A', tier: 'newbie', seed: 1 });
  ensure(s);
  assert.equal(rankInfo(s).index, 0);
  addPoints(s, 45);
  assert.equal(rankInfo(s).index, 1);
  assert.ok(s.notices.some((n) => n.kind === 'rank' && /Thăng hạng/.test(n.text)));
  assert.ok(s.inbox.some((m) => m.kind === 'rank'));
  addPoints(s, -45);
  assert.ok(s.notices.some((n) => /Tụt hạng/.test(n.text)));
  checkProgress(s);
  s.idol.followers = 1300;
  checkProgress(s); checkProgress(s);
  assert.equal(s.notices.filter((n) => n.kind === 'milestone').length, 1);
});

/* ---------- Mess ---------- */
test('Mess: nhận tin từ fan/nghệ sĩ/nhãn hàng, trả lời một lần, có hệ quả và trí nhớ', () => {
  const s = createGame({ name: 'Lâm Vy', tier: 'star', seed: 12 });
  for (let i = 0; i < 40; i++) advanceClock(s);
  assert.ok(s.inbox.length >= 4, `inbox=${s.inbox.length}`);
  assert.ok(s.inbox.some((m) => m.kind === 'brand'), 'đủ nổi thì có nhãn hàng mời');
  assert.ok(s.inbox.some((m) => m.from.kind === 'artist'));
  const free = s.inbox.find((m) => !m.actions && m.from.kind === 'persona');
  if (free) {
    const st0 = s.accounts[free.from.id].stance;
    const out = replyMessage(s, free.id, 'Cảm ơn bạn nhiều nhé, mình rất trân trọng');
    assert.ok(out.delta > 0 && free.thread.length === 3 && s.accounts[free.from.id].stance > st0);
    assert.throws(() => replyMessage(s, free.id, 'lần nữa'), /đã trả lời/);
  }
  const brand = s.inbox.find((m) => m.kind === 'brand');
  assert.throws(() => replyMessage(s, brand.id, {}), /chọn/);
  const p0 = s.rank.points;
  replyMessage(s, brand.id, { action: 'accept' });
  assert.ok(brand.resolved && s.rank.points > p0);
  assert.ok(s.inbox.some((m) => m.kind === 'manager' && /#ad/.test(m.thread[0].text)));
  assert.ok(unreadCount(s) >= 0);
});

test('Mess: quản lý nhắn báo trước khi bị đào lại, để kịp chuẩn bị', () => {
  const s = createGame({ name: 'Lâm Vy', tier: 'star', seed: 5 });
  createPost(s, 'Mình sẽ không bao giờ nhận quảng cáo nhé.');
  advanceClock(s);
  createPost(s, 'Hợp tác cùng nhãn hàng X, mua ngay giảm giá nhé #ad');
  const before = s.inbox.length;
  advanceClock(s);
  assert.ok(s.inbox.slice(before).some((m) => m.kind === 'manager' && /đào lại|lục lại/.test(m.thread[0].text)));
});

test('Mess: fan nhắn riêng sau khi bài đăng có phản ứng', () => {
  let got = false;
  for (let seed = 1; seed <= 12 && !got; seed++) {
    const s = createGame({ name: 'Lâm Vy', tier: 'star', seed });
    const p = createPost(s, 'Hôm nay mình ra mắt sản phẩm mới, cảm ơn mọi người nhiều lắm');
    nextWave(s, p); nextWave(s, p);
    onPostReacted(s, p, 2);
    got = s.inbox.some((m) => m.kind === 'persona' && m.thread[0].text.includes(p.analysis.quote));
  }
  assert.ok(got, 'tin nhắn phải trích đúng câu có thật trong bài');
});

/* ---------- drama thế giới ---------- */
test('drama thế giới: có tin trong giới không liên quan tới người chơi, người chơi vẫn trả lời bình luận được', () => {
  const s = createGame({ name: 'Lâm Vy', tier: 'star', seed: 4 });
  const wp = maybeWorldDrama(s, true);
  const feed = s.feed.filter((f) => f.about === wp.id);
  assert.ok(feed.length >= 3);
  assert.ok(s.notices.some((n) => n.kind === 'world'));
  const all = texts(s).join('\n').toLowerCase();
  assert.ok(all.includes(wp.subject.toLowerCase()));
  assert.ok(!all.includes('lâm vy'), 'drama của người khác không được nhắc tên người chơi');
  assert.ok(!/[{}]|undefined/.test(all));
  const c = feed.flatMap((f) => f.comments)[0];
  assert.ok(replyToComment(s, c.id, 'Mình nghĩ cần chờ thông tin chính thức nhé').reply.me);
  assert.equal(s.posts.length, 0, 'không tạo bài đăng của người chơi');
});

test('drama thế giới: khi có liên quan tới người chơi thì có tin nhắn hỏi quan điểm, chọn phe hay im lặng đều có hệ quả', () => {
  let s, wp;
  for (let seed = 1; seed <= 60; seed++) {
    s = createGame({ name: 'Lâm Vy', tier: 'star', seed });
    wp = maybeWorldDrama(s, true);
    if (wp.involves) break;
  }
  assert.ok(wp.involves, 'cần tìm được seed có liên quan');
  const m = s.inbox.find((x) => x.kind === 'drama-involve');
  assert.equal(m.actions.length, 3);
  const n0 = s.feed.length;
  replyMessage(s, m.id, { action: 'A' });
  assert.ok(wp.resolved && s.feed.length === n0 + 1);
  const t = s.feed.at(-1).text.toLowerCase();
  assert.ok(t.includes('lâm vy') && t.includes(wp.subject.toLowerCase()));
});

test('mô phỏng dài: 60 khung giờ, đăng bài xen kẽ, không lỗi, không rò placeholder, tái lập theo seed, JSON thuần', () => {
  const run = () => {
    const s = createGame({ name: 'Lâm Vy', realName: 'Nguyễn Thu Vy', tier: 'newbie', seed: 77 });
    const lines = ['Chào cả nhà, mình mới vào nghề!', 'Hôm nay mình ra mắt MV mới, mong mọi người ủng hộ', 'Mồn lèo quá haha *ảnh selfie ở biển*', 'Một số người nên biết điều.'];
    for (let i = 0; i < 60; i++) {
      if (i % 3 === 0) { const p = createPost(s, lines[(i / 3) % lines.length]); while (nextWave(s, p)) { /* hết đợt */ } onPostReacted(s, p, 2); }
      advanceClock(s);
      if (s.gameshow?.status === 'invited') respondInvite(s, true);
      if (s.gameshow?.status === 'live') answerGameshow(s, GOOD);
    }
    return s;
  };
  const a = run(), b = run();
  assert.deepEqual(texts(a), texts(b));
  assert.deepEqual(JSON.parse(JSON.stringify(a)), a);
  assert.ok(!/[{}]|undefined|NaN/.test(texts(a).join('\n')));
  assert.ok(a.world.length >= 3 && a.inbox.length >= 3 && a.gameshow);
});
