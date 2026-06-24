document
  .getElementById('updatePasswordForm')
  .addEventListener('submit', async (e) => {

    e.preventDefault();

    const password =
      document.getElementById('newPassword').value;

    const { error } =
      await supabaseClient.auth.updateUser({
        password
      });

    if (error) {

      alert(error.message);

    } else {

      alert('Password berhasil diubah');

      window.location.href =
        'login.html';

    }

});