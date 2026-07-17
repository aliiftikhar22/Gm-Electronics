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
      document.getElementById('tab-orders').style.display = tab === 'orders' ? '' : 'none';
    });
  });

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
    var imageInput = document.getElementById('p-image');
    var imagePreview = document.getElementById('p-image-preview');

    imageInput.addEventListener('change', function () {
      imagePreview.innerHTML = '';
      var file = imageInput.files[0];
      if (!file) return;
      var img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      imagePreview.appendChild(img);
    });

    function resetForm() {
      form.reset();
      document.getElementById('product-id').value = '';
      imagePreview.innerHTML = '';
      saveLabel.textContent = 'Add Product';
      formTitle.textContent = 'Add A Product';
      cancelBtn.style.display = 'none';
    }
    cancelBtn.addEventListener('click', resetForm);

    db.collection('products').orderBy('createdAt', 'desc').onSnapshot(function (snapshot) {
      if (snapshot.empty) {
        listEl.innerHTML = '<p>No products added yet — use the form above to add your first one.</p>';
        return;
      }
      var rows = [];
      snapshot.forEach(function (doc) {
        var p = doc.data();
        var img = p.imageUrl
          ? '<img src="' + escapeHtml(p.imageUrl) + '" alt="">'
          : '<div class="product-card-noimg" style="height:100%;"><svg><use href="#icon-image"></use></svg></div>';
        rows.push(
          '<div class="admin-product-row" data-id="' + doc.id + '">' +
            '<div class="admin-product-thumb">' + img + '</div>' +
            '<div class="admin-product-info">' +
              '<strong>' + escapeHtml(p.name) + '</strong>' +
              '<span>' + (CATEGORY_LABELS[p.category] || p.category) + ' · ' + pkr(p.priceRetail) +
              (p.priceWholesale ? ' / ' + pkr(p.priceWholesale) + ' wholesale' : '') + '</span>' +
            '</div>' +
            '<div class="admin-product-actions">' +
              '<button class="btn btn-ghost admin-edit-btn" data-id="' + doc.id + '"><svg><use href="#icon-edit"></use></svg></button>' +
              '<button class="btn btn-ghost admin-delete-btn" data-id="' + doc.id + '"><svg><use href="#icon-trash"></use></svg></button>' +
            '</div>' +
          '</div>'
        );
      });
      listEl.innerHTML = rows.join('');

      listEl.querySelectorAll('.admin-edit-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          db.collection('products').doc(btn.getAttribute('data-id')).get().then(function (doc) {
            var p = doc.data();
            document.getElementById('product-id').value = doc.id;
            document.getElementById('p-name').value = p.name || '';
            document.getElementById('p-category').value = p.category || 'refrigerators';
            document.getElementById('p-price-retail').value = p.priceRetail || '';
            document.getElementById('p-price-wholesale').value = p.priceWholesale || '';
            document.getElementById('p-description').value = p.description || '';
            imagePreview.innerHTML = p.imageUrl ? '<img src="' + escapeHtml(p.imageUrl) + '" alt="">' : '';
            saveLabel.textContent = 'Update Product';
            formTitle.textContent = 'Edit Product';
            cancelBtn.style.display = '';
            window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
          });
        });
      });
      listEl.querySelectorAll('.admin-delete-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!confirm('Delete this product? This cannot be undone.')) return;
          db.collection('products').doc(btn.getAttribute('data-id')).delete();
        });
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      statusEl.classList.remove('show', 'ok');
      var id = document.getElementById('product-id').value;
      var data = {
        name: document.getElementById('p-name').value.trim(),
        category: document.getElementById('p-category').value,
        priceRetail: Number(document.getElementById('p-price-retail').value) || 0,
        priceWholesale: document.getElementById('p-price-wholesale').value
          ? Number(document.getElementById('p-price-wholesale').value) : null,
        description: document.getElementById('p-description').value.trim()
      };
      if (!id) data.createdAt = firebase.firestore.FieldValue.serverTimestamp();

      var file = imageInput.files[0];
      var saveBtn = document.getElementById('product-save-btn');
      saveBtn.disabled = true;

      function saveDoc() {
        var promise = id
          ? db.collection('products').doc(id).update(data)
          : db.collection('products').add(data);
        promise.then(function () {
          statusEl.textContent = 'Saved!';
          statusEl.classList.add('show', 'ok');
          resetForm();
        }).catch(function (err) {
          statusEl.textContent = 'Error: ' + err.message;
          statusEl.classList.add('show');
        }).finally(function () { saveBtn.disabled = false; });
      }

      if (file) {
        if (typeof CLOUDINARY_CLOUD_NAME === 'undefined' || CLOUDINARY_CLOUD_NAME === 'YOUR_CLOUD_NAME') {
          statusEl.textContent = 'Photo uploads need Cloudinary set up first — see README.md.';
          statusEl.classList.add('show');
          saveBtn.disabled = false;
          return;
        }
        var uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        fetch('https://api.cloudinary.com/v1_1/' + CLOUDINARY_CLOUD_NAME + '/image/upload', {
          method: 'POST',
          body: uploadData
        })
          .then(function (res) { return res.json(); })
          .then(function (result) {
            if (!result.secure_url) throw new Error(result.error ? result.error.message : 'Upload failed');
            data.imageUrl = result.secure_url;
            saveDoc();
          })
          .catch(function (err) {
            statusEl.textContent = 'Image upload failed: ' + err.message;
            statusEl.classList.add('show');
            saveBtn.disabled = false;
          });
      } else {
        saveDoc();
      }
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
