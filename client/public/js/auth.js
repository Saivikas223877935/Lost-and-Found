// public/js/auth.js
// Global helpers exposed on window so pages can use them without ES modules.
(function () {
  // --- API base detection ---
  var origin = '';
  try { origin = window.location.origin || ''; } catch (_) {}
  var API_BASE = origin && origin.startsWith('http') ? origin : 'http://localhost:8080';

  // --- Small UI helpers ---
  function setBtnLoading(btnEl, isLoading) {
    if (!btnEl) return;
    if (isLoading) {
      btnEl.disabled = true;
      btnEl.dataset.original = btnEl.innerHTML;
      btnEl.innerHTML = '<i class="material-icons left">hourglass_empty</i>Working...';
    } else {
      btnEl.disabled = false;
      if (btnEl.dataset.original) btnEl.innerHTML = btnEl.dataset.original;
    }
  }

  // --- Token helpers ---
  function getToken() {
    return localStorage.getItem('token') || '';
  }
  function isLoggedIn() {
    return !!getToken();
  }
  function authHeaders() {
    var token = getToken();
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  // --- Where is "Home"? Works for both http:// and file:// usage
  function redirectHome() {
    try {
      if (window.location.protocol === 'file:') {
        // Open the local file
        window.location.href = 'index.html';
      } else {
        // Served by Express/static server
        window.location.href = '/';
      }
    } catch (_) {
      // Last resort
      window.location.href = 'index.html';
    }
  }

  function wireLogout(linkEl) {
    if (!linkEl) return;
    linkEl.addEventListener('click', function (e) {
      // Always prevent default so we control the destination
      e.preventDefault();
      // Clear auth
      localStorage.removeItem('token');
      if (window.M && M.toast) M.toast({ html: 'Logged out' });
      // Optionally update the nav immediately
      updateNavAuthState();
      // Redirect home
      redirectHome();
    });
  }

  // --- Update nav based on auth ---
  async function updateNavAuthState() {
    var navAuth = document.getElementById('nav-auth');     // container with Login link(s)
    var navLogout = document.getElementById('nav-logout'); // container with Logout link
    var logoutBtn = document.getElementById('logoutBtn');  // actual <a> for logout

    if (isLoggedIn()) {
      if (navAuth)  navAuth.style.display = 'none';
      if (navLogout) navLogout.style.display = '';
    } else {
      if (navAuth)  navAuth.style.display = '';
      if (navLogout) navLogout.style.display = 'none';
    }

    // Wire the logout click every time in case DOM changes
    wireLogout(logoutBtn);
  }

  // expose to global
  window.API_BASE = API_BASE;
  window.setBtnLoading = setBtnLoading;
  window.getToken = getToken;
  window.isLoggedIn = isLoggedIn;
  window.authHeaders = authHeaders;
  window.updateNavAuthState = updateNavAuthState;
  window.redirectHome = redirectHome;

  document.addEventListener('DOMContentLoaded', function () {
    // Ensure any existing logout links are wired
    updateNavAuthState();
    // Also wire any element with data-logout just in case you add more buttons
    var extraLogoutLinks = document.querySelectorAll('[data-logout]');
    extraLogoutLinks.forEach(wireLogout);
  });
})();
