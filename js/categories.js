// GM Electronics — live homepage categories
// Reads categories created in admin.html from Firestore.

(function () {
  var FALLBACK_CATEGORIES = [
    {
      name: 'Refrigerators',
      slug: 'refrigerators',
      icon: 'icon-fridge',
      description: 'Single-door, double-door and large-capacity fridges for home and shop use.'
    },
    {
      name: 'Air Conditioners',
      slug: 'air-conditioners',
      icon: 'icon-ac',
      description: 'Split-unit air conditioners in a range of capacities for homes and offices.'
    },
    {
      name: 'Microwaves & Ovens',
      slug: 'microwaves-ovens',
      icon: 'icon-microwave',
      description: 'Microwave ovens and baking ovens for everyday and bulk kitchen needs.'
    },
    {
      name: 'Small Appliances',
      slug: 'small-appliances',
      icon: 'icon-iron',
      description: 'Irons, sandwich makers, exhaust fans and other everyday small appliances.'
    }
  ];

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  function renderCategories(categories) {
    var root = document.getElementById('homepage-categories');
    if (!root) return;

    var visible = categories.filter(function (c) { return c.active !== false; });
    visible.sort(function (a, b) { return (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0); });

    root.innerHTML = visible.map(function (c) {
      return (
        '<div class="cat-card">' +
'<div class="cat-icon">' +
  (
    c.imageUrl
      ? '<img src="' + escapeHtml(c.imageUrl) + '" alt="' + escapeHtml(c.name) + '">' 
      : '<svg><use href="#' + escapeHtml(c.icon || 'icon-fridge') + '"></use></svg>'
  ) +
'</div>' +
        '<h3>' + escapeHtml(c.name) + '</h3>' +
          '<p>' + escapeHtml(c.description || 'Browse our latest products in this category.') + '</p>' +
          '<div class="cat-tags"><span class="tag tag-amber">Retail</span><span class="tag tag-amber">Wholesale</span></div>' +
          '<a href="products.html#' + encodeURIComponent(c.slug) + '" class="card-link">View range <svg><use href="#icon-arrow"></use></svg></a>' +
        '</div>'
      );
    }).join('');

    if (!visible.length) {
      root.innerHTML = '<p class="setup-notice">No active categories are currently available.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('homepage-categories');
    if (!root) return;

    if (typeof db === 'undefined') {
      renderCategories(FALLBACK_CATEGORIES);
      return;
    }

    db.collection('categories').orderBy('sortOrder', 'asc').get()
      .then(function (snapshot) {
        if (snapshot.empty) {
          renderCategories(FALLBACK_CATEGORIES);
          return;
        }

        var categories = [];
        snapshot.forEach(function (doc) {
          var d = doc.data();
         categories.push({
  name: d.name || 'Unnamed category',
  slug: d.slug || doc.id,
  icon: d.icon || 'icon-fridge',
  imageUrl: d.imageUrl || '',
  description: d.description || '',
  sortOrder: Number(d.sortOrder) || 0,
  active: d.active !== false
});
        });
        renderCategories(categories);
      })
      .catch(function (err) {
        console.error('Failed to load categories:', err);
        renderCategories(FALLBACK_CATEGORIES);
      });
  });
})();
