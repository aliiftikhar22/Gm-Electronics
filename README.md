# GM Electronics — Website

A 7-page site (Home, About, Products, Gallery, Contact, Checkout, Admin) built with plain HTML, CSS and JavaScript. The public pages are static; **Products, Checkout and Admin are wired to Firebase** (a free Google backend) so you can add/edit/delete products from a real admin panel and receive orders.

## What's in it

- **Home, About, Gallery, Contact** — static pages, same as before.
- **Products** — loads the product list live from Firestore (Firebase's database). Empty until you add products from the admin panel.
- **Checkout** — customers add products to a cart (stored in their own browser), fill in delivery details, choose **Cash on Delivery, JazzCash, or Easypaisa**, and tap "Place Order." This opens WhatsApp with the order pre-filled, ready to send to you. The order is also saved to Firestore so it shows in your admin panel.
- **Admin** (`admin.html`) — a login-gated page (not in the main menu; reachable from a small "Staff Login" link in the footer) where you can add, edit and delete products (with photo upload) and see incoming orders.

**Nothing here does automatic online payment.** JazzCash/Easypaisa at checkout just shows your account number and asks the customer to transfer manually and confirm with you on WhatsApp — you're not set up for a real merchant gateway, which needs a business account with them and a different kind of backend. This gets you selling online now; a real gateway can be added later if you open a merchant account.

## One-time setup: Firebase (~10 minutes)

The admin panel and checkout need a free Firebase project to store products and orders.

### 1. Create the project
1. Go to console.firebase.google.com and sign in with a Google account.
2. Click **Add project**, name it (e.g. "gm-electronics"), and finish the wizard (you can turn off Google Analytics — not needed).

### 2. Register a web app
1. On the project's home screen, click the **</>** (web) icon to add a web app.
2. Give it any nickname, click **Register app**. Firebase shows you a code block with a `firebaseConfig` object.
3. Copy that object's values into **`js/firebase-config.js`** in this folder, replacing the placeholder text (`YOUR_API_KEY`, etc).

### 3. Turn on Authentication (for admin login)
1. In the left sidebar: **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Email/Password**.
3. Go to the **Users** tab → **Add user** → enter the email and password *you* (the store owner) want to log into `admin.html` with. This is your admin account — there's no public sign-up, only you can create logins, from this console.

### 4. Turn on Firestore (the product/order database)
1. **Build → Firestore Database → Create database**.
2. Choose **Start in production mode**, pick a location close to Pakistan (e.g. `asia-south1`), click **Enable**.
3. Go to the **Rules** tab, delete what's there, and paste in the contents of **`firestore.rules`** (included in this folder). Click **Publish**.

### 5. Set up Cloudinary (for product photos — genuinely free, no card needed)

Firebase Storage started requiring a linked billing card in 2026 even for free-tier usage, so product photos are uploaded via **Cloudinary** instead — no card required, generous free limits.

1. Sign up free at cloudinary.com (no credit card asked).
2. On your Dashboard, copy the **"Cloud name"** shown near the top.
3. Go to **Settings** (gear icon) → **Upload** → **Upload presets** → **Add upload preset**.
4. Set **Signing Mode** to **Unsigned**, click **Save**, and copy the preset's name.
5. Open **`js/cloudinary-config.js`** in this folder and paste in your cloud name and preset name, replacing the placeholders.

### 6. Test it
1. Open `admin.html` in your browser, log in with the email/password from step 3.
2. Add a test product with a name, category, price and photo → Save.
3. Open `products.html` — your product should appear.
4. Add it to cart → go to checkout → fill the form → Place Order → confirm WhatsApp opens with the order text filled in.

Once that all works locally, publish it (see below) and it'll work the same way live.

## Before you publish — replace these placeholders

| What | Where | Current placeholder |
|---|---|---|
| Firebase config | `js/firebase-config.js` | placeholder keys — required, see setup above |
| Cloudinary config | `js/cloudinary-config.js` | placeholder cloud name/preset — required for photo uploads, see setup above |
| Phone / WhatsApp | header, footer, `contact.html`, `js/checkout.js` (`WHATSAPP_NUMBER`) | `+92-306-4575272` — already set to yours |
| Email | `contact.html`, footer, `js/script.js` | `info@gmelectronics.com.pk` |
| Store address | `contact.html` | placeholder address text |
| Google Map | `contact.html` iframe `src` | generic Pakistan map — search your shop on Google Maps then Share, Embed a map, and paste that `src` URL |
| JazzCash/Easypaisa account | `checkout.html` (jazzcash/easypaisa instructions blocks) | placeholder number `0300-0000000` — put your real account title and number |
| Logo | `.brand-mark` in the header/footer of each page | currently a text "GM" monogram |

Phone/email/nav appear identically on every page — if you change one, repeat the change across all 7 HTML files (find-and-replace in a code editor is fastest).

## Editing

Each page is a plain, self-contained HTML file — open any `.html` file in a code editor and edit directly. Shared styling is in `css/style.css`. Behaviour is split by purpose:
- `js/script.js` — mobile menu, gallery lightbox, category filter, contact form
- `js/cart.js` — shopping cart storage (used on every page, for the header cart badge)
- `js/products.js` — loads products from Firestore onto `products.html`
- `js/checkout.js` — cart display and order submission on `checkout.html`
- `js/admin.js` — login, product CRUD, and orders view on `admin.html`
- `js/firebase-config.js` — your Firebase project keys (edit this one, not the others, for setup)
- `js/cloudinary-config.js` — your Cloudinary cloud name and upload preset (for product photos)

No build step — edit and refresh the browser to see changes.

## Publish on GitHub Pages with your domain

### 1. Push this folder to a GitHub repository
```bash
cd gm-electronics
git init
git add .
git commit -m "GM Electronics website"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### 2. Turn on GitHub Pages
1. On GitHub, open your repo → **Settings** → **Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Branch: `main`, folder: `/ (root)`. Save.
4. GitHub will give you a temporary URL like `https://<username>.github.io/<repo>/` — confirm the site loads there first.

### 3. Point your domain at GitHub Pages
The `CNAME` file in this repo already contains `gmelectronics.com.pk`. At your domain registrar, add:

**A records** (root domain) — all four, pointing to GitHub's IPs:
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**Optional, for www.gmelectronics.com.pk** — a CNAME record:
```
www  →  <your-username>.github.io
```

DNS changes can take a few minutes to 24 hours.

### 4. Confirm in GitHub
1. **Settings → Pages** → **Custom domain** → enter `gmelectronics.com.pk` → Save.
2. Once DNS propagates, GitHub shows a green checkmark.
3. Tick **Enforce HTTPS** once available.

Your site will then be live at `https://gmelectronics.com.pk`, including the working admin panel and checkout — Firebase works from any domain automatically, no extra config needed there.

## Good to know

- **Cart is per-device**: it's stored in each visitor's own browser (not shared between their phone and laptop, and clears if they clear browser data). That's normal for a site without customer accounts.
- **No online money movement**: JazzCash/Easypaisa at checkout are "pay manually, confirm on WhatsApp" — not an automatic gateway. See the top of this file for why, and what upgrading later would involve.
- **Firebase free tier** (Firestore + Authentication, on the Spark plan — no card needed) comfortably covers a small-to-medium store: 50K reads/20K writes per day. You won't hit a paywall at normal traffic levels.
- **Cloudinary free tier** covers product photos (25GB storage/bandwidth) — also no card needed.
- **Only you can create admin logins**, from the Firebase console's Authentication → Users tab — there's no public sign-up page, so the store can't be hijacked by someone finding `admin.html`.
- **Mobile-responsive**, keyboard-accessible, respects reduced-motion preferences.
