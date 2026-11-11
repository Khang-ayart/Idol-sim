// Dữ liệu ngôn ngữ và thế giới: tiếng lóng/joke, bài hát (chỉ tên bài + nghệ sĩ, KHÔNG lưu lời bài hát),
// nghệ sĩ hư cấu, câu hỏi game show, mẫu tin nhắn, kịch bản drama.
// Muốn game "hiểu" thêm một câu đùa: thêm một dòng vào LEXICON (re chạy trên văn bản đã bỏ dấu, chữ thường).

export const LEXICON = [
  { id: 'u-la-troi', re: /\bu la troi\b/, label: 'u là trời', kind: 'slang', meaning: 'cảm thán khi ngạc nhiên hoặc bất lực' },
  { id: 'et-o-et', re: /\bet o et\b/, label: 'ét o ét', kind: 'slang', meaning: 'SOS, kêu cứu (nói vui)' },
  { id: 'xiu-ngang', re: /\bxiu (ngang|up xiu down)\b/, label: 'xỉu ngang', kind: 'slang', meaning: 'buồn cười hoặc choáng đến mức "xỉu" (nói vui)' },
  { id: 'check-var', re: /\bcheck var\b/, label: 'check var', kind: 'slang', meaning: 'kiểm tra lại cho chắc' },
  { id: 'xin-via', re: /\bxin via\b/, label: 'xin vía', kind: 'slang', meaning: 'xin chút may mắn' },
  { id: 'flop', re: /\bflop\b/, label: 'flop', kind: 'slang', meaning: 'thất bại, không được đón nhận' },
  { id: 'gay-bao', re: /\bgay bao\b/, label: 'gây bão', kind: 'slang', meaning: 'tạo được tiếng vang rất lớn' },
  // Hai câu đùa do người thiết kế đưa ra. Chưa ghi nghĩa vì chưa được xác nhận: game vẫn hiểu đây là JOKE
  // (không phải nghĩa đen, không phải đá xéo), nhưng sẽ không bịa nghĩa. Điền `meaning` để người chơi khác biết giải thích.
  { id: 'mon-leo', re: /\bmon leo\b/, label: 'mồn lèo', kind: 'joke', meaning: null },
  { id: 'long-xao-dua', re: /\blong xao dua\b/, label: 'lòng xào dưa', kind: 'joke', meaning: null },
];

// ----- Bài hát: chỉ lưu tên bài và nghệ sĩ -----
// ambiguous: tên bài trùng từ thông dụng, chỉ nhận khi có nhắc tên nhóm hoặc đặt trong dấu nháy/♪/#.
const S = (title, artist, ambiguous = false) => {
  const pat = title.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return { title, artist, ambiguous, re: new RegExp(`\\b${pat}\\b`), q: new RegExp(`["“”'‘’♪#]\\s*${pat}\\b`) };
};
export const SONGS = [
  S('Batter Up', 'BABYMONSTER', true), S('Sheesh', 'BABYMONSTER', true), S('Forever', 'BABYMONSTER', true),
  S('Stuck in the Middle', 'BABYMONSTER'), S('Drip', 'BABYMONSTER', true),
  S('How You Like That', 'BLACKPINK'), S('Kill This Love', 'BLACKPINK'), S('Pink Venom', 'BLACKPINK'), S('Shut Down', 'BLACKPINK', true),
  S('Hype Boy', 'NewJeans'), S('Ditto', 'NewJeans', true), S('Super Shy', 'NewJeans'), S('Attention', 'NewJeans', true),
  S('Dynamite', 'BTS', true), S('Butter', 'BTS', true), S('Spring Day', 'BTS', true),
  S('Fancy', 'TWICE', true), S('Cheer Up', 'TWICE', true),
  S('Supernova', 'aespa', true), S('Next Level', 'aespa', true),
  S('Love Dive', 'IVE'), S('After Like', 'IVE', true), S('Eleven', 'IVE', true),
  S('Antifragile', 'LE SSERAFIM'), S('Perfect Night', 'LE SSERAFIM', true),
];

