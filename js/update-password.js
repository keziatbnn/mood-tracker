document
.getElementById('updatePasswordForm')
.addEventListener('submit', async (e) => {

```
e.preventDefault();

const newPassword =
  document.getElementById('newPassword').value;

const { data, error } =
  await supabaseClient.auth.updateUser({
    password: newPassword
  });

if (error) {
  console.error(error);
  alert(error.message);
  return;
}

alert('Password berhasil diubah');

window.location.href = 'login.html';
```

});
