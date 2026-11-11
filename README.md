# 🎤 Idol Sim

Game mô phỏng: bạn là một influencer (ca sĩ, diễn viên, streamer...) bắt đầu từ **ngày đầu tiên**. Mỗi bài đăng trên Facebook giả lập sẽ khiến cả một cộng đồng mạng hư cấu bàn tán: fan, anti-fan, thánh soi, dân hóng drama, người trong nghề, page giải trí... có tranh luận nhiều tầng và **có trí nhớ**.

> Toàn bộ tài khoản, page, bài viết trong game là **nội dung giả lập hư cấu**, không phải người dùng, nghệ sĩ hay cơ quan báo chí thật.

## Chạy thử

```bash
npm run serve        # hoặc: python3 -m http.server 8000
# mở http://localhost:8000
npm test             # chạy test engine và giao diện (Node 20+, không cần cài thêm gì)
```

Không cần build, không cần API key: engine chạy offline hoàn toàn.

## Cách chơi

1. Tạo idol: **nghệ danh** và (tùy chọn) **tên thật**, chọn điểm xuất phát (ngày đầu tiên / đang lên / ngôi sao). Người lớn tuổi và luật sư hay gọi bằng tên thật, số đông gọi bằng nghệ danh, anti-fan thỉnh thoảng gọi tên thật để mỉa.
   **Đăng ảnh:** chỉ cần mô tả trong dấu `*...*`, vd `*ảnh selfie ở biển*`. Game dựng khung ảnh giả lập và có người bình luận đúng theo mô tả đó (mô tả cũng được phân tích chủ đề, vd "check-in resort" tính là khoe của).
2. Viết bài đăng. Phản ứng **đợt 1** hiện ngay; bấm **"Xem đợt tiếp theo"** để xem 5 đợt: tin lan, bình luận, tranh luận nổ ra, báo chí và chuyên gia vào cuộc, chuyện mới phát sinh.
3. Mỗi ngày có 4 khung giờ (sáng, trưa, tối, khuya). Giờ vàng buổi tối đông người xem; khuya ít người nhưng dễ "toang". Bấm **"Sang khung giờ tiếp theo"** để thời gian trôi.
4. **Trả lời bình luận:** bấm "Trả lời" dưới bất kỳ bình luận nào (kể cả bình luận dưới bài của page). Người được trả lời sẽ phản ứng, người xung quanh hóng theo, và họ **nhớ** cách bạn đối xử với họ: lịch sự, xin lỗi thì dễ được thương; gắt gỏng, đá xéo thì toang. Mỗi bình luận trả lời một lần.
5. Xem lại **"Dòng thời gian của tôi"**: những điều bạn từng khẳng định (vd "mình sẽ không bao giờ nhận quảng cáo") sẽ bị nhớ và đào lại nếu sau đó bạn làm điều trái ngược.
6. Drama **luôn báo trước** (tab Thông báo) một khung giờ trước khi nổ, để bạn kịp chuẩn bị. Đăng một bài xin lỗi trong lúc đó sẽ làm drama nhẹ hơn.

Bật **"Xem hậu trường"** để thấy vai, tâm trạng và kiểu hiểu của từng tài khoản (người hiểu đúng, hiểu sai, chỉ phản ứng cảm xúc).

## Hiểu câu đùa và bài hát

- **Câu đùa/tiếng lóng** nằm trong `js/lexicon.js` (`LEXICON`). Game hiểu đó là *đùa*, không phải nghĩa đen hay đá xéo: người trẻ cười theo, người lớn tuổi hỏi "là gì vậy", rồi có người trẻ giải thích. Nếu mục đó **chưa có nghĩa** (như "mồn lèo", "lòng xào dưa" lúc này) thì người giải thích chỉ nói "đây là câu đùa thôi", **không bịa nghĩa**. Điền `meaning` vào là xong; thêm câu mới chỉ cần thêm một dòng.
- **Bài hát K-pop:** nhận theo **tên bài + tên nhóm** (`SONGS`, `GROUPS`), tên bài đa nghĩa (vd Forever, Butter) chỉ nhận khi có tên nhóm hoặc đặt trong dấu nháy/♪/#. Fan K-pop sẽ nói "đúng bài X của Y rồi", người khác hỏi "bài này của nhóm nào". Chỉ có sẵn một danh sách nhỏ, mở rộng bằng cách thêm dòng.
- **Câu trích lời bài hát:** repo **không lưu lời bài hát** (bản quyền), nên offline game không tự nhận ra bài từ một câu hát; cộng đồng sẽ hỏi thật ("câu này trích bài nào vậy?"). Bật tùy chọn Claude thì game nhờ Claude đoán tên bài/nhóm từ câu bạn gõ (chỉ nhận khi Claude chắc chắn).

## Game show bất ngờ

Khi bạn bắt đầu có tiếng (lời mời đầu tiên xuất hiện từ ngày thứ hai, sau đó ngẫu nhiên), một nghệ sĩ gạo cội hư cấu mời bạn vào game show. Mười câu hỏi: đời tư, suy nghĩ, hài hước, và **câu gài bẫy** ("đồng nghiệp nào hát dở nhất?", "fan hay nhà tài trợ?"). Bạn tự gõ câu trả lời:

