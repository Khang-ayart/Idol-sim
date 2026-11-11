import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createPost, nextWave, advanceClock, analyze, countComments, fameOf, personaById, replyToComment, findComment } from '../js/engine.js';

const walk = (list, fn) => list.forEach((c) => { fn(c); walk(c.replies || [], fn); });
const allTexts = (state) => {
  const out = [];
  state.posts.forEach((p) => walk(p.comments, (c) => out.push(c.text)));
  state.feed.forEach((f) => { out.push(f.text); walk(f.comments, (c) => out.push(c.text)); });
  return out;
};
const runAllWaves = (state, post) => { while (nextWave(state, post)); };

test('analyze: nhận tag, claim, trích dẫn thật từ bài', () => {
  const a = analyze('Mình sẽ không bao giờ nhận quảng cáo. Mình sống giản dị thôi!');
  assert.deepEqual(a.claims.sort(), ['humble', 'noAd']);
  assert.ok(!a.tags.includes('ad'), 'câu phủ định không được tính là quảng cáo');
  assert.ok(!a.tags.includes('flex'));
  const b = analyze('Hợp tác cùng nhãn hàng X, mua ngay giảm giá nhé #ad');
  assert.ok(b.tags.includes('ad'));
  const c = analyze('Một số người nên biết điều.');
  assert.ok(c.tags.includes('cakhia') && c.vague);
  assert.ok('Một số người nên biết điều.'.includes(c.quote));
});

test('tái lập được theo seed và state là JSON thuần', () => {
  const run = () => {
    const s = createGame({ name: 'Lâm Vy', tier: 'star', seed: 42 });
    const p = createPost(s, 'Chào mọi người, hôm nay mình ra mắt MV mới!');
    runAllWaves(s, p);
    return s;
  };
  const a = run(), b = run();
  assert.deepEqual(allTexts(a), allTexts(b));
  assert.deepEqual(JSON.parse(JSON.stringify(a)), a);
});

test('5 đợt: số bình luận tăng dần, có tranh luận nhiều tầng, không sót placeholder', () => {
  const s = createGame({ name: 'Lâm Vy', tier: 'star', seed: 7 });
  const p = createPost(s, 'Một số người cứ thích đánh giá thấp người khác. Mình thì thôi, dừng ở đây.');
  const counts = [];
  for (let i = 1; i <= 5; i++) { const w = nextWave(s, p); assert.equal(w.n, i); counts.push(countComments(p.comments)); }
  assert.equal(nextWave(s, p), null);
  assert.ok(counts[0] > 0 && counts[4] > counts[0], `counts=${counts}`);
  let depth = 0;
  const dep = (l, d) => l.forEach((c) => { depth = Math.max(depth, d); dep(c.replies, d + 1); });
  dep(p.comments, 1);
  assert.ok(depth >= 3, `độ sâu thread = ${depth}`);
  for (const t of allTexts(s)) assert.ok(!/[{}]/.test(t), `placeholder thừa: ${t}`);
});

test('đa dạng: ít trùng lặp, có người hiểu sai và người hiểu đúng', () => {
  const s = createGame({ name: 'Lâm Vy', tier: 'star', seed: 11 });
  const p = createPost(s, 'Hợp tác cùng nhãn hàng X, mua ngay giảm giá nhé #ad');
  runAllWaves(s, p);
  const texts = allTexts(s);
  assert.ok(new Set(texts).size / texts.length > 0.8, 'quá nhiều bình luận giống hệt nhau');
  const hows = new Set(); walk(p.comments, (c) => hows.add(c.how.split('+')[0]));
  assert.ok(hows.has('misread') || hows.has('insight'), `hows=${[...hows]}`);
  const authors = new Set(); walk(p.comments, (c) => authors.add(personaById(c.pid).role));
  assert.ok(authors.size >= 5, 'cần nhiều kiểu người');
});

