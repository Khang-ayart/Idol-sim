// Nội dung mẫu cho engine offline: regex phân tích bài đăng + mẫu câu theo vai và chủ đề.
// Toàn bộ tài khoản, page, báo trong game đều là HƯ CẤU.

export const SLOTS = [
  { name: 'Sáng', hour: 7, min: 30, mult: 0.7, icon: '🌅' },
  { name: 'Trưa', hour: 12, min: 0, mult: 0.9, icon: '☀️' },
  { name: 'Tối (giờ vàng)', hour: 20, min: 0, mult: 1.2, icon: '🌆' },
  { name: 'Khuya', hour: 23, min: 30, mult: 0.6, icon: '🌙' },
];

export const WAVES = [
  { n: 1, name: 'Tin tức bắt đầu lan' },
  { n: 2, name: 'Chia sẻ và bình luận' },
  { n: 3, name: 'Tranh luận nổ ra' },
  { n: 4, name: 'Báo chí và chuyên gia vào cuộc' },
  { n: 5, name: 'Chuyện mới phát sinh' },
];

// Regex chạy trên văn bản đã bỏ dấu + chữ thường.
export const TAG_PATTERNS = {
  ad: /#ad\b|hop tac voi|tai tro|mua ngay|giam gia|ma giam|link o bio|nhan hang|quang cao cho|\bsale\b/,
  dating: /nguoi yeu|hen ho|ban trai|ban gai|crush|yeu nhau|co doi|dam cuoi|chia tay/,
  flex: /sieu xe|biet thu|hang hieu|du thuyen|mua nha|tien ty|\bgiau\b|check-?in|resort|first class|hang gia/,
  cakhia: /ai do|mot so nguoi|co nhung nguoi|dung co ma|thoi buoc|ke xau|nguoi ta noi|danh gia thap/,
  apology: /xin loi|nhan loi|sai lam|rut kinh nghiem|hoi han|co loi voi/,
  sad: /met moi|buon|tram cam|ap luc|khoc|kho khan|tuyet vong|co don|ton thuong|that vong/,
  release: /\bmv\b|album|single|phim|ra mat|teaser|concert|live show|bai hat moi|tap moi|sang tac|buoi dien/,
  charity: /tu thien|quyen gop|thien nguyen|lu lut|tre em kho khan|ung ho (quy|dong bao|ba con|nguoi ngheo|vung)/,
  food: /an uong|quan an|nau an|do an|an gi|bun bo|\bpho\b|tra sua|ca phe/,
  coworker: /dong nghiep|dan anh|dan chi|ekip|quan ly cu|cong ty cu|hang cu|ban dien|doi tac|dao dien|nghe si khac/,
};

// "Lời tuyên bố" của người chơi, dùng để bị đào lại về sau khi hành động trái ngược.
export const CLAIM_PATTERNS = {
  noAd: /khong\s+(bao gio\s+|he\s+)?(nhan\s+|chay\s+|lam\s+)?(quang cao|tai tro)|noi khong voi quang cao/,
  single: /doc than|chua yeu ai|khong yeu ai|khong hen ho/,
  humble: /gian di|khiem ton|song don gian|khong can xa hoa|khong thich khoe/,
};
export const CONTRADICTIONS = { ad: 'noAd', dating: 'single', flex: 'humble' };
export const CLAIM_LABELS = { noAd: 'không nhận quảng cáo', single: 'độc thân', humble: 'sống giản dị' };

export const TAG_LABELS = {
  ad: 'quảng cáo', dating: 'chuyện tình cảm', flex: 'khoe của', cakhia: 'đá xéo',
  apology: 'xin lỗi', sad: 'tâm sự buồn', release: 'sản phẩm mới', charity: 'từ thiện',
  food: 'ăn uống', coworker: 'đồng nghiệp', daily: 'đời thường', joke: 'câu đùa', music: 'âm nhạc',
};

