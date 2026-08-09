// GM Electronics — admin.html logic
// Requires Firebase Auth, Firestore and Storage to be configured in js/firebase-config.js

var CATEGORY_LABELS = {
  'refrigerators': 'Refrigerators',
  'air-conditioners': 'Air Conditioners',
  'microwaves-ovens': 'Microwaves & Ovens',
  'small-appliances': 'Small Appliances'
};

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function pkr(n) {
  return 'Rs. ' + Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

document.addEventListener('DOMContentLoaded', function () {
  if (typeof auth === 'undefined') {
    document.getElementById('admin-login').innerHTML =
      '<div class="plate" style="max-width:480px;margin:40px auto;"><h2>Firebase not configured</h2>' +
      '<p>Add your Firebase project keys to <code>js/firebase-config.js</code> and set up ' +
      'Authentication, Firestore and Storage as described in README.md before using the admin panel.</p></div>';
    return;
  }

  var loginSection = document.getElementById('admin-login');
  var dashboard = document.getElementById('admin-dashboard');
  var loginForm = document.getElementById('login-form');
  var loginStatus = document.getElementById('login-status');
  var logoutBtn = document.getElementById('logout-btn');

  auth.onAuthStateChanged(function (user) {
    if (user) {
      loginSection.style.display = 'none';
      dashboard.style.display = '';
      initProducts();
      initCategories();
      initOrders();
    } else {
      loginSection.style.display = '';
      dashboard.style.display = 'none';
    }
  });

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = document.getElementById('admin-email').value.trim();
    var pass = document.getElementById('admin-password').value;
    loginStatus.classList.remove('show', 'ok');
    auth.signInWithEmailAndPassword(email, pass).catch(function (err) {
      loginStatus.textContent = 'Login failed: ' + err.message;
      loginStatus.classList.add('show');
    });
  });

  logoutBtn.addEventListener('click', function () { auth.signOut(); });

  /* ---------------- Tabs ---------------- */
  document.querySelectorAll('.admin-tabs .filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.admin-tabs .filter-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var tab = btn.getAttribute('data-tab');
      document.getElementById('tab-products').style.display = tab === 'products' ? '' : 'none';
      document.getElementById('tab-categories').style.display = tab === 'categories' ? '' : 'none';
      document.getElementById('tab-orders').style.display = tab === 'orders' ? '' : 'none';
    });
  });


  /* ---------------- Categories ---------------- */
  var categoriesInitialized = false;
  var categoryCache = [];

  var DEFAULT_CATEGORIES = [
    {
      name: 'Refrigerators',
      slug: 'refrigerators',
      icon: 'icon-fridge',
      description: 'Single-door, double-door and large-capacity fridges for home and shop use.',
      sortOrder: 1,
      active: true
    },
    {
      name: 'Air Conditioners',
      slug: 'air-conditioners',
      icon: 'icon-ac',
      description: 'Split-unit air conditioners in a range of capacities for homes and offices.',
      sortOrder: 2,
      active: true
    },
    {
      name: 'Microwaves & Ovens',
      slug: 'microwaves-ovens',
      icon: 'icon-microwave',
      description: 'Microwave ovens and baking ovens for everyday and bulk kitchen needs.',
      sortOrder: 3,
      active: true
    },
    {
      name: 'Small Appliances',
      slug: 'small-appliances',
      icon: 'icon-iron',
      description: 'Irons, sandwich makers, exhaust fans and other everyday small appliances.',
      sortOrder: 4,
      active: true
    }
  ];

  function slugifyCategory(name) {
    return String(name || '')
      .toLowerCase()
      .trim()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function loadCategoryOptions(selected) {
    var select = document.getElementById('p-category');
    if (!select) return;
    select.innerHTML = '';
    categoryCache.forEach(function (c) {
      var option = document.createElement('option');
      option.value = c.slug;
      option.textContent = c.name;
      if (selected && selected === c.slug) option.selected = true;
      select.appendChild(option);
    });
    if (!select.value && categoryCache.length) select.value = categoryCache[0].slug;
  }

  function renderAdminCategoryList() {
    var listEl = document.getElementById('admin-categories-list');
    if (!listEl) return;

    if (!categoryCache.length) {
      listEl.innerHTML = '<p>No categories yet — add your first category above.</p>';
      return;
    }

    listEl.innerHTML = categoryCache.map(function (c) {
      var status = c.active !== false
        ? '<span class="tag tag-amber">Active</span>'
        : '<span class="tag">Hidden</span>';

      return (
        '<div class="admin-product-row" data-category-id="' + escapeHtml(c.id) + '">' +
          '<div class="admin-product-thumb" style="display:flex;align-items:center;justify-content:center;">' +
            '<svg style="width:34px;height:34px;"><use href="#' + escapeHtml(c.icon || 'icon-fridge') + '"></use></svg>' +
          '</div>' +
          '<div class="admin-product-info">' +
            '<strong>' + escapeHtml(c.name) + '</strong>' +
            '<span>' + escapeHtml(c.description || 'No description') + ' · Order ' + Number(c.sortOrder || 0) + '</span>' +
            '<div style="margin-top:6px;">' + status + '</div>' +
          '</div>' +
          '<div class="admin-product-actions">' +
            '<button class="btn btn-ghost btn-small category-edit" data-id="' + escapeHtml(c.id) + '">Edit</button>' +
            '<button class="btn btn-ghost btn-small category-delete" data-id="' + escapeHtml(c.id) + '">Delete</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    listEl.querySelectorAll('.category-edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var c = categoryCache.find(function (x) { return x.id === btn.getAttribute('data-id'); });
        if (!c) return;
        document.getElementById('category-id').value = c.id;
        document.getElementById('category-name').value = c.name || '';
        document.getElementById('category-icon').value = c.icon || 'icon-fridge';
        document.getElementById('category-description').value = c.description || '';
        document.getElementById('category-order').value = Number(c.sortOrder || 0);
        document.getElementById('category-active').value = c.active === false ? 'false' : 'true';
        document.getElementById('category-save-label').textContent = 'Save Changes';
        document.getElementById('category-form-title').textContent = 'Edit Category';
        document.getElementById('category-cancel-edit').style.display = '';
        document.getElementById('tab-categories').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    listEl.querySelectorAll('.category-delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var c = categoryCache.find(function (x) { return x.id === btn.getAttribute('data-id'); });
        if (!c) return;
        if (!confirm('Delete the category "' + c.name + '"? Products using this category will keep their category value.')) return;

        db.collection('categories').doc(c.id).delete()
          .then(function () {
            showCategoryStatus('Category deleted.', true);
          })
          .catch(function (err) {
            showCategoryStatus('Delete failed: ' + err.message, false);
          });
      });
    });
  }

  function showCategoryStatus(message, ok) {
    var el = document.getElementById('category-status');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('show', 'ok');
    el.classList.add('show');
    if (ok) el.classList.add('ok');
    setTimeout(function () { el.classList.remove('show'); }, 3000);
  }

  function resetCategoryForm() {
    var form = document.getElementById('category-form');
    if (form) form.reset();
    document.getElementById('category-id').value = '';
    document.getElementById('category-order').value = categoryCache.length + 1;
    document.getElementById('category-active').value = 'true';
    document.getElementById('category-icon').value = 'icon-fridge';
    document.getElementById('category-save-label').textContent = 'Add Category';
    document.getElementById('category-form-title').textContent = 'Add A Category';
    document.getElementById('category-cancel-edit').style.display = 'none';
  }

  function initCategories() {
    if (categoriesInitialized) return;
    categoriesInitialized = true;

    var form = document.getElementById('category-form');
    if (!form) return;

    var listEl = document.getElementById('admin-categories-list');
    var cancelBtn = document.getElementById('category-cancel-edit');

    db.collection('categories').orderBy('sortOrder', 'asc').onSnapshot(function (snapshot) {
      var loaded = [];
      snapshot.forEach(function (doc) {
        var d = doc.data();
        loaded.push({
          id: doc.id,
          name: d.name || 'Unnamed category',
          slug: d.slug || slugifyCategory(d.name),
          icon: d.icon || 'icon-fridge',
          description: d.description || '',
          sortOrder: Number(d.sortOrder) || 0,
          active: d.active !== false
        });
      });

      if (snapshot.empty) {
        // Seed the four categories that were already part of the original website.
        var batch = db.batch();
        DEFAULT_CATEGORIES.forEach(function (c) {
          var ref = db.collection('categories').doc(c.slug);
          batch.set(ref, Object.assign({}, c, {
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }));
        });
        batch.commit().catch(function (err) {
          showCategoryStatus('Could not create default categories: ' + err.message, false);
        });
        return;
      }

      categoryCache = loaded;
      loaded.forEach(function (c) { CATEGORY_LABELS[c.slug] = c.name; });
      renderAdminCategoryList();
      loadCategoryOptions();
    }, function (err) {
      if (listEl) listEl.innerHTML = '<p>Could not load categories: ' + escapeHtml(err.message) + '</p>';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = document.getElementById('category-name').value.trim();
      var slug = slugifyCategory(name);
      var icon = document.getElementById('category-icon').value;
      var description = document.getElementById('category-description').value.trim();
      var sortOrder = Number(document.getElementById('category-order').value) || 0;
      var active = document.getElementById('category-active').value === 'true';
      var editId = document.getElementById('category-id').value.trim();

      if (!name || !slug) {
        showCategoryStatus('Please enter a category name.', false);
        return;
      }

      var duplicate = categoryCache.find(function (c) {
        return c.slug === slug && c.id !== editId;
      });
      if (duplicate) {
        showCategoryStatus('A category with this name already exists.', false);
        return;
      }

      var data = {
        name: name,
        slug: slug,
        icon: icon,
        description: description,
        sortOrder: sortOrder,
        active: active,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      var request = editId
        ? db.collection('categories').doc(editId).update(data)
        : db.collection('categories').doc(slug).set(Object.assign({}, data, {
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }));

      request.then(function () {
        showCategoryStatus(editId ? 'Category updated.' : 'Category added.', true);
        resetCategoryForm();
      }).catch(function (err) {
        showCategoryStatus('Save failed: ' + err.message, false);
      });
    });

    cancelBtn.addEventListener('click', resetCategoryForm);
  }

  /* ---------------- Products ---------------- */
  var productsInitialized = false;
  function initProducts() {
    if (productsInitialized) return;
    productsInitialized = true;

    var form = document.getElementById('product-form');
    var listEl = document.getElementById('admin-products-list');
    var statusEl = document.getElementById('product-status');
    var cancelBtn = document.getElementById('product-cancel-edit');
    var saveLabel = document.getElementById('product-save-label');
    var formTitle = document.getElementById('product-form-title');
    loadCategoryOptions();

 var imageInput = document.getElementById('p-image');
var imagePreview = document.getElementById('p-image-preview');

var colorNameInput = document.getElementById('p-color-name');
var colorHexInput = document.getElementById('p-color-hex');
var addColorBtn = document.getElementById('p-add-color');
var colorsList = document.getElementById('p-colors-list');

var productImages = [];
var productColors = [];

/* ---------------- PRODUCT IMAGE PREVIEW ---------------- */

function renderProductImagePreview() {

  imagePreview.innerHTML = '';

  productImages.forEach(function (src, index) {

    var wrapper = document.createElement('div');

    wrapper.style.cssText =
      'position:relative;' +
      'border:1px solid rgba(255,255,255,.12);' +
      'border-radius:10px;' +
      'overflow:hidden;' +
      'background:#111;' +
      'aspect-ratio:1/1;';

    var img = document.createElement('img');

    img.src = src;

    img.style.cssText =
      'width:100%;' +
      'height:100%;' +
      'object-fit:contain;' +
      'display:block;';

    wrapper.appendChild(img);


    /* MAIN BADGE */

    if (index === 0) {

      var mainBadge = document.createElement('span');

      mainBadge.textContent = 'MAIN';

      mainBadge.style.cssText =
        'position:absolute;' +
        'left:6px;' +
        'bottom:6px;' +
        'padding:3px 6px;' +
        'font-size:9px;' +
        'font-weight:700;' +
        'background:#fff;' +
        'color:#111;' +
        'border-radius:5px;';

      wrapper.appendChild(mainBadge);
    }


    /* DELETE BUTTON */

    var deleteBtn = document.createElement('button');

    deleteBtn.type = 'button';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Delete photo';

    deleteBtn.style.cssText =
      'position:absolute;' +
      'top:6px;' +
      'right:6px;' +
      'width:28px;' +
      'height:28px;' +
      'border:0;' +
      'border-radius:50%;' +
      'background:rgba(0,0,0,.75);' +
      'color:#fff;' +
      'font-size:20px;' +
      'line-height:28px;' +
      'cursor:pointer;' +
      'z-index:10;';

    deleteBtn.addEventListener('click', function () {

      if (productImages.length <= 1) {
        alert('A product must have at least one photo.');
        return;
      }

      productImages.splice(index, 1);


      /* Fix color image mappings */

      productColors = productColors.filter(function (color) {

        var colorImageIndex = Number(color.imageIndex);

        /* Remove color assigned to deleted photo */
        if (colorImageIndex === index) {
          return false;
        }

        /* Shift later photo indexes */
        if (colorImageIndex > index) {
          color.imageIndex = colorImageIndex - 1;
        }

        return true;

      });


      renderProductImagePreview();
      renderProductColors();

    });

    wrapper.appendChild(deleteBtn);

    imagePreview.appendChild(wrapper);

  });

}

/* ---------------- COLORS ---------------- */

function renderProductColors() {

  if (!colorsList) return;

  colorsList.innerHTML = '';

  productColors.forEach(function (color, index) {

    var chip = document.createElement('div');

    chip.style.cssText =
      'display:flex;' +
      'align-items:center;' +
      'gap:7px;' +
      'padding:7px 10px;' +
      'border:1px solid rgba(255,255,255,.12);' +
      'border-radius:20px;' +
      'background:rgba(255,255,255,.04);';

    var swatch = document.createElement('span');

    swatch.style.cssText =
      'width:18px;' +
      'height:18px;' +
      'border-radius:50%;' +
      'background:' + color.hex + ';' +
      'border:1px solid rgba(255,255,255,.4);' +
      'display:inline-block;';

    var text = document.createElement('span');

    text.textContent =
      color.name +
      ' → Photo ' +
      (Number(color.imageIndex) + 1);

    var removeBtn = document.createElement('button');

    removeBtn.type = 'button';
    removeBtn.textContent = '×';

    removeBtn.style.cssText =
      'border:0;' +
      'background:none;' +
      'color:inherit;' +
      'cursor:pointer;' +
      'font-size:16px;';

    removeBtn.addEventListener('click', function () {

      productColors.splice(index, 1);

      renderProductColors();

    });

    chip.appendChild(swatch);
    chip.appendChild(text);
    chip.appendChild(removeBtn);

    colorsList.appendChild(chip);

  });
}


/* ---------------- ADD COLOR ---------------- */

if (addColorBtn) {

  addColorBtn.addEventListener('click', function () {

    var name = colorNameInput.value.trim();
    var hex = colorHexInput.value || '#ffffff';

    if (!name) {
      alert('Enter a color name first.');
      return;
    }

    if (!productImages.length) {
      alert('Upload product photos first.');
      return;
    }


    /*
     * Ask which uploaded photo belongs to this color.
     */
    var photoNumber = prompt(
      'Which photo should be used for "' +
      name +
      '"?\n\nEnter photo number:\n1 = first photo\n2 = second photo\n3 = third photo, etc.'
    );

    if (photoNumber === null) return;

    var imageIndex = Number(photoNumber) - 1;

    if (
      !Number.isInteger(imageIndex) ||
      imageIndex < 0 ||
      imageIndex >= productImages.length
    ) {

      alert(
        'Invalid photo number. Choose between 1 and ' +
        productImages.length + '.'
      );

      return;
    }


    productColors.push({

      name: name,

      hex: hex,

      imageIndex: imageIndex

    });


    colorNameInput.value = '';

    renderProductColors();

  });

}

   function resetForm() {

  form.reset();

  document.getElementById('product-id').value = '';

  imagePreview.innerHTML = '';

  productImages = [];

  productColors = [];

  if (colorsList) {
    colorsList.innerHTML = '';
  }

  if (colorHexInput) {
    colorHexInput.value = '#ffffff';
  }

  saveLabel.textContent = 'Add Product';

  formTitle.textContent = 'Add A Product';

  cancelBtn.style.display = 'none';
}
 cancelBtn.addEventListener('click', resetForm);


/* ---------------- IMAGE COMPRESSION ---------------- */

function compressProductImage(file, maxSize, quality) {

  maxSize = maxSize || 900;
  quality = quality || 0.72;

  return new Promise(function (resolve, reject) {

    var reader = new FileReader();

    reader.onload = function () {

      var img = new Image();

      img.onload = function () {

        var scale = Math.min(
          1,
          maxSize / Math.max(img.width, img.height)
        );

        var canvas = document.createElement('canvas');

        canvas.width = Math.max(
          1,
          Math.round(img.width * scale)
        );

        canvas.height = Math.max(
          1,
          Math.round(img.height * scale)
        );

        var ctx = canvas.getContext('2d');

        ctx.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height
        );

        resolve(
          canvas.toDataURL(
            'image/webp',
            quality
          )
        );
      };

      img.onerror = reject;

      img.src = reader.result;
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}


/* ---------------- COLOR MAP ---------------- */

var COLOR_MAP = {

  black: '#000000',
  white: '#ffffff',

  silver: '#c0c0c0',
  'black silver': '#4A4A4A',
  'black gold': '#8A6A20',

  grey: '#808080',
  gray: '#808080',

  red: '#ff0000',
  blue: '#0000ff',
  green: '#008000',
  yellow: '#ffff00',
  orange: '#ffa500',
  pink: '#ffc0cb',
  purple: '#800080',
  brown: '#8b4513',
  gold: '#ffd700',

  beige: '#f5f5dc',
  cream: '#fffdd0',
  maroon: '#800000',
  navy: '#000080',

  'dark green': '#006400',
  'light green': '#90ee90',
  'dark blue': '#00008b',
  'light blue': '#add8e6',

  ivory: '#fffff0',
  'rose gold': '#b76e79'
};


/* ---------------- AUTOMATIC COLOR HEX ---------------- */

if (colorNameInput) {

  colorNameInput.addEventListener('input', function () {

    var name = colorNameInput.value
      .trim()
      .toLowerCase();

    if (COLOR_MAP[name]) {
      colorHexInput.value = COLOR_MAP[name];
    }

  });

}


/* ---------------- PRODUCT IMAGE UPLOAD ---------------- */

imageInput.addEventListener('change', async function () {

  var files = Array.from(
    imageInput.files || []
  );

  if (!files.length) return;

  try {

    statusEl.textContent = 'Processing images...';
    statusEl.classList.add('show');

    var converted = await Promise.all(
      files.map(function (file) {
        return compressProductImage(file);
      })
    );

    productImages.push.apply(
      productImages,
      converted
    );

    renderProductImagePreview();

    imageInput.value = '';

    statusEl.textContent =
      productImages.length +
      ' image(s) ready to save.';

  } catch (err) {

    console.error(
      'Image processing error:',
      err
    );

    statusEl.textContent =
      'Could not process one or more images.';

  }

});

/* ---------------- PRODUCT SAVE ---------------- */

form.addEventListener('submit', async function (e) {

  e.preventDefault();

  statusEl.classList.remove('show', 'ok');

  var id =
    document.getElementById('product-id').value.trim();

  var name =
    document.getElementById('p-name').value.trim();

  var category =
    document.getElementById('p-category').value;

  var priceRetail =
    Number(
      document.getElementById('p-price-retail').value
    ) || 0;

  var wholesaleValue =
    document.getElementById('p-price-wholesale').value;

  var priceWholesale =
    wholesaleValue
      ? Number(wholesaleValue)
      : null;

  var description =
    document.getElementById('p-description').value.trim();


  if (!name) {

    statusEl.textContent =
      'Please enter a product name.';

    statusEl.classList.add('show');

    return;
  }


  if (!productImages.length) {

    statusEl.textContent =
      'Please upload at least one product photo.';

    statusEl.classList.add('show');

    return;
  }


  var saveBtn =
    document.getElementById('product-save-btn');

  saveBtn.disabled = true;

  saveLabel.textContent =
    id ? 'Updating...' : 'Saving...';


  var data = {

    name: name,

    category: category,

    priceRetail: priceRetail,

    priceWholesale: priceWholesale,

    description: description,

    image: productImages[0],

    imageUrl: productImages[0],

    images: productImages,

    colors: productColors

  };


  if (!id) {

    data.createdAt =
      firebase.firestore.FieldValue.serverTimestamp();

  }


  try {

    if (id) {

      await db
        .collection('products')
        .doc(id)
        .update(data);

    } else {

      await db
        .collection('products')
        .add(data);

    }


    statusEl.textContent =
      id
        ? 'Product updated successfully!'
        : 'Product added successfully!';

    statusEl.classList.add(
      'show',
      'ok'
    );


    resetForm();

  } catch (err) {

    console.error(
      'Product save error:',
      err
    );

    statusEl.textContent =
      'Save failed: ' +
      err.message;

    statusEl.classList.add('show');

  } finally {

    saveBtn.disabled = false;

    saveLabel.textContent =
      id
        ? 'Update Product'
        : 'Add Product';

  }

});


/* ---------------- LOAD PRODUCTS ---------------- */

db.collection('products')
  .orderBy('createdAt', 'desc')
  .onSnapshot(function (snapshot) {

    if (snapshot.empty) {

      listEl.innerHTML =
        '<p>No products added yet — use the form above to add your first one.</p>';

      return;
    }

    var rows = [];


    snapshot.forEach(function (doc) {

      var p = doc.data();

      var images =
        Array.isArray(p.images) &&
        p.images.length
          ? p.images
          : (
              p.imageUrl
                ? [p.imageUrl]
                : (
                    p.image
                      ? [p.image]
                      : []
                  )
            );


      var img =
        images.length

          ? '<img src="' +
              escapeHtml(images[0]) +
              '" alt="">'

          : '<div class="product-card-noimg" style="height:100%;">' +
              '<svg><use href="#icon-image"></use></svg>' +
            '</div>';


      var colorCount =
        Array.isArray(p.colors)
          ? p.colors.length
          : 0;


      rows.push(

        '<div class="admin-product-row" data-id="' +
          doc.id +
        '">' +

          '<div class="admin-product-thumb">' +
            img +
          '</div>' +

          '<div class="admin-product-info">' +

            '<strong>' +
              escapeHtml(p.name) +
            '</strong>' +

            '<span>' +
              (
                CATEGORY_LABELS[p.category] ||
                p.category ||
                ''
              ) +

              ' · ' +

              pkr(p.priceRetail) +

              (
                p.priceWholesale
                  ? ' / ' +
                    pkr(p.priceWholesale) +
                    ' wholesale'
                  : ''
              ) +

              (
                images.length > 1
                  ? ' · ' +
                    images.length +
                    ' photos'
                  : ''
              ) +

              (
                colorCount
                  ? ' · ' +
                    colorCount +
                    ' colors'
                  : ''
              ) +

            '</span>' +

          '</div>' +

          '<div class="admin-product-actions">' +

            '<button class="btn btn-ghost admin-edit-btn" data-id="' +
              doc.id +
              '">' +

              '<svg><use href="#icon-edit"></use></svg>' +

            '</button>' +

            '<button class="btn btn-ghost admin-delete-btn" data-id="' +
              doc.id +
              '">' +

              '<svg><use href="#icon-trash"></use></svg>' +

            '</button>' +

          '</div>' +

        '</div>'

      );

    });


    listEl.innerHTML =
      rows.join('');


    /* ---------------- EDIT ---------------- */

    listEl
      .querySelectorAll('.admin-edit-btn')
      .forEach(function (btn) {

        btn.addEventListener(
          'click',
          function () {

            db
              .collection('products')
              .doc(
                btn.getAttribute('data-id')
              )
              .get()
              .then(function (doc) {

                var p = doc.data();


                document.getElementById(
                  'product-id'
                ).value = doc.id;


                document.getElementById(
                  'p-name'
                ).value = p.name || '';


                document.getElementById(
                  'p-category'
                ).value =
                  p.category ||
                  'refrigerators';


                document.getElementById(
                  'p-price-retail'
                ).value =
                  p.priceRetail || '';


                document.getElementById(
                  'p-price-wholesale'
                ).value =
                  p.priceWholesale || '';


                document.getElementById(
                  'p-description'
                ).value =
                  p.description || '';


                productImages =
                  Array.isArray(p.images) &&
                  p.images.length

                    ? p.images.slice()

                    : (
                        p.imageUrl
                          ? [p.imageUrl]
                          : (
                              p.image
                                ? [p.image]
                                : []
                            )
                      );


                productColors =
                  Array.isArray(p.colors)
                    ? p.colors.slice()
                    : [];


                imagePreview.innerHTML = '';


                productImages.forEach(
                  function (src, index) {

                    var wrapper =
                      document.createElement(
                        'div'
                      );

                    wrapper.style.cssText =
                      'position:relative;' +
                      'border:1px solid rgba(255,255,255,.12);' +
                      'border-radius:10px;' +
                      'overflow:hidden;' +
                      'background:#111;' +
                      'aspect-ratio:1/1;';

                    var img =
                      document.createElement(
                        'img'
                      );

                    img.src = src;

                    img.style.cssText =
                      'width:100%;' +
                      'height:100%;' +
                      'object-fit:contain;' +
                      'display:block;';

                    wrapper.appendChild(img);


                    if (index === 0) {

                      var badge =
                        document.createElement(
                          'span'
                        );

                      badge.textContent =
                        'MAIN';

                      badge.style.cssText =
                        'position:absolute;' +
                        'left:6px;' +
                        'bottom:6px;' +
                        'padding:3px 6px;' +
                        'font-size:9px;' +
                        'font-weight:700;' +
                        'background:#fff;' +
                        'color:#111;' +
                        'border-radius:5px;';

                      wrapper.appendChild(
                        badge
                      );

                    }


                    imagePreview.appendChild(
                      wrapper
                    );

                  }
                );


                renderProductColors();


                saveLabel.textContent =
                  'Update Product';

                formTitle.textContent =
                  'Edit Product';

                cancelBtn.style.display =
                  '';


                window.scrollTo({

                  top:
                    form.getBoundingClientRect()
                      .top +
                    window.scrollY -
                    100,

                  behavior:
                    'smooth'

                });

              });

          }
        );

      });


    /* ---------------- DELETE ---------------- */

    listEl
      .querySelectorAll('.admin-delete-btn')
      .forEach(function (btn) {

        btn.addEventListener(
          'click',
          function () {

            if (
              !confirm(
                'Delete this product? This cannot be undone.'
              )
            ) {
              return;
            }


            db
              .collection('products')
              .doc(
                btn.getAttribute('data-id')
              )
              .delete();

          }
        );

      });

  });
  }
  /* ---------------- Orders ---------------- */
  var ordersInitialized = false;
  function initOrders() {
    if (ordersInitialized) return;
    ordersInitialized = true;

    var listEl = document.getElementById('admin-orders-list');
    db.collection('orders').orderBy('createdAt', 'desc').limit(100).onSnapshot(function (snapshot) {
      if (snapshot.empty) {
        listEl.innerHTML = '<p>No orders yet.</p>';
        return;
      }
      var cards = [];
      snapshot.forEach(function (doc) {
        var o = doc.data();
        var itemsHtml = (o.items || []).map(function (i) {
          return '<li>' + escapeHtml(i.name) + ' x' + i.qty + ' — ' + pkr(i.price * i.qty) + '</li>';
        }).join('');
        var done = o.status === 'done';
        cards.push(
          '<div class="admin-order-card' + (done ? ' done' : '') + '" data-id="' + doc.id + '">' +
            '<div class="admin-order-head">' +
              '<strong>' + escapeHtml(o.customerName) + '</strong>' +
              '<span class="tag ' + (done ? 'tag-green' : 'tag-amber') + '">' + (done ? 'Done' : 'New') + '</span>' +
            '</div>' +
            '<div class="admin-order-meta">' + escapeHtml(o.phone) + ' · ' + escapeHtml(o.city) + ' · ' + escapeHtml(o.paymentMethod) + '</div>' +
            '<div class="admin-order-meta">' + escapeHtml(o.address) + '</div>' +
            '<ul class="admin-order-items">' + itemsHtml + '</ul>' +
            '<div class="admin-order-total">Total: ' + pkr(o.total) + '</div>' +
            '<button class="btn btn-ghost btn-block admin-toggle-order" data-id="' + doc.id + '">' +
              (done ? 'Mark as New' : 'Mark as Done') +
            '</button>' +
          '</div>'
        );
      });
      listEl.innerHTML = '<div class="admin-orders-grid">' + cards.join('') + '</div>';

      listEl.querySelectorAll('.admin-toggle-order').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-id');
          db.collection('orders').doc(id).get().then(function (doc) {
            var current = doc.data().status;
            db.collection('orders').doc(id).update({ status: current === 'done' ? 'new' : 'done' });
          });
        });
      });
    });
}
  });
