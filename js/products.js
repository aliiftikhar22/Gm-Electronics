// GM Electronics — products.html: loads live products and categories from Firestore

var DEFAULT_CATEGORY_META = {
  'refrigerators':      { label: 'Refrigerators',        icon: 'icon-fridge' },
  'air-conditioners':   { label: 'Air Conditioners',      icon: 'icon-ac' },
  'microwaves-ovens':   { label: 'Microwaves & Ovens',    icon: 'icon-microwave' },
  'small-appliances':   { label: 'Small Appliances',      icon: 'icon-iron' }
};

var CATEGORY_META = {};
var CATEGORY_ORDER = [];

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function productCardHtml(p) {

  /* ================= IMAGES ================= */

  var images = Array.isArray(p.images) && p.images.length
    ? p.images
    : (p.imageUrl ? [p.imageUrl] : []);

  var mainImage = images.length
    ? images[0]
    : '';

  var img = mainImage
    ? '<img src="' + escapeHtml(mainImage) + '"' +
        ' alt="' + escapeHtml(p.name) + '"' +
        ' loading="lazy"' +
        ' class="product-main-image">'
    : '<div class="product-card-noimg">' +
        '<svg><use href="#icon-image"></use></svg>' +
      '</div>';


  /* ================= IMAGE GALLERY ================= */

  var galleryControls = '';

  if (images.length > 1) {

    galleryControls =
      '<button type="button" class="product-gallery-prev" ' +
        'data-gallery-prev="' + p.id + '">‹</button>' +

      '<button type="button" class="product-gallery-next" ' +
        'data-gallery-next="' + p.id + '">›</button>';
  }


  /* ================= COLORS ================= */

  var colors = Array.isArray(p.colors)
    ? p.colors
    : [];

  var colorHtml = '';

  if (colors.length) {

    colorHtml =
      '<div class="product-colors">' +

        '<div class="product-colors-label">Color</div>' +

        '<div class="product-color-swatches">';

    colors.forEach(function (color, index) {

      var hex = color.hex || '#ffffff';

      colorHtml +=
        '<button ' +
          'type="button" ' +
          'class="product-color-swatch ' +
            (index === 0 ? 'active' : '') +
          '" ' +

          'style="background-color:' +
            escapeHtml(hex) +
          ';" ' +

          'data-product-id="' +
            escapeHtml(p.id) +
          '" ' +

          'data-color-index="' +
            index +
          '" ' +

          'title="' +
            escapeHtml(color.name || 'Color') +
          '" ' +

          'aria-label="' +
            escapeHtml(color.name || 'Color') +
          '">' +

        '</button>';
    });

    colorHtml +=
        '</div>' +

        '<div class="product-selected-color">' +
          escapeHtml(colors[0].name || '') +
        '</div>' +

      '</div>';
  }


  /* ================= PRICE ================= */

  var wholesale = p.priceWholesale
    ? '<div class="product-card-wholesale">' +
        'Wholesale (bulk): ' +
        GMCart.formatPKR(p.priceWholesale) +
      '</div>'
    : '';


  /* ================= CARD ================= */

  return (

    '<div class="product-card" data-product-id="' +
      escapeHtml(p.id) +
    '">' +

      '<div class="product-card-img">' +

        '<div class="product-image-gallery" ' +
          'data-gallery-product="' +
          escapeHtml(p.id) +
        '">' +

          img +

          galleryControls +

        '</div>' +

      '</div>' +


      '<div class="product-card-body">' +

        '<h3>' +
          escapeHtml(p.name) +
        '</h3>' +

        (
          p.description
            ? '<p class="product-card-desc">' +
                escapeHtml(p.description) +
              '</p>'
            : ''
        ) +

        '<div class="product-card-price">' +
          GMCart.formatPKR(p.priceRetail) +
        '</div>' +

        wholesale +

        colorHtml +

        '<button class="btn btn-primary btn-block add-to-cart-btn" ' +
          'data-id="' +
            escapeHtml(p.id) +
          '">' +

          '<svg><use href="#icon-cart"></use></svg> ' +
          'Add to Cart' +

        '</button>' +

      '</div>' +

    '</div>'
  );
}
function renderCategoryFilters() {
  var filters = document.getElementById('category-filters');
  if (!filters) return;

  var html = '<button class="filter-btn active" data-filter="all">All</button>';
  CATEGORY_ORDER.forEach(function (key) {
    html += '<button class="filter-btn" data-filter="' + escapeHtml(key) + '">' +
      escapeHtml(CATEGORY_META[key].label) + '</button>';
  });
  filters.innerHTML = html;

  var filterBtns = filters.querySelectorAll('[data-filter]');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      var target = btn.getAttribute('data-filter');
      document.querySelectorAll('[data-category]').forEach(function (sec) {
        sec.style.display = target === 'all' || sec.getAttribute('data-category') === target ? '' : 'none';
      });
    });
  });
}