const G = (name, plainRe, rawRe) => ({ name, re: plainRe, raw: rawRe });
export const GROUPS = [
  G('BABYMONSTER', /\bbaby\s?monster\b/), G('BLACKPINK', /\bblack\s?pink\b/), G('NewJeans', /\bnew\s?jeans\b/), G('BTS', /\bbts\b/),
  G('TWICE', /(?!)/, /\bTWICE\b/), G('aespa', /\baespa\b/), G('IVE', /(?!)/, /\bIVE\b/), G('LE SSERAFIM', /\ble\s?sserafim\b/),
  G('Stray Kids', /\bstray\s?kids\b/), G('SEVENTEEN', /(?!)/, /\bSEVENTEEN\b/), G('ITZY', /\bitzy\b/),
];

// ----- Mẫu câu hiểu/không hiểu joke, bài hát -----
export const JOKE_LINES = {
  get: ['haha "{joke}" của {idol} làm mình xỉu ngang 🤣', 'câu "{joke}" đi vào lòng người luôn', 'ai hiểu thì hiểu, "{joke}" hết nước chấm', 'đang buồn mà đọc "{joke}" cười muốn xỉu'],
  dontget: ['"{joke}" là gì vậy mấy đứa, đọc không hiểu', 'các cháu ai giải thích giùm "{joke}" với', 'tiếng Việt mà sao đọc không hiểu gì hết, "{joke}" hả'],
  explain: ['{to} ơi "{joke}" là nói vui thôi, nghĩa là {meaning} đó', '"{joke}" hả, {meaning} á {to}'],
  explainNoMeaning: ['{to} ơi đây là câu đùa của mạng thôi, đừng hiểu nghĩa đen', '{to} ơi nói vui đó, đừng bắt bẻ từng chữ'],
};
export const SONG_LINES = {
  know: ['đúng bài {song} của {artist} rồi, nhận ra liền!', '{song} của {artist} luôn hả, gu đỉnh quá', 'nhắc tới {song} là mình lên đồ liền'],
  ask: ['bài {song} này của nhóm nào vậy mọi người', '{song} là bài của {artist} đúng không, nghe quen quen', 'lại {song} của {artist}, nghe nhiều muốn mòn tai'],
  group: ['{artist} hả, fan {artist} đâu rồi điểm danh', 'nhắc {artist} là mình ngồi dậy liền'],
  lyricFan: ['câu này nghe quen quá mà quên tên bài, ai biết chỉ mình với', 'hình như trích từ bài của nhóm nào đó, mình nhớ giai điệu mà quên tên'],
  lyricAsk: ['câu này trích bài nào vậy {idol}? ai biết tên bài và nhóm nào không', 'đọc câu hát này mà không nhớ bài nào, ai biết giúp mình'],
};

// ----- Nghệ sĩ HƯ CẤU -----
export const ARTISTS = [
  { id: 'halam', name: 'Hạ Lam', job: 'ca sĩ' },
  { id: 'duckhai', name: 'Đức Khải', job: 'diễn viên' },
  { id: 'giaminh', name: 'Gia Minh', job: 'nhạc sĩ' },
  { id: 'bichdao', name: 'Bích Đào', job: 'diễn viên' },
  { id: 'tuanphong', name: 'Tuấn Phong', job: 'ca sĩ' },
  { id: 'hoangnghia', name: 'Chú Hoàng Nghĩa', job: 'nghệ sĩ gạo cội', senior: true },
  { id: 'thanhvan', name: 'Chị Thanh Vân', job: 'MC kỳ cựu', senior: true },
];

