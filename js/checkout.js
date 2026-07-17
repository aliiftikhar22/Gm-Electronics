// GM Electronics — checkout.html logic

var WHATSAPP_NUMBER = '923064575272'; // digits only, country code first

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function cartItemHtml(item) {
  var img = item.image
    ? '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.name) + '">'
    : '<div class="product-card-noimg"><svg><use href="#icon-image"></use></svg></div>';
  return (
    '<div class="cart-item" data-id="' + item.id + '">' +
      '<div class="cart-item-img">' + img + '</div>' +
      '<div class="cart-item-info">' +
        '<div class="cart-item-name">' + escapeHtml(item.name) + '</div>' +
        '<div class="cart-item-price">' + GMCart.formatPKR(item.price) + ' each</div>' +
      '</div>' +
      '<div class="cart-item-qty">' +
        '<button type="button" class="qty-btn" data-action="dec">−</button>' +
        '<span>' + item.qty + '</span>' +
        '<button type="button" class="qty-btn" data-action="inc">+</button>' +
      '</div>' +
      '<button type="button" class="cart-item-remove" aria-label="Remove item">' +
        '<svg><use href="#icon-trash"></use></svg>' +
      '</button>' +
    '</div>'
  );
}

function renderCart() {
  var cart = GMCart.getCart();
  var wrap = document.getElementById('cart-items');
  var empty = document.getElementById('cart-empty');
  var totalRow = document.getElementById('cart-total-row');
  var placeBtn = document.getElementById('place-order-btn');

  if (cart.length === 0) {
    wrap.innerHTML = '';
    empty.style.display = '';
    totalRow.style.display = 'none';
    if (placeBtn) placeBtn.disabled = true;
    return;
  }

  empty.style.display = 'none';
  totalRow.style.display = '';
  if (placeBtn) placeBtn.disabled = false;
  wrap.innerHTML = cart.map(cartItemHtml).join('');
  document.getElementById('cart-total-amount').textContent = GMCart.formatPKR(GMCart.totalPrice());

  wrap.querySelectorAll('.qty-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.closest('.cart-item').getAttribute('data-id');
      var item = GMCart.getCart().find(function (i) { return i.id === id; });
      if (!item) return;
      var newQty = btn.getAttribute('data-action') === 'inc' ? item.qty + 1 : item.qty - 1;
      GMCart.updateQty(id, newQty);
      renderCart();
    });
  });
  wrap.querySelectorAll('.cart-item-remove').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.closest('.cart-item').getAttribute('data-id');
      GMCart.removeItem(id);
      renderCart();
    });
  });
}

function updatePaymentInstructions() {
  var method = document.querySelector('input[name="payment"]:checked').value;
  document.getElementById('jazzcash-instructions').style.display = method === 'JazzCash' ? '' : 'none';
  document.getElementById('easypaisa-instructions').style.display = method === 'Easypaisa' ? '' : 'none';
}

document.addEventListener('DOMContentLoaded', function () {
  renderCart();

  document.querySelectorAll('input[name="payment"]').forEach(function (radio) {
    radio.addEventListener('change', updatePaymentInstructions);
  });

  var form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var cart = GMCart.getCart();
    if (cart.length === 0) return;

    var name = document.getElementById('co-name').value.trim();
    var phone = document.getElementById('co-phone').value.trim();
    var address = document.getElementById('co-address').value.trim();
    var city = document.getElementById('co-city').value.trim();
    var payment = document.querySelector('input[name="payment"]:checked').value;
    var total = GMCart.totalPrice();

    var order = {
      customerName: name,
      phone: phone,
      address: address,
      city: city,
      paymentMethod: payment,
      items: cart.map(function (i) { return { name: i.name, price: i.price, qty: i.qty }; }),
      total: total,
      status: 'new',
      createdAt: (typeof firebase !== 'undefined' && firebase.firestore)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : new Date().toISOString()
    };

    // Best-effort save to Firestore so it shows in the admin panel.
    // If Firebase isn't set up yet, this fails silently — the WhatsApp
    // message below is the real order and still goes through.
    if (typeof db !== 'undefined') {
      db.collection('orders').add(order).catch(function (err) {
        console.warn('Order not saved to Firestore (Firebase may not be configured yet):', err);
      });
    }

    var lines = [
      'New order from the website:',
      '',
      'Name: ' + name,
      'Phone: ' + phone,
      'Address: ' + address + ', ' + city,
      'Payment: ' + payment,
      '',
      'Items:'
    ];
    cart.forEach(function (i) {
      lines.push('- ' + i.name + ' x' + i.qty + ' — ' + GMCart.formatPKR(i.price * i.qty));
    });
    lines.push('');
    lines.push('Total: ' + GMCart.formatPKR(total));

    var waUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
    GMCart.clearCart();
    window.open(waUrl, '_blank');
    form.reset();
    renderCart();

    var note = document.querySelector('.checkout-note');
    if (note) {
      note.textContent = 'Order sent! WhatsApp should have opened in a new tab — hit send there to confirm with us.';
      note.style.color = 'var(--blue)';
      note.style.fontWeight = '600';
    }
  });
});
