// GM Electronics — cart utilities (shared by every page)
// Cart lives in localStorage on the visitor's own browser/device.

var GMCart = (function () {
  var KEY = 'gm_cart';

  function getCart() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch (e) { /* storage unavailable — fail silently */ }
    updateBadge();
  }

  function addItem(product, qty) {
    qty = qty || 1;
    var cart = getCart();
    var existing = cart.find(function (i) { return i.id === product.id; });
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.priceRetail,
        image: product.imageUrl || '',
        qty: qty
      });
    }
    saveCart(cart);
  }

  function updateQty(id, qty) {
    var cart = getCart();
    var item = cart.find(function (i) { return i.id === id; });
    if (!item) return;
    if (qty <= 0) {
      cart = cart.filter(function (i) { return i.id !== id; });
    } else {
      item.qty = qty;
    }
    saveCart(cart);
  }

  function removeItem(id) {
    var cart = getCart().filter(function (i) { return i.id !== id; });
    saveCart(cart);
  }

  function clearCart() {
    saveCart([]);
  }

  function totalCount() {
    return getCart().reduce(function (sum, i) { return sum + i.qty; }, 0);
  }

  function totalPrice() {
    return getCart().reduce(function (sum, i) { return sum + (i.price * i.qty); }, 0);
  }

  function formatPKR(n) {
    return 'Rs. ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function updateBadge() {
    var el = document.getElementById('cart-count');
    if (!el) return;
    var count = totalCount();
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  }

  document.addEventListener('DOMContentLoaded', updateBadge);

  return {
    getCart: getCart,
    addItem: addItem,
    updateQty: updateQty,
    removeItem: removeItem,
    clearCart: clearCart,
    totalCount: totalCount,
    totalPrice: totalPrice,
    formatPKR: formatPKR,
    updateBadge: updateBadge
  };
})();