// Mỗi vai có "gu" riêng với từng chủ đề (-1..1). Persona có thể ghi đè trong `values`.
export const ROLE_VALUES = {
  fan: { release: 1, charity: 0.6, sad: 0.8, dating: -0.5, apology: 0.6, daily: 0.5, food: 0.5, ad: -0.1, cakhia: 0.1 },
  neutral: {},
  elder: { charity: 0.8, dating: -0.3, flex: -0.6, cakhia: -0.6, apology: 0.4, sad: 0.3 },
  hong: { cakhia: 0.4, dating: 0.3, coworker: 0.3 },
  cakhia: { cakhia: 0.5, flex: -0.4, ad: -0.4, sad: -0.3 },
  hater: { ad: -1, flex: -1, dating: -0.6, cakhia: -0.8, apology: -0.3, release: -0.5, daily: -0.4, sad: -0.6, charity: -0.4 },
  critic: { ad: -0.4, flex: -0.4, cakhia: -0.5, apology: 0.3, charity: 0.3 },
  soi: { ad: -0.5, flex: -0.5, cakhia: -0.3, dating: -0.2 },
  insider: { release: 0.5, apology: 0.3, cakhia: -0.4 },
  law: { ad: -0.3, cakhia: -0.4 },
  page: {},
};
Object.assign(ROLE_VALUES.fan, { joke: 0.4, music: 0.5 });
Object.assign(ROLE_VALUES.cakhia, { joke: 0.6, music: 0.2 });
Object.assign(ROLE_VALUES.hong, { joke: 0.3 });
Object.assign(ROLE_VALUES.elder, { joke: -0.1 });


