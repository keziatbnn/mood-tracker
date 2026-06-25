document.addEventListener('DOMContentLoaded', () => {

  document
    .getElementById('resetForm')
    .addEventListener('submit', async (e) => {

      e.preventDefault();

      const email = document.getElementById('emailInput').value.trim();
      const msg = document.getElementById('message');
      const submitBtn = document.querySelector('#resetForm button[type="submit"]');

      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        SENDING...
      `;
      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-70', 'cursor-not-allowed');
      
      msg.innerHTML = ''; 

      try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: 'http://127.0.0.1:5500/pages/update-password.html'
          }
        );

        if (error) {
          msg.innerHTML = '<p style="color:red">' + error.message + '</p>';
        } else {
          msg.innerHTML = '<p style="color:green">A reset link has been successfully sent to your email.</p>';
          document.getElementById('resetForm').reset();
        }

      } catch (err) {
        msg.innerHTML = '<p style="color:red">Failed to send request. Check your connection.</p>';
      } finally {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
      }

    });

});