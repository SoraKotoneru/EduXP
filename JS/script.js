let mode = null; // 'login' или 'register'

function showForm(selectedMode) {
  mode = selectedMode;
  document.getElementById('form-block').classList.remove('hidden');

  // Сброс
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  clearErrors();
}

function clearErrors() {
  document.getElementById('username').classList.remove('input-error');
  document.getElementById('password').classList.remove('input-error');
  document.getElementById('username-error').classList.add('hidden');
  document.getElementById('password-error').classList.add('hidden');
}

function handleSubmit() {
  clearErrors();

  const login = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();

  if (!login || !pass) return;

  const users = JSON.parse(localStorage.getItem('users') || '{}');

  if (mode === 'register') {
    if (users[login]) {
      document.getElementById('username').classList.add('input-error');
      const err = document.getElementById('username-error');
      err.textContent = 'Придумайте другой логин';
      err.classList.remove('hidden');
      return;
    }
    users[login] = pass;
    localStorage.setItem('users', JSON.stringify(users));
    alert('Успешно зарегистрировано');
  }

  if (mode === 'login') {
    if (!users[login] || users[login] !== pass) {
      document.getElementById('username').classList.add('input-error');
      document.getElementById('password').classList.add('input-error');
      document.getElementById('username-error').textContent = 'Неверный логин или пароль';
      document.getElementById('username-error').classList.remove('hidden');
      document.getElementById('password-error').textContent = 'Неверный логин или пароль';
      document.getElementById('password-error').classList.remove('hidden');
      return;
    }
    alert('Успешный вход');
  }
}