export const TAG_LINES = {
  ad: {
    pos: ['hợp tác thì ok, miễn sản phẩm tử tế là được', 'làm quảng cáo cũng là nghề, {idol} làm có tâm là mình ủng hộ'],
    neg: ['quảng cáo dày quá, feed toàn bán hàng', 'bài này đọc ra mùi hợp đồng, hơi mất thiện cảm'],
    insight: ['quảng cáo thì phải ghi rõ #ad hoặc #sponsored, {idol} có ghi chưa?', 'hợp đồng KOL thì thông tin hợp tác nên minh bạch, chỗ này cần rõ hơn'],
    misread: ['ủa vậy là {idol} bắt fan phải mua hả trời', 'nghe như {idol} nhận tiền nói tốt cho hàng bất kể chất lượng đó'],
  },
  dating: {
    pos: ['yêu đương là quyền riêng tư, vui là được', 'chúc {idol} hạnh phúc, đừng để ai làm phiền'],
    neg: ['fan mà nghe tin này hơi hụt hẫng thật', 'đang lên mà lo yêu đương, hơi tiếc'],
    insight: ['công khai chuyện tình cảm thường ảnh hưởng lượng fan ngắn hạn, quản lý tốt thì qua nhanh', 'hẹn hò công khai hay kéo theo nhiều bài soi, chuẩn bị tinh thần trước'],
    misread: ['trời ơi vậy là {idol} sắp cưới hả', 'hình như {idol} có người yêu rồi mà giấu fan lâu nay á'],
  },
  flex: {
    pos: ['có điều kiện thì khoe thôi, tiền mình làm ra mà', 'nhìn truyền cảm hứng cày cuốc ghê'],
    neg: ['khoe hoài, người ta còn đang vất vả nè', 'khoe của thế này dễ mất điểm lắm'],
    insight: ['hình ảnh xa hoa hợp vài thương hiệu nhưng lệch thông điệp gần gũi, nên cân nhắc', 'flex vừa phải thì tăng nhận diện, quá tay là bị soi ngay'],
    misread: ['ủa vậy là tiền từ fan hết hả', 'nghe như {idol} khoe để dìm người khác đó'],
  },
  cakhia: {
    pos: ['đá xéo gọn ghê, mình khoái cái thẳng tính này', 'nói vậy cũng đúng, nhiều người đáng bị nhắc thật'],
    neg: ['đá xéo kiểu này không hay, sao không nói thẳng', 'có chuyện thì giải quyết riêng, đăng lên làm gì'],
    insight: ['đăng bóng gió không nêu tên thường kéo hàng loạt người đoán mò, rủi ro cao hơn nói thẳng', 'câu chữ kiểu này dễ bị cắt khỏi ngữ cảnh, nghệ sĩ nên cẩn thận'],
    misread: ['ủa vậy là đang nói đích danh ai rồi đúng không', 'chắc chắn đang chửi đồng nghiệp cũ, đọc là biết'],
  },
  apology: {
    pos: ['biết nhận lỗi là điều đáng quý, mình bỏ qua', 'lời xin lỗi nghe thật lòng, thương {idol}'],
    neg: ['xin lỗi nhưng chưa thấy nói rõ sai chỗ nào', 'lại xin lỗi, hy vọng lần này không tái phạm'],
    insight: ['xin lỗi tốt cần nêu rõ lỗi và cách sửa, không đổ cho hoàn cảnh', 'lời xin lỗi thường được đánh giá qua việc có hành động theo sau hay không'],
    misread: ['xin lỗi cái gì vậy, có chuyện lớn hả', 'đọc xong chả hiểu {idol} xin lỗi ai luôn'],
  },
  sad: {
    pos: ['thương quá, mong {idol} sớm ổn lại', 'ôm {idol} một cái, nghỉ ngơi đi nha'],
    neg: ['than thở hoài, ai mà không mệt', 'đăng buồn để câu tương tác hả'],
    insight: ['làm nghề giải trí áp lực rất lớn, chia sẻ vậy cũng dễ hiểu', 'chia sẻ cảm xúc kéo gần fan, miễn đừng lạm dụng'],
    misread: ['hình như {idol} sắp giải nghệ rồi đúng không', 'nghe như {idol} đang trách ekip á'],
  },
  release: {
    pos: ['hóng quá, mong ngày ra mắt rồi', 'nghe chất lượng á, ủng hộ hết mình'],
    neg: ['lại ra sản phẩm mới, hy vọng không dậm chân tại chỗ', 'teaser chưa thuyết phục lắm, chờ bản đầy đủ'],
    insight: ['thời điểm ra mắt quan trọng, nên né ngày trùng sản phẩm lớn khác', 'sản phẩm mới cần chiến dịch truyền thông đều tay, không chỉ một bài đăng'],
    misread: ['ủa là ra luôn hả, mà bao giờ có vé vậy', 'nghe như {idol} đổi công ty rồi'],
  },
  charity: {
    pos: ['việc tử tế, mình ủng hộ hết mình', 'làm từ thiện thật sự thì đáng quý lắm'],
    neg: ['từ thiện mà đăng lên làm gì, làm âm thầm đi', 'hy vọng minh bạch số tiền, đừng để mang tiếng'],
    insight: ['từ thiện cần minh bạch số tiền và đơn vị tiếp nhận, nên công khai chứng từ', 'thiện nguyện công khai không sai, nhưng cách đưa tin cần tế nhị với người nhận'],
    misread: ['ủa vậy là {idol} kêu gọi fan góp tiền hả', 'nghe như {idol} đang quyên góp cho cá nhân'],
  },
  coworker: {
    pos: ['làm nghề phải tôn trọng đồng nghiệp, bài này lịch sự', 'nhắc đồng nghiệp tử tế vậy là ok'],
    neg: ['đụng tới đồng nghiệp rồi, sắp có chuyện', 'nhắc tên người trong nghề mà không xin phép, hơi kỳ'],
    insight: ['nhắc đồng nghiệp công khai thường kéo phản hồi từ phía bên kia, nên cân nhắc trước khi đăng', 'trong nghề kỵ nhất là làm căng công khai, thường giải quyết riêng trước'],
    misread: ['ủa vậy là cạch mặt đồng nghiệp luôn hả', 'nghe như {idol} bị ép làm việc với ekip đó'],
  },
};

