import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createPost, nextWave, advanceClock } from '../js/engine.js';
import { enableWorld, inviteGameshow, respondInvite, answerGameshow, maybeWorldDrama, ensure } from '../js/world.js';
import { gameView, setupView, esc, bodyHtml } from '../js/views.js';

const ui = { tab: 'feed', backstage: true, ai: true, aiKey: '', draft: '' };

function play() {
  const s = createGame({ name: 'Lâm Vy', job: 'Ca sĩ', bio: 'Tân binh', tier: 'star', seed: 21 });
  let p = createPost(s, 'Mình sẽ không bao giờ nhận quảng cáo nhé.');
  while (nextWave(s, p));
  advanceClock(s);
  p = createPost(s, 'Hợp tác cùng nhãn hàng X, mua ngay giảm giá nhé #ad');
  while (nextWave(s, p));
  advanceClock(s); advanceClock(s);
  return s;
}

test('các tab render không lỗi, không rò undefined/NaN', () => {
  const s = play();
  for (const tab of ['feed', 'mine', 'notices']) {
    const html = gameView(s, { ...ui, tab });
    assert.ok(html.length > 500);
    assert.ok(!/undefined|NaN|\[object/.test(html), `tab ${tab} có giá trị lỗi`);
  }
  assert.ok(/giả lập/.test(gameView(s, ui)), 'nội dung bên thứ ba phải gắn nhãn giả lập');
  assert.ok(/Những điều bạn từng khẳng định/.test(gameView(s, { ...ui, tab: 'mine' })));
  assert.ok(/Thông báo/.test(gameView(s, { ...ui, tab: 'notices' })));
});

test('màn hình thiết lập và game trống', () => {
  assert.ok(/data-form="setup"/.test(setupView()));
  const s = createGame({ name: 'A', tier: 'newbie', seed: 1 });
  assert.ok(/Bảng tin còn trống/.test(gameView(s, ui)));
});

test('escape HTML: bài đăng chứa script không được chèn vào DOM', () => {
  const s = createGame({ name: '<img src=x onerror=alert(1)>', tier: 'star', seed: 2 });
  const p = createPost(s, '<script>alert(1)</script> xin chào');
  nextWave(s, p);
  const html = gameView(s, ui);
  assert.ok(!html.includes('<script>alert'));
  assert.ok(!html.includes('<img src=x'));
  assert.equal(esc(`<a href="x">&'`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
});

test('ảnh *...* thành khung ảnh, nút trả lời và form trả lời hiện đúng chỗ', () => {
  assert.equal(bodyHtml('a *ảnh <b>x</b>* b'), 'a <div class="photo">📷 ảnh &lt;b&gt;x&lt;/b&gt;</div> b');
  const s = createGame({ name: 'Lâm Vy', realName: 'Nguyễn Thu Vy', tier: 'star', seed: 3 });
  const p = createPost(s, 'Hôm nay đi biển! *ảnh selfie ở biển*');
  nextWave(s, p);
  let html = gameView(s, { ...ui, backstage: false });
  assert.ok(html.includes('class="photo"'));
  assert.ok(html.includes('Nguyễn Thu Vy'));
  assert.ok(/data-act="reply"/.test(html));
  const cid = p.comments[0].id;
  html = gameView(s, { ...ui, replyTo: cid });
  assert.ok(html.includes(`data-form="reply" data-cid="${cid}"`));
  assert.ok(/name="realName"/.test(setupView()));
});

test('tab Game show và Mess: mọi trạng thái đều render, hiện hạng, không rò undefined', () => {
  enableWorld();
  const s = createGame({ name: 'Lâm Vy', tier: 'rising', seed: 6 });
  ensure(s);
  assert.ok(/Chưa có lời mời/.test(gameView(s, { ...ui, tab: 'gameshow' })));
  assert.ok(/Chưa có tin nhắn/.test(gameView(s, { ...ui, tab: 'mess' })));
  inviteGameshow(s);
  let html = gameView(s, { ...ui, tab: 'gameshow' });
  assert.ok(/data-act="gs-accept"/.test(html) && /🔴/.test(html));
  respondInvite(s, true);
  html = gameView(s, { ...ui, tab: 'gameshow' });
  assert.ok(/data-form="gs-answer"/.test(html) && /Câu 1\/10/.test(html));
  const ans = 'Mình nghĩ quan trọng nhất là tôn trọng khán giả, cảm ơn mọi người haha';
  answerGameshow(s, ans);
  html = gameView(s, { ...ui, tab: 'gameshow' });
  assert.ok(/Câu 2\/10/.test(html) && /điểm/.test(html));
  for (let i = 0; i < 9; i++) answerGameshow(s, ans);
  html = gameView(s, { ...ui, tab: 'gameshow' });
  assert.ok(/người theo dõi/.test(html));
  maybeWorldDrama(s, true);
  for (let i = 0; i < 12; i++) advanceClock(s);
  for (const tab of ['feed', 'gameshow', 'mess', 'mine', 'notices']) {
    const h = gameView(s, { ...ui, tab });
    assert.ok(!/undefined|NaN|\[object/.test(h), `tab ${tab} rò giá trị lỗi`);
  }
  assert.ok(/data-act="dm-action"|data-form="dm-reply"/.test(gameView(s, { ...ui, tab: 'mess' })));
  assert.ok(/🏅/.test(gameView(s, ui)));
  assert.ok(/Trích từ game show/.test(gameView(s, ui)));
});
