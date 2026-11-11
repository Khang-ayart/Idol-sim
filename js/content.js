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
neg: ['quảng cáo dày quá, fee d toàn bán hàng', 'bài này đọc ra mùi hợp đồng, hơi mất thiện cảm'],
insight: ['quảng cáo thì phải ghi rõ #ad hoặc #sponsored, {idol} có ghi chưa?', 'hợp đồng KOL thì thông tin hợp  tác nên minh bạch, chỗ này cần rõ hơn'],
misread: ['ủa vậy là {idol} bắt fan phải mua hả trời', 'nghe như {idol} nhận tiền nói tốt cho hàng bất kể chất lượng đó'],
},
dating: {
po s: ['yêu đương là quyền riêng tư, vui là được', 'chúc {idol} hạnh phúc, đừng để ai làm phiền'],
neg: ['fan mà nghe tin này hơi hụt hẫng thật', 'đang lên mà lo yêu đương, hơi tiếc'] ,
insight: ['công khai chuyện tình cảm thường ảnh hưởng lượng fan ngắn hạn, quản lý tốt thì qua nhanh', 'hẹn hò công khai hay kéo theo nhiều bài soi, chuẩn bị tinh thần trước'],
mi sread: ['trời ơi vậy là {idol} sắp cưới hả', 'hình như {idol} có người yêu rồi mà giấu fan lâu nay á'],
},
flex: {
pos: ['có điều kiện thì khoe thôi, tiền mình làm ra mà', 'nhìn tr uyền cảm hứng cày cuốc ghê'],
neg: ['khoe hoài, người ta còn đang vất vả nè', 'khoe của thế này dễ mất điểm lắm'],
insight: ['hình ảnh xa hoa hợp vài thương hiệu nhưng lệch thông đ iệp gần gũi, nên cân nhắc', 'flex vừa phải thì tăng nhận diện, quá tay là bị soi ngay'],
misread: ['ủa vậy là tiền từ fan hết hả', 'nghe như {idol} khoe để dìm người khác đó'],
},
 cakhia: {
pos: ['đá xéo gọn ghê, mình khoái cái thẳng tính này', 'nói vậy cũng đúng, nhiều người đáng bị nhắc thật'],
neg: ['đá xéo kiểu này không hay, sao không nói thẳng', 'có ch uyện thì giải quyết riêng, đăng lên làm gì'],
insight: ['đăng bóng gió không nêu tên thường kéo hàng loạt người đoán mò, rủi ro cao hơn nói thẳng', 'câu chữ kiểu này dễ bị cắt khỏi  ngữ cảnh, nghệ sĩ nên cẩn thận'],
misread: ['ủa vậy là đang nói đích danh ai rồi đúng không', 'chắc chắn đang chửi đồng nghiệp cũ, đọc là biết'],
},
apology: {
pos: ['biết nhận lỗ i là điều đáng quý, mình bỏ qua', 'lời xin lỗi nghe thật lòng, thương {idol}'],
neg: ['xin lỗi nhưng chưa thấy nói rõ sai chỗ nào', 'lại xin lỗi, hy vọng lần này không tái phạm'],
 insight: ['xin lỗi tốt cần nêu rõ lỗi và cách sửa, không đổ cho hoàn cảnh', 'lời xin lỗi thường được đánh giá qua việc có hành động theo sau hay không'],
misread: ['xin lỗi cái gì  vậy, có chuyện lớn hả', 'đọc xong chả hiểu {idol} xin lỗi ai luôn'],
},
sad: {
pos: ['thương quá, mong {idol} sớm ổn lại', 'ôm {idol} một cái, nghỉ ngơi đi nha'],
neg: ['than thở h oài, ai mà không mệt', 'đăng buồn để câu tương tác hả'],
insight: ['làm nghề giải trí áp lực rất lớn, chia sẻ vậy cũng dễ hiểu', 'chia sẻ cảm xúc kéo gần fan, miễn đừng lạm dụng'], 
misread: ['hình như {idol} sắp giải nghệ rồi đúng không', 'nghe như {idol} đang trách ekip á'],
},
release: {
pos: ['hóng quá, mong ngày ra mắt rồi', 'nghe chất lượng á, ủng hộ hế t mình'],
neg: ['lại ra sản phẩm mới, hy vọng không dậm chân tại chỗ', 'teaser chưa thuyết phục lắm, chờ bản đầy đủ'],
insight: ['thời điểm ra mắt quan trọng, nên né ngày trùng sản  phẩm lớn khác', 'sản phẩm mới cần chiến dịch truyền thông đều tay, không chỉ một bài đăng'],
misread: ['ủa là ra luôn hả, mà bao giờ có vé vậy', 'nghe như {idol} đổi công ty rồi'] ,
},
charity: {
pos: ['việc tử tế, mình ủng hộ hết mình', 'làm từ thiện thật sự thì đáng quý lắm'],
neg: ['từ thiện mà đăng lên làm gì, làm âm thầm đi', 'hy vọng minh bạch số tiền,  đừng để mang tiếng'],
insight: ['từ thiện cần minh bạch số tiền và đơn vị tiếp nhận, nên công khai chứng từ', 'thiện nguyện công khai không sai, nhưng cách đưa tin cần tế nhị với  người nhận'],
misread: ['ủa vậy là {idol} kêu gọi fan góp tiền hả', 'nghe như {idol} đang quyên góp cho cá nhân'],
},
coworker: {
pos: ['làm nghề phải tôn trọng đồng nghiệp, bài nà y lịch sự', 'nhắc đồng nghiệp tử tế vậy là ok'],
neg: ['đụng tới đồng nghiệp rồi, sắp có chuyện', 'nhắc tên người trong nghề mà không xin phép, hơi kỳ'],
insight: ['nhắc đồng nghiệ p công khai thường kéo phản hồi từ phía bên kia, nên cân nhắc trước khi đăng', 'trong nghề kỵ nhất là làm căng công khai, thường giải quyết riêng trước'],
misread: ['ủa vậy là cạch  mặt đồng nghiệp luôn hả', 'nghe như {idol} bị ép làm việc với ekip đó'],
},
};
// ROLE_LINES[role][bucket]; bucket = pos | neu | neg
export const ROLE_LINES = {
fan: {
pos: ['{idol} đăng gì mình cũng thích huhu', 'đúng gu mình luôn á, cày bài này tới sáng', ' hôm nay tự hào về idol ghê, ai nói gì kệ họ', 'like trước đọc sau, thương {idol} nhiều'],
neu: ['idol đăng bài rồi, vô điểm danh nè', 'chưa hiểu lắm nhưng ủng hộ cứ đúng', 'đợi ido l giải thích thêm nha'],
neg: ['hơi buồn xíu nhưng mình vẫn đứng về phía {idol}', 'ơ sao lại thế... mình hơi hụt hẫng đó', 'fan cứng mà bài này mình hong đồng ý lắm, mong idol nghĩ  lại'],
},
neutral: {
pos: ['cũng ok, để xem sau này thế nào', 'bài này thấy ổn, chưa có gì để chê'],
neu: ['chờ xem tình hình rồi mới nói', 'chưa đủ thông tin để đánh giá, hóng th êm'],
neg: ['hơi lấn cấn nhưng chưa dám kết luận', 'câu  "{quote} " nghe hơi lạ, chờ giải thích'],
},
elder: {
pos: ['cô thấy cháu nó nói cũng có lý, người trẻ bây giờ ghê thật', 'đọc thấy hiền, cô thích'],
neu: ['không biết nó nói gì, ai giải th ích giùm với', 'mấy đứa trẻ giờ đăng gì cũng lên báo'],
neg: ['thời buổi bây giờ đăng cái gì cũng được hả, ngày xưa đâu có vậy', 'cô thấy bài này không ổn, làm gương cho các cháu n hỏ chứ'],
},
hong: {
pos: ['bài này được nè, ngồi hóng tiếp', 'ok thấy hợp lý, mà dân mạng chắc sắp cãi rồi'],
neu: ['có drama chưa mọi người ơi 🍿', 'hóng phần sau, chắc còn nhiều  chuyện'],
neg: ['chưa gì đã thấy mùi drama rồi nha', 'câu  "{quote} " kiểu này là sắp có chuyện'],
},
cakhia: {
pos: ['bài này hay, tui không cà khịa nổi luôn', 'hiếm khi tui thấy {idol} đăng bài ổn áp vậy'],
neu: ['đọc xong tui vẫn chưa biết nên c ười hay nên khóc', 'chờ ai đó vô cãi cho vui nhà vui cửa'],
neg: [' "{quote} " mà nói được thì mình cũng nói được, ai