function renderProducts(products) {
  var root = document.getElementById('products-root');
  if (!root) return;

  var byCategory = {};
  CATEGORY_ORDER.forEach(function (c) { byCategory[c] = []; });

  products.forEach(function (p) {
    if (byCategory[p.category]) {
      byCategory[p.category].push(p);
    }
  });

  var html = '';
  CATEGORY_ORDER.forEach(function (key) {
    var meta = CATEGORY_META[key];
    var items = byCategory[key] || [];

    html += '<div class="product-section" id="' + escapeHtml(key) + '" data-category="' + escapeHtml(key) + '">';
    html += '<div class="product-section-head"><h2>' + escapeHtml(meta.label) + '</h2><span class="tag tag-amber">Retail &amp; Wholesale</span></div>';

    if (items.length === 0) {
      html += '<div class="empty-category">' +
                '<div class="cat-icon"><svg><use href="#' + escapeHtml(meta.icon) + '"></use></svg></div>' +
                '<p>No ' + escapeHtml(meta.label.toLowerCase()) + ' listed yet — message us on WhatsApp and we\'ll confirm what\'s in stock.</p>' +
              '</div>';
    } else {
      html += '<div class="product-cards-grid">' + items.map(productCardHtml).join('') + '</div>';
    }
    html += '</div>';
  });

  root.innerHTML = html;

  root.querySelectorAll('.add-to-cart-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var product = products.find(function (p) { return p.id === btn.getAttribute('data-id'); });
      if (!product) return;
      GMCart.addItem(product, 1);
      var original = btn.innerHTML;
      btn.innerHTML = '<svg><use href="#icon-check"></use></svg> Added';
      btn.disabled = true;
      setTimeout(function () { btn.innerHTML = original; btn.disabled = false; }, 1200);
    });
  });
}

function renderSetupNotice() {
  var root = document.getElementById('products-root');
  if (!root) return;
  root.innerHTML =
    '<div class="setup-notice">' +
      '<svg><use href="#icon-image"></use></svg>' +
      '<h3>Catalogue not connected yet</h3>' +
      '<p>This page loads products and categories from Firebase. Add them from the admin panel.</p>' +
    '</div>';
}

document.addEventListener('DOMContentLoaded', function () {
  if (typeof db === 'undefined') { renderSetupNotice(); return; }

  db.collection('categories').orderBy('sortOrder', 'asc').get()
    .then(function (snapshot) {
      CATEGORY_META = {};
      CATEGORY_ORDER = [];

      if (snapshot.empty) {
        CATEGORY_META = Object.assign({}, DEFAULT_CATEGORY_META);
        CATEGORY_ORDER = Object.keys(DEFAULT_CATEGORY_META);
      } else {
        snapshot.forEach(function (doc) {
          var d = doc.data();
          if (d.active === false) return;
          var slug = d.slug || doc.id;
          CATEGORY_META[slug] = {
            label: d.name || slug,
            icon: d.icon || 'icon-fridge'
          };
          CATEGORY_ORDER.push(slug);
        });
      }

      renderCategoryFilters();

      return db.collection('products').orderBy('createdAt', 'desc').get();
    })
    .then(function (snapshot) {
      var products = [];
      snapshot.forEach(function (doc) {
        var d = doc.data();
        products.push({
          id: doc.id,
          name: d.name || 'Unnamed product',
          category: d.category,
          priceRetail: Number(d.priceRetail) || 0,
          priceWholesale: d.priceWholesale ? Number(d.priceWholesale) : null,
          description: d.description || '',
          imageUrl: d.imageUrl || ''
        });
      });
      renderProducts(products);

      // Support direct links such as products.html#washing-machines.
      var hash = window.location.hash.replace(/^#/, '');
      if (hash && CATEGORY_META[hash]) {
        var btn = document.querySelector('[data-filter="' + CSS.escape(hash) + '"]');
        if (btn) btn.click();
      }
    })
    .catch(function (err) {
      console.error('Failed to load products/categories:', err);
      renderSetupNotice();
    });
});