// ROLE_LINES[role][bucket]; bucket = pos | neu | neg
export const ROLE_LINES = {
  fan: {
    pos: ['{idol} đăng gì mình cũng thích huhu', 'đúng gu mình luôn á, cày bài này tới sáng', 'hôm nay tự hào về idol ghê, ai nói gì kệ họ', 'like trước đọc sau, thương {idol} nhiều'],
    neu: ['idol đăng bài rồi, vô điểm danh nè', 'chưa hiểu lắm nhưng ủng hộ cứ đúng', 'đợi idol giải thích thêm nha'],
    neg: ['hơi buồn xíu nhưng mình vẫn đứng về phía {idol}', 'ơ sao lại thế... mình hơi hụt hẫng đó', 'fan cứng mà bài này mình hong đồng ý lắm, mong idol nghĩ lại'],
  },
  neutral: {
    pos: ['cũng ok, để xem sau này thế nào', 'bài này thấy ổn, chưa có gì để chê'],
    neu: ['chờ xem tình hình rồi mới nói', 'chưa đủ thông tin để đánh giá, hóng thêm'],
    neg: ['hơi lấn cấn nhưng chưa dám kết luận', 'câu "{quote}" nghe hơi lạ, chờ giải thích'],
  },
  elder: {
    pos: ['cô thấy cháu nó nói cũng có lý, người trẻ bây giờ ghê thật', 'đọc thấy hiền, cô thích'],
    neu: ['không biết nó nói gì, ai giải thích giùm với', 'mấy đứa trẻ giờ đăng gì cũng lên báo'],
    neg: ['thời buổi bây giờ đăng cái gì cũng được hả, ngày xưa đâu có vậy', 'cô thấy bài này không ổn, làm gương cho các cháu nhỏ chứ'],
  },
  hong: {
    pos: ['bài này được nè, ngồi hóng tiếp', 'ok thấy hợp lý, mà dân mạng chắc sắp cãi rồi'],
    neu: ['có drama chưa mọi người ơi 🍿', 'hóng phần sau, chắc còn nhiều chuyện'],
    neg: ['chưa gì đã thấy mùi drama rồi nha', 'câu "{quote}" kiểu này là sắp có chuyện'],
  },
  cakhia: {
    pos: ['bài này hay, tui không cà khịa nổi luôn', 'hiếm khi tui thấy {idol} đăng bài ổn áp vậy'],
    neu: ['đọc xong tui vẫn chưa biết nên cười hay nên khóc', 'chờ ai đó vô cãi cho vui nhà vui cửa'],
    neg: ['"{quote}" mà nói được thì mình cũng nói được, ai chả vậy', 'dạo này mạng xã hội nhiều người đăng bài như chấm thi nhỉ', 'đọc mà thấy hơi diễn, hay tại tui khó tính'],
  },
  hater: {
    pos: ['hiếm khi thấy bài này không phản cảm', 'hôm nay ổn đó, mai mốt đừng lộ bản chất'],
    neu: ['lại đăng, ai quan tâm', 'bài vô thưởng vô phạt, spam feed'],
    neg: ['nhìn là thấy diễn rồi, ai tin', 'bài này đọc mà mệt, cố tình câu tương tác', 'lại bày trò, fan mù quáng thôi chứ ai khen nổi'],
  },
  critic: {
    pos: ['bài này có lập luận ổn, mình ghi nhận', 'lần này {idol} làm đúng hướng, hy vọng giữ được'],
    neu: ['chưa đủ dữ kiện để kết luận, mình đọc kỹ thêm', 'cần xem phản hồi từ các bên rồi mới đánh giá được'],
    neg: ['câu "{quote}" thiếu dẫn chứng cụ thể, khó thuyết phục', 'mình không ghét {idol}, nhưng lần này cách làm chưa ổn'],
  },
  soi: {
    pos: ['bài này sạch, mình soi mà không thấy gì để bắt lỗi', 'hiếm có, {idol} nhất quán với bài trước'],
    neu: ['mình lưu lại bài này, để đối chiếu với các bài khác', 'đã cap màn hình, theo dõi tiếp'],
    neg: ['mình lưu lại câu "{quote}" rồi nha', 'bài này có chi tiết lạ, để mình đối chiếu với các bài trước'],
  },
  insider: {
    pos: ['nhìn từ bên trong thì bài này xử lý tốt', 'làm nghề thấy bài này an toàn và có tính toán'],
    neu: ['bài này cần xem phản hồi 24h đầu rồi mới đánh giá được', 'chưa vội nói, để xem phía ekip xử lý ra sao'],
    neg: ['làm truyền thông thì mình không đăng kiểu này, rủi ro cao', 'câu "{quote}" dễ bị cắt ghép lắm, ekip nên nhắc'],
  },
  law: {
    pos: ['xét về mặt pháp lý thì bài này không có gì đáng ngại', 'nội dung ổn, không chạm vào vùng nhạy cảm nào'],
    neu: ['cần xem hợp đồng cụ thể mới đánh giá được', 'chưa đủ thông tin để nói về mặt pháp lý'],
    neg: ['một vài chi tiết trong bài có thể gây rủi ro pháp lý nếu bị hiểu theo hướng khác', 'nên cẩn thận câu chữ, đặc biệt khi nhắc tới bên thứ ba'],
  },
  page: {
    pos: ['bài đăng nhận nhiều thiện cảm từ cộng đồng', 'cộng đồng phản hồi tích cực với bài mới của {idol}'],
    neu: ['bài đăng mới của {idol} thu hút chú ý', 'phản ứng ban đầu còn trái chiều'],
    neg: ['bài đăng của {idol} đang nhận nhiều ý kiến trái chiều', 'một số ý kiến cho rằng bài đăng cần thêm giải thích'],
  },
};

