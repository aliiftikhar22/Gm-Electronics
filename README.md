# GM Electronics — Website

A 5-page static site (Home, About, Products, Gallery, Contact) built with plain HTML, CSS and JavaScript — no build tools, no frameworks. Ready to publish on GitHub Pages under **gmelectronics.com.pk**.

## Before you publish — replace these placeholders

Search the files for these and swap in your real details:

| What | Where | Current placeholder |
|---|---|---|
| Phone number | `contact.html`, `index.html` header, footer (all pages) | `+92 306 4575272` |
| WhatsApp link | header button + `contact.html` | `wa.me/923064575272` |
| Email | `contact.html`, footer, `js/script.js` (mailto address) | `info@gmelectronics.com.pk` |
| Store address | `contact.html` | "Shop address, Street/Block, Area..." |
| Google Map | `contact.html` `<iframe>` `src` | generic Pakistan map — go to Google Maps, search your shop, click Share → Embed a map, and paste that `src` URL in |
| Logo | `partials/header.html` / `partials/footer.html` `.brand-mark` | currently a text "GM" monogram — swap for an `<img>` tag pointing at your logo file once you have it |
| Product photos | `gallery.html`, `products.html` | currently icon illustrations — replace `<div class="cat-icon">` blocks with `<img>` tags once you have real photos |

Note: the header, footer, and phone/email/WhatsApp links appear on every page, so if you change one of them, repeat the change across all 5 HTML files (`index.html`, `about.html`, `products.html`, `gallery.html`, `contact.html`). Find-and-replace in a code editor (VS Code, etc.) makes this quick — search for the old phone number or email across the whole folder and replace all matches at once.

## Editing

Each page is a plain, self-contained HTML file — open any of the 5 root `.html` files directly in a code editor and edit the text/markup. All shared styling lives in `css/style.css`; shared behaviour (mobile menu, gallery lightbox, product filter, contact form) lives in `js/script.js`. There's no build step — edit the HTML/CSS/JS and refresh the browser to see changes.

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
The `CNAME` file in this repo already contains `gmelectronics.com.pk`, which tells GitHub Pages to serve the site on that domain. You still need to point the domain's DNS at GitHub:

At your domain registrar (wherever `gmelectronics.com.pk` is registered), add these DNS records:

**A records** (for the root domain `gmelectronics.com.pk`) — add all four, pointing to GitHub's IPs:
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**If you also want `www.gmelectronics.com.pk` to work**, add a CNAME record:
```
www  →  <your-username>.github.io
```

DNS changes can take anywhere from a few minutes to 24 hours to take effect.

### 4. Confirm in GitHub
1. Back in **Settings → Pages**, under **Custom domain**, enter `gmelectronics.com.pk` and save (this re-writes the CNAME file — fine, it already matches).
2. Once DNS has propagated, GitHub will show a green checkmark confirming the domain is verified.
3. Tick **Enforce HTTPS** once it becomes available (usually within an hour of verification) so the site loads securely.

Your site will then be live at `https://gmelectronics.com.pk`.

## Notes on what's built in

- **No backend**: the contact form opens the visitor's email app with the message pre-filled (via a `mailto:` link) — nothing gets sent silently, and there's no server involved. If you'd rather have form messages land directly in an inbox without opening a mail app, connect a free service like Formspree or EmailJS and swap the logic in `js/script.js`.
- **Product images**: since no product photos were supplied yet, categories are represented with custom line-icon illustrations (see `partials/sprite.html`) styled to match the site. Swap these for real photos whenever you have them — no design changes needed elsewhere.
- **Fonts**: loaded from Google Fonts via CDN (Oswald, Work Sans, IBM Plex Mono) — requires an internet connection to render as designed; falls back to system fonts otherwise.
- **Mobile-responsive**, keyboard-accessible, and respects reduced-motion preferences.
