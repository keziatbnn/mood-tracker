if (!document.querySelector('link[href*="Poppins"]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
  document.head.appendChild(link);
}

function getActivePage() {
  return window.location.pathname.split('/').pop() || 'index.html';
}

function renderAuthNavbar() {
  const currentPage = getActivePage();

  const loginClass  = currentPage === 'login.html'    ? 'bg-white shadow-sm' : '';
  const signupClass = currentPage === 'register.html' ? 'bg-white shadow-sm' : '';

  return `
<nav class="bg-pink-bg border-b border-nav-border px-8 flex items-center justify-between h-16">

  <!-- Brand -->
  <a href="index.html" class="flex items-center gap-2 no-underline">
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="13" stroke="#1F915A" stroke-width="1.5"/>
      <circle cx="10" cy="12" r="1.5" fill="#1F915A"/>
      <circle cx="18" cy="12" r="1.5" fill="#1F915A"/>
      <path d="M9 17.5 Q14 22 19 17.5" stroke="#1F915A" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    </svg>
    <span class="text-primary font-bold text-xl tracking-tight">MoodTracker</span>
  </a>

  <!-- Auth Buttons -->
  <div class="flex items-center gap-2">
    <a href="login.html"
       class="px-5 py-2 rounded-2xl text-primary font-medium text-sm no-underline hover:bg-primary-light transition-colors ${loginClass}">
      Log In
    </a>
    <a href="register.html"
       class="px-5 py-2 rounded-2xl text-primary font-medium text-sm no-underline hover:bg-primary-light transition-colors ${signupClass}">
      Sign Up
    </a>
  </div>

</nav>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const navbarEl = document.getElementById('navbar');
  if (!navbarEl) return;
  navbarEl.innerHTML = renderAuthNavbar();
});
