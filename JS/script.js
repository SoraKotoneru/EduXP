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
  // Если пользователя не существует или пароль не совпадает
  if (!users[login] || users[login] !== pass) {
    document.getElementById('username').classList.add('input-error');
    document.getElementById('password').classList.add('input-error');

    const err1 = document.getElementById('username-error');
    const err2 = document.getElementById('password-error');
    err1.textContent = 'Неверный логин или пароль';
    err2.textContent = 'Неверный логин или пароль';
    err1.classList.remove('hidden');
    err2.classList.remove('hidden');
    return;
  }

  // Сохраняем имя вошедшего пользователя в браузере
  localStorage.setItem('currentUser', login);

  // Переходим на игру
  window.location.href = "game.html";
}

