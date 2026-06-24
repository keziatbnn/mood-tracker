document.addEventListener('DOMContentLoaded', () => {

  document
    .getElementById('resetForm')
    .addEventListener('submit', async (e) => {

      e.preventDefault();

      const email =
        document.getElementById('emailInput').value.trim();

      const { error } =
        await supabaseClient.auth.resetPasswordForEmail(
          email,
          {
            redirectTo:
              'http://127.0.0.1:5500/pages/update-password.html'
          }
        );

      const msg =
        document.getElementById('message');

      if (error) {

        msg.innerHTML =
          '<p style="color:red">' +
          error.message +
          '</p>';

      } else {

        msg.innerHTML =
          '<p style="color:green">' +
          'Reset link berhasil dikirim ke email.' +
          '</p>';

      }

    });

});