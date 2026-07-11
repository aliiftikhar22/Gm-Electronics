// GM Electronics — shared site behaviour

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Mobile nav toggle ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Product filter (products.html) ---------- */
  var filterBtns = document.querySelectorAll('[data-filter]');
  var sections = document.querySelectorAll('[data-category]');
  if (filterBtns.length && sections.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var target = btn.getAttribute('data-filter');
        sections.forEach(function (sec) {
          if (target === 'all' || sec.getAttribute('data-category') === target) {
            sec.style.display = '';
          } else {
            sec.style.display = 'none';
          }
        });
      });
    });
  }

  /* ---------- Gallery lightbox ---------- */
  var tiles = document.querySelectorAll('.gallery-tile');
  var lightbox = document.getElementById('lightbox');
  if (tiles.length && lightbox) {
    var lbIcon = lightbox.querySelector('.lightbox-icon use');
    var lbTitle = lightbox.querySelector('.lightbox-title');
    var lbDesc = lightbox.querySelector('.lightbox-desc');
    var closeBtn = lightbox.querySelector('.lightbox-close');

    tiles.forEach(function (tile) {
      tile.addEventListener('click', function () {
        var icon = tile.getAttribute('data-icon');
        var title = tile.getAttribute('data-title');
        var desc = tile.getAttribute('data-desc');
        if (lbIcon) lbIcon.setAttribute('href', '#' + icon);
        if (lbTitle) lbTitle.textContent = title;
        if (lbDesc) lbDesc.textContent = desc;
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
      });
    });
    function closeLightbox() {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
    }
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  /* ---------- Contact form (contact.html) ----------
     No backend is included. This builds a mailto link from the
     entered fields so a message opens ready-to-send in the
     visitor's email app. Swap for Formspree/EmailJS/etc. if you
     want messages delivered without opening a mail client. */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      var type = form.inquiry.value;
      var message = form.message.value.trim();
      var status = document.getElementById('form-status');

      var subject = encodeURIComponent('Website enquiry — ' + type);
      var body = encodeURIComponent(
        'Name: ' + name + '\n' +
        'Phone: ' + phone + '\n' +
        'Enquiry type: ' + type + '\n\n' +
        'Message:\n' + message
      );
      var mailto = 'mailto:info@gmelectronics.com.pk?subject=' + subject + '&body=' + body;

      window.location.href = mailto;

      if (status) {
        status.textContent = 'Opening your email app with this message pre-filled — hit send there to reach us.';
        status.classList.add('show', 'ok');
      }
      form.reset();
    });
  }
});