- **Điểm tích lũy** bắt đầu từ 30. Trả lời chân thành, có duyên, khéo hướng về khán giả thì cộng; cụt lủn, né câu hỏi, đá xéo đồng nghiệp, khoe của, hoặc **mâu thuẫn với điều bạn từng khẳng định** thì trừ. Mỗi câu hiện rõ lý do cộng/trừ, lời dẫn chương trình và phản ứng của khán giả.
- **Về 0 là thua** (bị loại, mất fan). Hết 10 câu: 70 điểm trở lên thắng lớn, 45 trở lên là khá. Câu trả lời gây chú ý nhất được đăng lên bảng tin để cộng đồng bàn tán, và nếu nó mâu thuẫn với lời cũ thì vẫn bị đào lại.
- **Hạng:** thắng game show, đạt mốc người theo dõi (1K, 5K, 10K...), nhận hợp tác, bài đăng được yêu thích đều cộng điểm hạng (Tân binh → Gương mặt triển vọng → Ngôi sao đang lên → ... → Huyền thoại). Thua hoặc bài đăng phản tác dụng có thể tụt hạng.

Chấm điểm hiện là luật dựa trên cách bạn nói (giọng điệu, chủ đề, mâu thuẫn), chưa hiểu sâu câu trả lời có đúng trọng tâm câu hỏi không.

## Mess (tin nhắn) và drama ngoài lề

- **Mess:** fan, người góp ý, nghệ sĩ khác, quản lý và nhãn hàng (đều hư cấu) nhắn riêng cho bạn: khen, góp ý thẳng, rủ hợp tác, mời quảng cáo, mời game show, báo trước khi sắp bị đào lại bài cũ. Có tin chỉ cần trả lời tự do (cách bạn đối xử được nhân vật ghi nhớ), có tin có nút lựa chọn.
- **Drama ngoài lề:** thỉnh thoảng trong giới có chuyện của **nghệ sĩ khác** (hẹn hò, đá xéo, quảng cáo, từ thiện, flop...), cộng đồng tranh luận như bình thường dù không liên quan gì tới bạn; bạn vẫn có thể vào trả lời bình luận. Khoảng 3 phần 10 vụ sẽ **kéo bạn vào**: một nghệ sĩ nhắn hỏi bạn đứng về phía nào. Chọn phe hay im lặng đều có cái giá riêng.

## Cấu trúc

| File | Vai trò |
|---|---|
| `js/engine.js` | Lõi mô phỏng: phân tích bài đăng, tâm trạng, đợt phản ứng, thread nhiều tầng, trí nhớ, tin đồn, đồng hồ |
| `js/lexicon.js` | Dữ liệu: câu đùa/tiếng lóng, bài hát (chỉ tên), nghệ sĩ hư cấu, câu hỏi game show, mẫu tin nhắn, kịch bản drama |
| `js/world.js` | Game show, hạng và mốc fan, Mess, drama thế giới (gắn vào đồng hồ bằng `enableWorld()`) |
| `js/personas.js` | 21 tài khoản hư cấu: hồ sơ, vai, mức hiểu, "kiểu gõ" riêng |
| `js/content.js` | Mẫu câu theo vai và chủ đề, regex nhận diện chủ đề, khung giờ |
| `js/views.js` | Dựng HTML (thuần hàm, có test) |
| `js/app.js` | Nối sự kiện, lưu `localStorage` |
| `js/ai.js` | Tùy chọn: nhờ Claude viết lại bình luận (xem bên dưới) |

## Engine hoạt động thế nào

- **Hiểu đúng bài trước khi phản ứng:** `analyze()` rút chủ đề, "tuyên bố", câu trích. Bình luận chỉ trích câu **có thật** trong bài; người "hiểu sai" sai theo kiểu có chủ đích, không bịa điều khoản.
- **Đa dạng:** mỗi nhân vật có gu riêng với từng chủ đề, kiểu gõ riêng (viết thường, không dấu, teencode, lỗi gõ), và không lặp câu trong cùng một bài.
- **Thread:** hai nhân vật đối lập tranh luận qua lại, dài hơn khi bài "nóng", có người kết thúc ("khuya rồi ngủ đi...").
- **Trí nhớ:** mỗi lần bình luận, quan điểm của nhân vật dịch chuyển kèm **lý do** (`why`) và được nhắc lại ở bài sau. Không tự đổi ý vô cớ.
- **Tái lập:** mọi ngẫu nhiên đi qua `state.rng`, cùng seed cho cùng kết quả; state là JSON thuần.

## Claude tùy chọn (thử nghiệm)

Trong chân trang có công tắc "Dùng Claude viết lại bình luận". Khi bật và nhập API key, mỗi đợt sẽ gửi bản nháp của engine cho Claude để viết lại tự nhiên hơn, giữ nguyên quan điểm. Key chỉ lưu trong `sessionStorage`. Phần này **chưa được thử với API thật**; nếu lỗi, game tự dùng bản offline.

## Lộ trình

- [x] Facebook giả lập: bài đăng, bình luận nhiều tầng, 5 đợt, khung giờ, trí nhớ, đào lại, tin đồn báo trước
- [x] Tên thật + nghệ danh, ảnh mô tả trong `*...*`, người chơi trả lời bình luận
- [x] Hiểu câu đùa và bài hát, game show 10 câu có điểm và hạng, Mess, drama ngoài lề
- [ ] TikTok giả lập (văn phong ngắn, lóng riêng)
- [ ] Báo chí giả lập nhiều quan điểm, diễn đàn/cộng đồng chuyên môn
- [ ] Thêm nhân vật và mẫu câu, sinh nhân vật mới theo ngữ cảnh
- [ ] Chấm game show hiểu đúng trọng tâm câu hỏi (cần lớp Claude)
- [ ] Điền nghĩa cho các câu đùa trong `LEXICON`, thêm bài hát/nhóm
- [ ] Kiểm chứng và hoàn thiện lớp Claude, tinh chỉnh cân bằng