export const REPLY_LINES = {
  generic: {
    agree: ['đúng đó {to}', '{to} nói chuẩn', '+1 {to}'],
    disagree: ['{to} nói vậy chưa đúng lắm', 'không đồng ý {to} đâu, nghĩ lại coi', '{to} xem lại câu "{quote}" rồi hẵng nói'],
  },
  fan: {
    agree: ['{to} nói đúng quá, thương bạn luôn', 'đúng á {to}, ai hiểu thì hiểu'],
    disagree: ['{to} đừng nói vậy về {idol} nha', 'mình thấy {to} hơi quá rồi đó', '{to} có đọc kỹ bài không vậy'],
  },
  hater: {
    agree: ['{to} tỉnh táo ghê', 'chuẩn, còn ai tin nữa'],
    disagree: ['{to} fan mù quáng à', 'cãi hoài, rảnh dữ', 'thôi {to} ơi tỉnh lại đi'],
  },
  cakhia: {
    agree: ['{to} nói đúng quá, tui vỗ tay', 'chốt: {to} thắng'],
    disagree: ['{to} ơi bình tĩnh, uống miếng nước 🍵', 'ủa {to} bênh ghê, người nhà hả', '{to} cãi hay quá, thi nhây mà'],
  },
  critic: {
    agree: ['mình đồng tình với {to} ở điểm này', '{to} nói đúng, mình bổ sung thêm là cần dẫn chứng'],
    disagree: ['{to} nói thế thiếu dẫn chứng', 'mình hiểu ý {to}, nhưng lập luận hụt ở chỗ này'],
  },
  neutral: {
    agree: ['mình thấy {to} có lý', 'ý {to} cũng hợp lý đó'],
    disagree: ['mình thấy cả hai đều có cái lý, bình tĩnh đã', '{to} với bạn kia bình tĩnh đã'],
  },
  insider: {
    agree: ['{to} nói đúng, thực tế trong nghề cũng vậy', 'đúng đó {to}, bên mình từng gặp tình huống tương tự'],
    disagree: ['bên mình làm nghề thì thấy {to} nói chưa đủ, thực tế phức tạp hơn', '{to} nói đúng một phần, phần còn lại là chuyện hợp đồng'],
  },
  soi: {
    agree: ['{to} tinh mắt ghê, mình cũng thấy vậy'],
    disagree: ['{to} chờ mình đào thêm, có bằng chứng hết', 'để mình cap lại cho {to} coi'],
  },
  hong: {
    agree: ['{to} nói tiếp đi, đang hay 🍿'],
    disagree: ['ủa rồi ai đúng ai sai vậy {to}', '{to} bình tĩnh, mình chỉ hóng thôi mà'],
  },
  elder: {
    agree: ['{to} nói phải đó con', 'ừ đúng, cô cũng nghĩ vậy'],
    disagree: ['{to} ơi nói chuyện cho đàng hoàng', 'người trẻ nói chuyện gì mà nóng thế'],
  },
};

export const ENDERS = {
  hater: ['thôi tôi out, mệt', 'nói chuyện với fan não cá vàng, bye'],
  neutral: ['thôi mình xin rút, mỗi người một ý', 'cả nhà bình tĩnh nhé'],
  cakhia: ['rồi rồi hòa cả làng 🤝', 'tui đi ngủ, mai kể tiếp'],
  fan: ['thôi mình dừng ở đây, chúc {idol} vui', 'thương {idol} nhiều, ai nói gì kệ'],
  generic: ['thôi mình dừng ở đây nha', 'ok mỗi người một quan điểm'],
};
export const NIGHT_ENDERS = ['khuya rồi ngủ đi cả nhà 😴', 'tranh luận giờ này làm gì, đi ngủ đi'];