test('đào lại: tuyên bố cũ bị lôi ra, có báo trước rồi mới nổ, trích đúng câu gốc', () => {
  const s = createGame({ name: 'Lâm Vy', tier: 'star', seed: 5 });
  const p1 = createPost(s, 'Mình sẽ không bao giờ nhận quảng cáo nhé.');
  runAllWaves(s, p1);
  advanceClock(s); advanceClock(s);
  const p2 = createPost(s, 'Hợp tác cùng nhãn hàng X, mua ngay giảm giá nhé #ad');
  assert.equal(p2.contradictions.length, 1);
  assert.equal(s.rumors.length, 1);
  runAllWaves(s, p2);
  let dugInComments = false;
  walk(p2.comments, (c) => { if (c.how === 'dig' && c.text.includes('không bao giờ nhận quảng cáo')) dugInComments = true; });
  assert.ok(dugInComments, 'soi phải trích đúng câu cũ trong bình luận');
  const e1 = advanceClock(s);
  assert.equal(e1.notices[0].kind, 'warning');
  assert.equal(e1.feed.length, 0, 'chưa nổ ngay, mới cảnh báo');
  const e2 = advanceClock(s);
  assert.ok(e2.feed.length >= 3);
  assert.ok(e2.feed.some((f) => f.kind === 'dig' && f.text.includes('không bao giờ nhận quảng cáo')));
});

test('xin lỗi kịp thời làm drama nhẹ hơn', () => {
  const mk = (apologize) => {
    const s = createGame({ name: 'Lâm Vy', tier: 'star', seed: 9 });
    createPost(s, 'Mình sẽ không bao giờ nhận quảng cáo nhé.');
    advanceClock(s);
    createPost(s, 'Hợp tác cùng nhãn hàng X, mua ngay giảm giá nhé #ad');
    advanceClock(s);
    if (apologize) createPost(s, 'Mình xin lỗi vì đã nói trước bước sau. Mình nhận lỗi và sẽ rút kinh nghiệm.');
    return advanceClock(s);
  };
  assert.ok(mk(true).feed.length < mk(false).feed.length);
});

test('trí nhớ: nhân vật ghi lại lý do đổi quan điểm', () => {
  const s = createGame({ name: 'Lâm Vy', tier: 'star', seed: 3 });
  const p = createPost(s, 'Hợp tác cùng nhãn hàng X, mua ngay giảm giá nhé #ad');
  runAllWaves(s, p);
  const withMem = Object.values(s.accounts).filter((a) => a.memory.length);
  assert.ok(withMem.length > 5);
  assert.ok(withMem[0].memory[0].why.length > 0);
});

test('người mới: ít nhân vật xuất hiện hơn người đã nổi', () => {
  const small = createGame({ name: 'A', tier: 'newbie', seed: 1 });
  const big = createGame({ name: 'A', tier: 'star', seed: 1 });
  assert.ok(fameOf(small) < fameOf(big));
  const ps = createPost(small, 'Chào mọi người, mình là người mới!');
  const pb = createPost(big, 'Chào mọi người, mình là người mới!');
  runAllWaves(small, ps); runAllWaves(big, pb);
  assert.ok(countComments(ps.comments) < countComments(pb.comments));
});

test('ảnh trong *...*: tách mô tả, quote không dính dấu *, có người nhắc đúng mô tả ảnh', () => {
  const a = analyze('Chào cả nhà! *ảnh selfie ở biển* Hôm nay nắng đẹp.');
  assert.deepEqual(a.photos, ['selfie ở biển']);
  assert.ok(!a.quote.includes('*'));
  assert.equal(analyze('*ảnh check-in resort*').quote, 'check-in resort');
  assert.ok(analyze('*ảnh check-in resort*').tags.includes('flex'), 'mô tả ảnh cũng được phân tích chủ đề');
  let found = false;
  for (let seed = 1; seed <= 6 && !found; seed++) {
    const s = createGame({ name: 'Lâm Vy', tier: 'star', seed });
    const p = createPost(s, 'Hôm nay đi chơi! *ảnh selfie ở biển*');
    while (nextWave(s, p));
    walk(p.comments, (c) => { if (c.how.startsWith('photo')) { found = true; assert.ok(c.text.toLowerCase().includes('selfie ở biển')); } });
  }
  assert.ok(found, 'ít nhất một bình luận phải nhắc tới ảnh');
});

