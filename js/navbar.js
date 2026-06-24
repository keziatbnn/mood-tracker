const navHTML = `
<nav class="w-full bg-pink-bg border-b border-nav-border px-6 lg:px-8 py-3 lg:py-0 lg:h-16 flex flex-wrap items-center justify-between relative z-50">

  <a href="home.html" class="flex items-center gap-2 no-underline">
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="13" stroke="#1F915A" stroke-width="1.5"/>
      <circle cx="10" cy="12" r="1.5" fill="#1F915A"/>
      <circle cx="18" cy="12" r="1.5" fill="#1F915A"/>
      <path d="M9 17.5 Q14 22 19 17.5" stroke="#1F915A" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    </svg>
    <span class="text-primary font-bold text-xl tracking-tight">MoodTracker</span>
  </a>

  <button id="mobile-menu-btn" class="lg:hidden text-primary hover:opacity-75 focus:outline-none p-1">
    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
    </svg>
  </button>

  <div id="nav-content" class="hidden w-full lg:flex lg:flex-1 lg:w-auto lg:items-center lg:justify-between flex-col lg:flex-row gap-4 lg:gap-2 mt-4 lg:mt-0 pb-4 lg:pb-0">
    
    <div class="flex gap-2 flex-col lg:flex-row lg:flex-1 lg:justify-center">
      <a href="home.html" class="nav-link px-5 py-2 rounded-2xl text-primary font-medium text-sm no-underline hover:bg-white lg:hover:bg-primary-light transition-colors text-center">
        Home
      </a>
      <a href="entries.html" class="nav-link px-5 py-2 rounded-2xl text-primary font-medium text-sm no-underline hover:bg-white lg:hover:bg-primary-light transition-colors text-center">
        Entries
      </a>
      <a href="calendar.html" class="nav-link px-5 py-2 rounded-2xl text-primary font-medium text-sm no-underline hover:bg-white lg:hover:bg-primary-light transition-colors text-center">
        Calendar
      </a>
      <a href="statistics.html" class="nav-link px-5 py-2 rounded-2xl text-primary font-medium text-sm no-underline hover:bg-white lg:hover:bg-primary-light transition-colors text-center">
        Statistic
      </a>
    </div>

    <a href="account.html" class="flex items-center justify-center lg:justify-start gap-3 mt-2 lg:mt-0 pt-4 lg:pt-0 border-t border-[#1F915A20] lg:border-none">
      <span class="text-primary font-semibold text-sm" id="nav-username">Name</span>
      <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold relative overflow-hidden">
        <img id="nav-avatar-img" class="w-full h-full object-cover hidden" src="" alt="Profile">
        <span id="nav-avatar">N</span>
      </div>
    </a>
    
  </div>
</nav>`;

// Load Poppins Font
if (!document.querySelector('link[href*="Poppins"]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
  document.head.appendChild(link);
}

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('navbar').innerHTML = navHTML;

  // Logika interaksi Hamburger Menu untuk Mobile
  const menuBtn = document.getElementById('mobile-menu-btn');
  const navContent = document.getElementById('nav-content');
  
  if (menuBtn && navContent) {
    menuBtn.addEventListener('click', () => {
      navContent.classList.toggle('hidden');
      navContent.classList.toggle('flex');
    });
  }

  // Efek highlight untuk link halaman aktif
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    const linkPath = link.getAttribute('href');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (linkPath === currentPage) {
      link.classList.add('bg-white', 'shadow-sm');
    }
  });

  // Fetch data user dari Supabase
  if (typeof supabaseClient !== 'undefined') {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
      const name = user.user_metadata?.full_name || user.email.split('@')[0];
      const avatarUrl = user.user_metadata?.avatar_url || null;
      navSetUser(name, avatarUrl);
    }
  }
});

// Helper global — bisa dipanggil dari account.js setelah update
function navSetUser(name, avatarUrl) {
  const navUsername = document.getElementById('nav-username');
  const navAvatarImg = document.getElementById('nav-avatar-img');
  const navAvatar = document.getElementById('nav-avatar');

  if (navUsername) navUsername.textContent = name;

  if (avatarUrl) {
    if (navAvatarImg) {
      navAvatarImg.src = avatarUrl;
      navAvatarImg.classList.remove('hidden');
    }
    if (navAvatar) navAvatar.classList.add('hidden');
  } else {
    if (navAvatarImg) {
      navAvatarImg.classList.add('hidden');
    }
    if (navAvatar) {
      navAvatar.textContent = name.charAt(0).toUpperCase();
      navAvatar.classList.remove('hidden');
    }
  }
}