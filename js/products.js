// GM Electronics — products.html: loads the live catalogue from Firestore

var CATEGORY_META = {
  'refrigerators':      { label: 'Refrigerators',        icon: 'icon-fridge' },
  'air-conditioners':   { label: 'Air Conditioners',      icon: 'icon-ac' },
  'microwaves-ovens':   { label: 'Microwaves & Ovens',    icon: 'icon-microwave' },
  'small-appliances':   { label: 'Small Appliances',      icon: 'icon-iron' }
};
var CATEGORY_ORDER = ['refrigerators', 'air-conditioners', 'microwaves-ovens', 'small-appliances'];

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function productCardHtml(p) {
  var img = p.imageUrl
    ? '<img src="' + escapeHtml(p.imageUrl) + '" alt="' + escapeHtml(p.name) + '" loading="lazy">'
    : '<div class="product-card-noimg"><svg><use href="#icon-image"></use></svg></div>';

  var wholesale = p.priceWholesale
    ? '<div class="product-card-wholesale">Wholesale (bulk): ' + GMCart.formatPKR(p.priceWholesale) + '</div>'
    : '';

  return (
    '<div class="product-card">' +
      '<div class="product-card-img">' + img + '</div>' +
      '<div class="product-card-body">' +
        '<h3>' + escapeHtml(p.name) + '</h3>' +
        (p.description ? '<p class="product-card-desc">' + escapeHtml(p.description) + '</p>' : '') +
        '<div class="product-card-price">' + GMCart.formatPKR(p.priceRetail) + '</div>' +
        wholesale +
        '<button class="btn btn-primary btn-block add-to-cart-btn" data-id="' + p.id + '">' +
          '<svg><use href="#icon-cart"></use></svg> Add to Cart' +
        '</button>' +
      '</div>' +
    '</div>'
  );
}

function renderProducts(products) {
  var root = document.getElementById('products-root');
  var byCategory = {};
  CATEGORY_ORDER.forEach(function (c) { byCategory[c] = []; });
  products.forEach(function (p) {
    if (byCategory[p.category]) byCategory[p.category].push(p);
  });

  var html = '';
  CATEGORY_ORDER.forEach(function (key) {
    var meta = CATEGORY_META[key];
    var items = byCategory[key];
    html += '<div class="product-section" id="' + key + '" data-category="' + key + '">';
    html += '<div class="product-section-head"><h2>' + meta.label + '</h2><span class="tag tag-amber">Retail &amp; Wholesale</span></div>';
    if (items.length === 0) {
      html += '<div class="empty-category">' +
                '<div class="cat-icon"><svg><use href="#' + meta.icon + '"></use></svg></div>' +
                '<p>No ' + meta.label.toLowerCase() + ' listed yet — message us on WhatsApp and we\'ll confirm what\'s in stock.</p>' +
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

  // re-apply the active category filter, if the filter script already ran
  var activeBtn = document.querySelector('.filter-btn.active');
  if (activeBtn && activeBtn.getAttribute('data-filter') !== 'all') {
    var target = activeBtn.getAttribute('data-filter');
    document.querySelectorAll('[data-category]').forEach(function (sec) {
      sec.style.display = sec.getAttribute('data-category') === target ? '' : 'none';
    });
  }
}

function renderSetupNotice() {
  var root = document.getElementById('products-root');
  root.innerHTML =
    '<div class="setup-notice">' +
      '<svg><use href="#icon-image"></use></svg>' +
      '<h3>Catalogue not connected yet</h3>' +
      '<p>This page loads products from Firebase. Once the store owner finishes the Firebase setup in <code>js/firebase-config.js</code> and adds products from the admin panel, they\'ll appear here automatically.</p>' +
    '</div>';
}

document.addEventListener('DOMContentLoaded', function () {
  if (typeof db === 'undefined') { renderSetupNotice(); return; }

  db.collection('products').orderBy('createdAt', 'desc').get()
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
    })
    .catch(function (err) {
      console.error('Failed to load products:', err);
      renderSetupNotice();
    });
});
