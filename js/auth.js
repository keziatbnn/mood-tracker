document.addEventListener('DOMContentLoaded', async () => {
  const currentPath = window.location.pathname;

  const authPages = ['login.html', 'register.html', 'forgot-password.html'];
  const protectedPages = ['home.html', 'entries.html', 'calendar.html', 'statistics.html', 'account.html'];

  const isAuthPage = authPages.some(page => currentPath.includes(page));
  const isProtectedPage = protectedPages.some(page => currentPath.includes(page));

  const { data: { session } } = await supabaseClient.auth.getSession();

  if (session && isAuthPage) {
    window.location.replace('home.html');
  } else if (!session && isProtectedPage) {
    window.location.replace('login.html');
  }
});