test('tên thật + nghệ danh: người lớn tuổi gọi tên thật, tài khoản khác gọi nghệ danh', () => {
  let elderReal = false, otherStage = false;
  for (let seed = 1; seed <= 8; seed++) {
    const s = createGame({ name: 'Lâm Vy', realName: 'Nguyễn Thu Vy', tier: 'star', seed });
    const p = createPost(s, 'Hợp tác cùng nhãn hàng X, mua ngay giảm giá nhé #ad');
    while (nextWave(s, p));
    walk(p.comments, (c) => {
      const role = personaById(c.pid).role;
      if (role === 'elder' && c.text.includes('Nguyễn Thu Vy')) elderReal = true;
      if (role === 'fan' && /lâm vy/i.test(c.text)) otherStage = true;
    });
  }
  assert.ok(elderReal, 'elder phải gọi bằng tên thật');
  assert.ok(otherStage, 'fan phải gọi bằng nghệ danh');
});

test('người chơi trả lời bình luận: có phản ứng, có trí nhớ, chỉ trả lời một lần', () => {
  const s = createGame({ name: 'Lâm Vy', tier: 'star', seed: 4 });
  const p = createPost(s, 'Hợp tác cùng nhãn hàng X, mua ngay giảm giá nhé #ad');
  while (nextWave(s, p));
  const target = p.comments.find((c) => personaById(c.pid).role === 'hater') || p.comments[0];
  const before = s.accounts[target.pid].stance;
  const { reply, delta } = replyToComment(s, target.id, 'Cảm ơn bạn đã góp ý, mình xin lỗi và sẽ rút kinh nghiệm nhé');
  assert.ok(delta > 0);
  assert.ok(reply.me && reply.replies.length >= 2, 'người được rep và người xung quanh phải phản ứng');
  assert.equal(reply.replies[0].pid, target.pid);
  assert.ok(s.accounts[target.pid].stance > before);
  assert.match(s.accounts[target.pid].memory.at(-1).why, /idol trả lời/);
  assert.throws(() => replyToComment(s, target.id, 'thêm nữa'), /đã trả lời/);
  assert.throws(() => replyToComment(s, target.id, '   '), /trống/);
  assert.ok(findComment(s, reply.id), 'tìm được cả bình luận của mình');
  const rude = p.comments.find((c) => c !== target && !c.replies.some((x) => x.me));
  const r2 = replyToComment(s, rude.id, 'Im đi!! Liên quan gì tới bạn');
  assert.ok(r2.delta < 0);
  assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('người chơi trả lời bình luận dưới bài của page (feed) cũng được', () => {
  const s = createGame({ name: 'Lâm Vy', tier: 'star', seed: 8 });
  const p = createPost(s, 'Một số người cứ thích đánh giá thấp người khác.');
  while (nextWave(s, p));
  const fp = s.feed.find((f) => f.comments.length);
  assert.ok(fp);
  const out = replyToComment(s, fp.comments[0].id, 'Mình chỉ chia sẻ cảm xúc thôi, không nhắm ai cả nhé');
  assert.ok(out.reply.me);
});

test('không nhận nhầm: "ủng hộ" thường và "nhiều người" không phải từ thiện hay đá xéo', () => {
  const a = analyze('Cảm ơn nhiều người đã ủng hộ mình, mong mọi người tiếp tục ủng hộ');
  assert.ok(!a.tags.includes('charity') && !a.tags.includes('cakhia') && !a.vague, `tags=${a.tags}`);
  assert.ok(analyze('Mình ủng hộ quỹ từ thiện cho trẻ em khó khăn').tags.includes('charity'));
  assert.ok(analyze('Mình sẽ ủng hộ đồng bào vùng lũ').tags.includes('charity'));
});
