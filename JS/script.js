// Режим работы: 'login' или 'register'
let mode = null;

// Показать нужную форму
function showForm(selectedMode) {
  mode = selectedMode;                             // запомним режим
  // Подсветка кнопки режима
  document.querySelectorAll('.toggle-button').forEach(btn => btn.classList.remove('selected'));
  const activeBtn = document.getElementById(selectedMode === 'register' ? 'btn-register' : 'btn-login');
  if (activeBtn) activeBtn.classList.add('selected');
  const form = document.getElementById('form-block');
  form.classList.remove('hidden');                 // показываем форму
  clearErrors();                                   // сбросим старые ошибки
  // очистим поля
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
}

// Убираем оформление ошибок
function clearErrors() {
  document.getElementById('username').classList.remove('input-error');
  document.getElementById('password').classList.remove('input-error');
  document.getElementById('username-error').classList.add('hidden');
  document.getElementById('password-error').classList.add('hidden');
}

// Проверка уникальности логина при регистрации
function checkUniqueLogin() {
  clearErrors();
  if (mode !== 'register') return;                 // только для режима регистрации

  const login = document.getElementById('username').value.trim();
  const users = JSON.parse(localStorage.getItem('users') || '{}');

  if (login && users[login]) {
    // если такой логин уже есть
    document.getElementById('username').classList.add('input-error');
    const err = document.getElementById('username-error');
    err.textContent = 'Придумайте другой логин';
    err.classList.remove('hidden');
  }
}

// Обработка нажатия «Отправить»
function handleSubmit() {
  clearErrors();

  const loginEl = document.getElementById('username');
  const passEl  = document.getElementById('password');
  const login   = loginEl.value.trim();
  const pass    = passEl.value.trim();

  if (!login || !pass) {
    // можно добавить сообщения про обязательность полей
    return;
  }

  const users = JSON.parse(localStorage.getItem('users') || '{}');

  if (mode === 'register') {
    // Регистрация: логин должен быть уникальным
    if (users[login]) {
      // ошибка уже показывается в checkUniqueLogin
      return;
    }
    // сохраняем нового пользователя
    users[login] = pass;
    localStorage.setItem('users', JSON.stringify(users));

    // авторизуем сразу же и переходим в игру
    localStorage.setItem('currentUser', login);
    window.location.href = 'game.html';
    return;
  }

  if (mode === 'login') {
    // Вход: проверяем наличие и совпадение пароля
    if (!users[login] || users[login] !== pass) {
      loginEl.classList.add('input-error');
      passEl.classList.add('input-error');
      const err1 = document.getElementById('username-error');
      const err2 = document.getElementById('password-error');
      err1.textContent = 'Неверный логин или пароль';
      err2.textContent = 'Неверный логин или пароль';
      err1.classList.remove('hidden');
      err2.classList.remove('hidden');
      return;
    }
    // успешный вход → редирект
    localStorage.setItem('currentUser', login);
    window.location.href = 'game.html';
  }
}