export const FEED_POSTS = {
  newsHot: [
    '🔥 NÓNG: {idol} vừa đăng "{quote}" và dân mạng chia thành hai phe!',
    'Bài đăng mới của {idol} đang gây bão: "{quote}". Bạn đứng về phe nào?',
  ],
  newsCalm: [
    '{idol} chia sẻ: "{quote}". Phản ứng ban đầu của cộng đồng khá đa chiều.',
    'Tổng hợp ý kiến xoay quanh bài đăng mới của {idol}: có người ủng hộ, có người thận trọng.',
  ],
  dig: [
    'ĐÀO LẠI: {days} {idol} từng viết "{oldQuote}". Hôm nay lại đăng "{quote}". Ai thấy lệch không? 🤔',
    'Lưu lại cho ai cần: bài cũ "{oldQuote}" và bài mới "{quote}" của {idol}. Mọi người tự đánh giá nhé.',
  ],
  digNews: [
    '{idol} bị chỉ ra mâu thuẫn giữa phát ngôn cũ ("{oldQuote}") và bài đăng mới ("{quote}"). Chưa có phản hồi chính thức.',
    'Cộng đồng mạng bàn tán về mâu thuẫn trong phát ngôn của {idol}. Bài cũ: "{oldQuote}".',
  ],
  ask: [
    'Mọi người ơi {idol} đang có chuyện gì vậy? Mình lướt feed thấy nhiều người nhắc tới bài "{quote}" 🍿',
    'Ai tóm tắt giùm drama của {idol} với, mình mới vô thấy cmt cãi nhau tùm lum',
  ],
  guess: [
    'Câu "{quote}" của {idol} theo mọi người đang ám chỉ ai? Cmt đoán đi 🍿',
    'Bài của {idol} đọc xong thấy như đang nói xa nói gần ai đó. Ai đoán được không?',
  ],
  defend: [
    'Mong mọi người đọc kỹ bài của {idol} rồi hẵng nhận xét. Đừng cắt câu "{quote}" ra khỏi ngữ cảnh.',
    'Mình là fan nhưng mình nói công tâm: bài "{quote}" của {idol} không đáng bị công kích như vậy.',
  ],
  rant: [
    '{idol} lại bày trò, bài "{quote}" đọc mà mệt.',
    'Mỗi lần {idol} đăng bài là một lần mạng xã hội ồn ào. Chán.',
  ],
  analysis: [
    'Góc nhìn từ người làm nghề về bài đăng của {idol} ("{quote}"): {insight}',
    'Nhìn bài "{quote}" của {idol} dưới góc độ truyền thông: {insight}',
  ],
  wnews: [
    '🔥 {summary}. Dân mạng chia hai phe, chưa có kết luận.',
    'Tin giải trí: {summary}. Thông tin chưa được kiểm chứng.',
  ],
  wask: [
    'Ai tóm tắt giùm vụ của {idol} với? Mình mới vô thấy cmt cãi nhau tùm lum 🍿',
    'Vụ {idol} dạo này sao rồi mọi người? Mình lỡ nhịp drama rồi',
  ],
  wdefend: [
    'Mong mọi người bình tĩnh chờ thông tin chính thức về vụ của {idol}, đừng vội kết luận.',
    'Mình là fan {idol} nhưng mình nói công tâm: chuyện chưa rõ thì đừng ném đá.',
  ],
  wrant: [
    'Lại thêm một vụ của {idol}, showbiz chán thật.',
    'Chuyện của {idol} đọc mà mệt, ai đúng ai sai cũng thấy phiền.',
  ],
  wtakeSide: [
    '{user} vừa đứng về phía {idol} trong vụ ồn ào, fan bên còn lại có vẻ không vui 🍿',
    '{user} lên tiếng ủng hộ {idol} giữa lúc mạng đang chia phe. Người khen thẳng thắn, người chê đu theo.',
  ],
  wtakeSilent: [
    '{user} chọn im lặng trong vụ ồn ào này. Người khen khôn khéo, người chê né tránh.',
    'Giữa lúc hai phe cãi nhau, {user} không bình luận gì. Cộng đồng đang đoán lý do.',
  ],
  meme: [
    'Trend hôm nay: copy câu "{quote}" của {idol} rồi tự thêm vế sau 🤣',
    'Sáng ra đã có bài mới của {idol} để cả nhà hóng, câu "{quote}" sắp lên meme rồi 🍿',
  ],
};

