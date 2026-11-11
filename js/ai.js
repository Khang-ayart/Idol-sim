// Tùy chọn: nhờ Claude viết lại bình luận cho tự nhiên hơn. Mặc định TẮT, game chạy hoàn toàn offline.
// Gọi API trực tiếp từ trình duyệt bằng key của người chơi (chỉ lưu trong sessionStorage).
// Lưu ý: chưa được thử với API thật trong repo này, nên coi là thử nghiệm.
import { personaById } from './personas.js';
import { LEXICON } from './lexicon.js';

export async function refineComments({ apiKey, model = 'claude-haiku-5-5', idol, postText, comments }) {
  if (!apiKey || !comments.length) return {};
  const items = comments.map((c) => {
    const p = personaById(c.pid);
    return { id: c.id, who: p.name, age: p.age, job: p.job, role: p.role, understands: p.knows,
      stance: c.side === 'pos' ? 'ủng hộ' : c.side === 'neg' ? 'phản đối' : 'trung lập',
      replyingTo: c.to || null, draft: c.text };
  });
  const prompt = `Đây là mô phỏng mạng xã hội HƯ CẤU. Idol hư cấu "${idol}" vừa đăng: """${postText}"""
Hãy viết lại mỗi bình luận nháp dưới đây thành giọng người dùng mạng Việt Nam thật: ngắn, tự nhiên, có thể viết tắt/teencode/thiếu dấu nếu hợp tính cách.
Quy tắc: giữ nguyên quan điểm (stance) và ý chính; KHÔNG bịa chi tiết không có trong bài đăng (trừ người "understands: misread/partial" được hiểu sai ở chỗ vốn đã sai trong bản nháp); mỗi người một giọng khác nhau; không giống văn AI.
Các câu đùa/tiếng lóng sau nếu xuất hiện thì hiểu theo nghĩa vui, không phải nghĩa đen, và KHÔNG tự bịa nghĩa cho câu chưa có nghĩa: ${JSON.stringify(LEXICON.map((e) => ({ cau: e.label, nghia: e.meaning })))}
Chỉ trả về JSON thuần: [{"id":"...","text":"..."}].
${JSON.stringify(items)}`;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model, max_tokens: 3000, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  const raw = data.content?.map((b) => b.text || '').join('') || '';
  const arr = JSON.parse(raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1));
  return Object.fromEntries(arr.filter((x) => x.id && typeof x.text === 'string').map((x) => [x.id, x.text.slice(0, 400)]));
}

// Nhận diện bài hát từ câu trích mà người chơi tự gõ. Không chép lại lời; chỉ trả tên bài và nghệ sĩ nếu CHẮC CHẮN.
export async function identifySong({ apiKey, model = 'claude-haiku-5-5', text }) {
  if (!apiKey) return null;
  const prompt = `Người chơi game giả lập tự gõ đoạn sau và có thể đang trích một câu hát: """${text}"""
Nếu bạn CHẮC CHẮN đó là câu hát của một bài cụ thể, trả JSON {"title":"tên bài","artist":"nghệ sĩ/nhóm"}. Nếu không chắc, trả {"title":null}. Tuyệt đối không chép lại lời bài hát. Chỉ trả JSON.`;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model, max_tokens: 200, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  const raw = data.content?.map((b) => b.text || '').join('') || '';
  const obj = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
  return obj.title && obj.artist ? { title: String(obj.title).slice(0, 80), artist: String(obj.artist).slice(0, 60) } : null;
}
