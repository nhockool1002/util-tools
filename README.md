# Util Tools

Trang web công cụ tiện ích: Banking Tool, File Tool (Find in File, Compare File, …). Hỗ trợ Dark/Light, đa ngôn ngữ (EN/VI).

**NhutNguyen © 2026**

---

## Công nghệ

- **Next.js** (App Router), TypeScript, Tailwind CSS
- **shadcn/ui** + **Joly UI** (component)
- **next-themes** (Dark/Light, mặc định Dark)
- i18n EN/VI qua JSON

---

## Chạy local

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

### Share localhost (cho người khác truy cập tạm thời)

1. Chạy dev server (terminal 1):
   ```bash
   npm run dev
   ```
2. Chạy tunnel (terminal 2):
   ```bash
   npm run share
   ```
3. Lấy **IP công khai (public IP)** của máy đang chạy tunnel để gửi kèm link:
   - Trên **chính máy đang chạy `npm run share`**, mở trình duyệt vào: [https://loca.lt/mytunnelpassword](https://loca.lt/mytunnelpassword) — trang sẽ hiển thị đúng IP dùng làm mật khẩu tunnel.
   - Hoặc xem tại [https://whatismyip.com](https://whatismyip.com) (cũng trên máy đó).

4. Gửi cho người khác **hai thứ**: (1) link `https://xxx.loca.lt`, (2) **mật khẩu tunnel** (chính public IP vừa xem).

**Khi người nhận mở link:** Trang loca.lt sẽ hỏi "Tunnel Password" — họ cần nhập **public IP của máy bạn** (máy đang share), tức là số bạn đã gửi kèm link. Nếu nhập sai (ví dụ IP của máy họ), sẽ báo lỗi *"endpoint IP is not correct"* — khi đó cần dùng đúng IP mà bạn (người share) đã gửi.

**Nhập đúng IP vẫn báo sai?** Localtunnel đôi khi nhận diện IP lệch (VPN, proxy, NAT, IPv4/IPv6):
- Tắt VPN/proxy trên máy đang chạy `npm run share`, rồi vào lại [loca.lt/mytunnelpassword](https://loca.lt/mytunnelpassword) lấy IP mới và thử lại.
- Restart tunnel: dừng `npm run share` → chạy lại → lấy link + IP mới.
- Hoặc dùng **Cloudflare Tunnel** (không cần nhập IP): xem mục bên dưới.

#### Cách khác: Cloudflare Tunnel (không cần mật khẩu IP)

Cài [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) rồi chạy:

```bash
cloudflared tunnel --url http://localhost:3000
```

Sẽ ra link dạng `https://xxx.trycloudflare.com` — gửi link này cho người khác, họ mở trực tiếp, không cần nhập IP.

---

## Publish lên Cloudflare (để người ngoài truy cập)

Deploy Next.js lên **Cloudflare Pages / Workers** bằng [@opennextjs/cloudflare](https://opennext.js.org/cloudflare).

### Cách 1: Tự động (khuyến nghị)

Chạy lệnh migrate để cấu hình sẵn:

```bash
npx @opennextjs/cloudflare migrate
```

Sau đó:

```bash
npm run deploy
```

Lần đầu cần đăng nhập Cloudflare:

```bash
npx wrangler login
```

### Cách 2: Cấu hình tay

1. **Cài đặt**

   ```bash
   npm install @opennextjs/cloudflare@latest
   npm install --save-dev wrangler@latest
   ```

2. **Cấu hình Wrangler**  
   Tạo `wrangler.jsonc` tại thư mục gốc (hoặc dùng file do `migrate` tạo):

   ```jsonc
   {
     "$schema": "node_modules/wrangler/config-schema.json",
     "main": ".open-next/worker.js",
     "name": "util-tools",
     "compatibility_date": "2024-12-30",
     "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
     "assets": {
       "directory": ".open-next/assets",
       "binding": "ASSETS"
     },
     "services": [
       {
         "binding": "WORKER_SELF_REFERENCE",
         "service": "util-tools"
       }
     ]
   }
   ```

3. **Script trong `package.json`**

   Thêm hoặc chỉnh:

   ```json
   "scripts": {
     "build": "next build",
     "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
     "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy"
   }
   ```

4. **Cache cho static**  
   Tạo `public/_headers`:

   ```
   /_next/static/*
     Cache-Control: public,max-age=31536000,immutable
   ```

5. **Đăng nhập và deploy**

   ```bash
   npx wrangler login
   npm run deploy
   ```

Sau khi deploy xong, Cloudflare sẽ cho URL dạng `https://util-tools.<subdomain>.workers.dev` (hoặc domain tùy chỉnh bạn gắn). Dùng URL này để chia sẻ cho người ngoài truy cập.

### Lưu ý

- Cần **Wrangler 3.99.0+**.
- Thêm `.open-next` vào `.gitignore` (thường đã được thêm khi chạy `migrate`).
- Tài liệu chi tiết: [OpenNext – Cloudflare](https://opennext.js.org/cloudflare), [Get started](https://opennext.js.org/cloudflare/get-started).