// ----- Game show -----
export const SHOW_TITLES = ['Đối Đáp Đêm Muộn', 'Mười Câu Thật Lòng', 'Ghế Nóng Showbiz'];
export const QUESTIONS = [
  { cat: 'private', text: 'Lần gần nhất bạn khóc là khi nào, và vì sao?' },
  { cat: 'private', text: 'Người đầu tiên bạn gọi khi có tin vui là ai?' },
  { cat: 'private', text: 'Bạn đang hẹn hò hay đang độc thân? Cả nước đang chờ câu trả lời này!' },
  { cat: 'private', text: 'Chuyện gì trong đời khiến bạn hối hận nhất?' },
  { cat: 'private', text: 'Thói quen xấu nhất của bạn là gì?' },
  { cat: 'opinion', text: 'Theo bạn, nghệ sĩ có nên nhận quảng cáo thoải mái không?' },
  { cat: 'opinion', text: 'Bạn nghĩ gì về anti-fan?' },
  { cat: 'opinion', text: 'Nếu ngày mai phải giải nghệ, bạn sẽ làm gì?' },
  { cat: 'opinion', text: 'Ai là người ảnh hưởng nhất đến con đường nghệ thuật của bạn?' },
  { cat: 'opinion', text: 'Mạng xã hội giúp ích hay làm hại nghệ sĩ nhiều hơn?' },
  { cat: 'funny', text: 'Nếu bạn là một món ăn, bạn muốn là món gì, vì sao?' },
  { cat: 'funny', text: 'Hãy tự giới thiệu bản thân bằng một câu vè bốn chữ.' },
  { cat: 'funny', text: 'Bạn sẽ nói gì với chính mình năm 15 tuổi?' },
  { cat: 'funny', text: 'Nếu bạn là siêu anh hùng, siêu năng lực vô dụng nhất của bạn là gì?' },
  { cat: 'trap', text: 'Trong giới, bạn thấy đồng nghiệp nào hát dở nhất? Trả lời thật lòng nhé!' },
  { cat: 'trap', text: 'Nếu fan và nhà tài trợ mâu thuẫn, bạn chọn ai? Chỉ được chọn một!' },
  { cat: 'trap', text: 'Cát-xê hay đam mê? Chọn một, không được nói "cả hai"!' },
  { cat: 'trap', text: 'Nghe nói trong giới có người không ưa bạn. Bạn nghĩ đó là ai?' },
];
export const HOST_LINES = {
  pos: ['Hay! Khán giả đang rất thích câu trả lời này.', 'Quá khéo, mình xin cộng điểm!', 'Câu trả lời có duyên đó nhé.'],
  neu: ['Một câu trả lời an toàn. Tiếp tục nào!', 'Cũng được, nhưng mình chờ thêm bất ngờ.'],
  neg: ['Hơi nguy hiểm rồi nha, mình phải trừ điểm.', 'Câu này khán giả không mua rồi.', 'Cẩn thận, điểm đang tụt đó!'],
};
export const AUDIENCE_LINES = {
  pos: ['trả lời hay ghê, vỗ tay 👏', 'câu này ghi điểm nè', 'duyên dữ vậy trời'],
  neu: ['ổn, chưa có gì đặc biệt', 'câu trả lời an toàn quá'],
  neg: ['trả lời vậy là toang rồi', 'câu này mất điểm thiệt', 'ơ sao lại nói vậy'],
};

// ----- Hạng -----
export const RANKS = [
  { name: 'Tân binh vô danh', at: 0 }, { name: 'Gương mặt triển vọng', at: 40 }, { name: 'Ngôi sao đang lên', at: 100 },
  { name: 'Nghệ sĩ được yêu thích', at: 200 }, { name: 'Ngôi sao hạng A', at: 350 }, { name: 'Huyền thoại', at: 600 },
];
export const RANK_START = { newbie: 0, rising: 100, star: 350 };
export const MILESTONES = [1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];

