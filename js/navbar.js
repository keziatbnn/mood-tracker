const navHTML = `
<nav class="bg-pink-bg border-b border-nav-border px-8 flex items-center h-16 gap-8">

  <!-- Brand -->
  <a href="home.html" class="flex items-center gap-2 no-underline">
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="13" stroke="#1F915A" stroke-width="1.5"/>
      <circle cx="10" cy="12" r="1.5" fill="#1F915A"/>
      <circle cx="18" cy="12" r="1.5" fill="#1F915A"/>
      <path d="M9 17.5 Q14 22 19 17.5" stroke="#1F915A" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    </svg>
    <span class="text-primary font-bold text-xl tracking-tight">MoodTracker</span>
  </a>

  <!-- Nav links -->
  <div class="flex gap-2 flex-1 justify-center">
    <a href="home.html"
       class="nav-link px-5 py-2 rounded-2xl text-primary font-medium text-sm no-underline hover:bg-primary-light transition-colors">
      Home
    </a>
    <a href="entries.html"
       class="nav-link px-5 py-2 rounded-2xl text-primary font-medium text-sm no-underline hover:bg-primary-light transition-colors">
      Entries
    </a>
    <a href="calendar.html"
       class="nav-link px-5 py-2 rounded-2xl text-primary font-medium text-sm no-underline hover:bg-primary-light transition-colors">
      Calendar
    </a>
    <a href="statistics.html"
       class="nav-link px-5 py-2 rounded-2xl text-primary font-medium text-sm no-underline hover:bg-primary-light transition-colors">
      Statistic
    </a>
  </div>

  <!-- User -->
  <a href="account.html" 
    class="flex items-center gap-3">
    <span class="text-primary font-semibold text-sm" id="nav-username">Name</span>
    <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold" id="nav-avatar">N</div>
  </a>

</nav>`;

if (!document.querySelector('link[href*="Poppins"]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
  document.head.appendChild(link);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('navbar').innerHTML = navHTML;

  // Active link highlight
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    const linkPath = link.getAttribute('href');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (linkPath === currentPage) {
      link.classList.add('bg-white', 'shadow-sm');
    }
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.name) {
    document.getElementById('nav-username').textContent = user.name;
    document.getElementById('nav-avatar').textContent = user.name.charAt(0).toUpperCase();
  }
});