export const NOTICES = {
  dig: '👀 Có tài khoản đang lục lại bài cũ của bạn. Có thể sẽ có người nhắc lại những gì bạn từng nói. Hãy xem lại "Dòng thời gian của tôi".',
  guess: '👀 Dân mạng đang đoán bạn ám chỉ ai trong bài mới. Chuyện có thể lớn hơn nếu im lặng.',
};

// Ảnh người chơi mô tả trong dấu *...*; chỉ nhắc lại đúng mô tả, không bịa thêm chi tiết.
export const PHOTO_LINES = {
  pos: ['ảnh {photo} đẹp quá trời', 'nhìn ảnh {photo} mà mê luôn', 'ảnh {photo} có hồn ghê'],
  neu: ['ảnh {photo} xem được đó', 'ảnh {photo} bình thường thôi, chưa có gì nổi bật'],
  neg: ['ảnh {photo} nhìn gượng gạo thế nào ấy', 'đăng ảnh {photo} làm gì vậy ta', 'ảnh {photo} chưa đủ thuyết phục mình'],
};

// Phản ứng khi chính idol trả lời bình luận.
export const IDOL_REPLY = {
  generic: {
    pos: ['cảm ơn {idol} đã trả lời, mình vui lắm', 'được {idol} rep luôn, ngại ghê'],
    neu: ['ok mình hiểu rồi, cảm ơn đã trả lời', 'rep vậy thì mình biết rồi nha'],
    neg: ['trả lời vậy mà nghe được hả', 'mình hỏi nghiêm túc mà bị trả lời kiểu đó'],
  },
  fan: {
    pos: ['TRỜI {idol} REP MÌNH 😭😭 mai mình khoe cả nhà', 'huhu được idol rep rồi, sống thêm 10 năm'],
    neu: ['cảm ơn idol đã rep, mình vẫn ủng hộ nha'],
    neg: ['idol rep vậy mình hơi buồn á... nhưng vẫn thương', 'ủa idol ơi sao nói mình vậy 🥲'],
  },
  hater: {
    pos: ['rep khéo đó, tạm bỏ qua', 'ừ thì cũng biết nói chuyện'],
    neu: ['rep cho có, mai mốt lại thế', 'chờ xem làm được không'],
    neg: ['thấy chưa, bản chất lộ rồi', 'rep kiểu này thì ai ưa nổi', 'đúng kiểu rep cho có chuyện'],
  },
  cakhia: {
    pos: ['idol rep duyên ghê, tui rút lại lời cà khịa 🍵'],
    neu: ['rep rồi nha, drama tới đây là hết phần tui'],
    neg: ['ôi dồi idol rep gắt, để tui cap lại 🍿'],
  },
  critic: {
    pos: ['câu trả lời này thuyết phục hơn bài đăng, mình ghi nhận'],
    neu: ['cảm ơn đã phản hồi, mình sẽ theo dõi việc làm thực tế'],
    neg: ['trả lời né tránh câu hỏi chính, mình vẫn chưa thấy câu trả lời'],
  },
  soi: {
    pos: ['ok mình lưu câu trả lời này lại, hy vọng sau này nhất quán'],
    neu: ['đã cap lại câu trả lời, theo dõi tiếp'],
    neg: ['câu trả lời này mình lưu rồi nha, để đối chiếu sau'],
  },
  elder: {
    pos: ['cô thấy cháu trả lời lễ phép, cô quý'],
    neu: ['ừ cô đọc rồi, cảm ơn cháu'],
    neg: ['cháu trả lời người lớn vậy hả, hồi xưa đâu có thế'],
  },
};

export const BYSTANDER = {
  pos: { fan: ['idol rep kìa mọi người ơi 😭', 'ghen tị quá, được idol rep luôn'], hong: ['ơ idol rep kìa 🍿', 'xem idol rep có duyên không nè'] },
  neu: { hong: ['idol rep rồi, mà thế là xong hay còn tiếp', 'hóng xem bạn kia rep lại không 🍿'] },
  neg: { cakhia: ['rep gắt thế, toang thật rồi 🍿', 'idol rep kiểu này là có chuyện cho coi'], hong: ['ơ idol rep gắt vậy 😳'] },
};