// ----- Tin nhắn (Mess) -----
export const DM = {
  fan: ['{idol} ơi, mình là fan từ lâu, dạo này bài của bạn hay lắm 🥹', 'idol ơi giữ sức khỏe nha, dạo này làm việc nhiều quá', 'cho mình hỏi bao giờ idol có sản phẩm mới vậy?'],
  critic: ['Mình nhắn riêng vì không muốn làm căng trên bảng tin: dạo này bài đăng của bạn dễ gây hiểu lầm, nên cân nhắc câu chữ.', 'Góp ý thẳng: bạn đăng hơi nhiều, người xem bắt đầu thấy ngợp.'],
  hater: ['mình nói thật: dạo này bài của bạn nhạt đi nhiều.', 'nhắn riêng cho bạn biết, nhiều người đang thấy bạn hơi lố.'],
  elder: ['Cô thấy cháu dạo này hay lên mạng, nhớ ăn uống đầy đủ nha cháu.'],
  neutral: ['Chào bạn, mình hay lướt thấy bài của bạn. Chúc bạn nhiều niềm vui!'],
  postFan: ['bài "{quote}" của bạn mình đọc đi đọc lại mấy lần luôn 🥹', 'bài "{quote}" làm mình nhớ ra nhiều chuyện, cảm ơn idol nha'],
  postCritic: ['Về bài "{quote}": mình nghĩ bạn nên cân nhắc thêm câu chữ. Nhắn riêng để bạn tham khảo.', 'Bài "{quote}" có ý hay nhưng cách diễn đạt dễ bị hiểu sai.'],
  postElder: ['Cô đọc bài "{quote}" của cháu rồi, cháu viết cũng có tâm.'],
  collab: ['Dạo này thấy bạn lên nhanh, có muốn hợp tác một bài không?', 'Mình đang làm dự án chung với vài người bạn, bạn có muốn tham gia không?'],
  gossip: ['Bạn xem vụ {A} chưa? Mạng đang ồn dữ lắm.', 'Chuyện của {A} dạo này căng thật. Bạn thấy sao?'],
  checkin: ['Dạo này bạn thế nào? Giữ sức khỏe nhé.', 'Lâu rồi không nói chuyện, thấy bạn đang lên đó, mừng cho bạn.'],
  brand: ['Nhãn hàng Sao Mai (hư cấu) muốn mời bạn làm gương mặt đại diện. Cát-xê hợp lý. Bạn nhận lời không?'],
  managerDig: ['Em ơi, có dấu hiệu có người đang lục lại bài cũ của em. Em nên chuẩn bị lời giải thích hoặc đăng xin lỗi sớm.'],
  managerGuess: ['Dân mạng đang đoán em ám chỉ ai trong bài mới. Im lặng cũng là một cách, nhưng rủi ro.'],
  managerRank: ['Chúc mừng em đã lên hạng "{rank}"! Giữ phong độ nhé.'],
  managerAd: ['Em nhận quảng cáo thì nhớ ghi rõ #ad nhé. Đừng để bị đào lại.'],
  hostInvite: ['Chào bạn, chương trình "{title}" muốn mời bạn tham gia mười câu hỏi. Bạn nhận lời không?'],
  hostThanks: ['Cảm ơn bạn đã tham gia "{title}". Mong sớm gặp lại!'],
  involve: ['Fan hai bên ({A} và {B}) đang kéo sang bài của bạn để hỏi quan điểm vụ này. Bạn tính sao?'],
};
export const SENDER_REPLY = {
  artist: { pos: ['Cảm ơn bạn nhé, mình vui lắm!'], neu: ['Ok mình hiểu rồi.'], neg: ['Hơi buồn vì cách trả lời, nhưng không sao.'] },
  manager: { pos: ['Tốt, em cứ giữ phong độ nhé.'], neu: ['Anh ghi nhận.'], neg: ['Em bình tĩnh lại, đừng để cảm xúc dẫn đường.'] },
  brand: { pos: ['Cảm ơn bạn, bộ phận hợp tác sẽ liên hệ.'], neu: ['Chúng tôi đã ghi nhận.'], neg: ['Rất tiếc, chúc bạn thành công.'] },
};

// ----- Drama thế giới (nghệ sĩ hư cấu, tin chưa kiểm chứng) -----
export const WORLD_SCENARIOS = [
  { id: 'ad', heat: 55, text: '{A} bị tố quảng cáo sản phẩm chưa kiểm chứng mà không ghi rõ #ad, chưa có phản hồi chính thức' },
  { id: 'dating', heat: 60, text: '{A} và {B} bị cho là đang hẹn hò sau khi cùng xuất hiện trong một buổi tối, hai bên chưa xác nhận' },
  { id: 'beef', heat: 70, text: '{A} đăng bài bóng gió một đồng nghiệp, fan của {B} cho rằng bị nhắm tới, hai bên chưa nêu tên' },
  { id: 'charity', heat: 45, text: '{A} công bố quyên góp từ thiện nhưng bị hỏi về việc minh bạch số tiền' },
  { id: 'flop', heat: 40, text: '{A} ra mắt MV mới, lượt xem thấp hơn kỳ vọng và bị so sánh với sản phẩm cũ' },
  { id: 'apology', heat: 35, text: '{A} lên tiếng xin lỗi sau phát ngôn gây tranh cãi trong một buổi phỏng vấn' },
];
