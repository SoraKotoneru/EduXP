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

// Проверка уникальности логина только по API при регистрации
async function checkUniqueLogin() {
  clearErrors();
  if (mode !== 'register') return;
  const username = document.getElementById('username').value.trim();
  if (!username) return;
  try {
    const res = await fetch(`/api/auth/check/${encodeURIComponent(username)}`);
    if (res.ok) {
      const { exists } = await res.json();
      if (exists) {
        const loginEl = document.getElementById('username');
        loginEl.classList.add('input-error');
        const err = document.getElementById('username-error');
        err.textContent = 'Придумайте другой логин';
        err.classList.remove('hidden');
      }
    }
  } catch (e) {
    console.error(e);
  }
}

// Обработка нажатия "Отправить"
async function handleSubmit() {
  clearErrors();
  const loginEl = document.getElementById('username');
  const passEl  = document.getElementById('password');
  const username = loginEl.value.trim();
  const password = passEl.value.trim();
  // Admin login bypass
  if (username === 'SoraKotoneru' && password === 'ghbywtccf@3141') {
    // Сохраняем cookie для админки и делаем редирект
    document.cookie = `adminAuth=${btoa(username + ':' + password)}; path=/admin`;
    window.location.href = 'admin/index.html';
    return;
  }
  // Валидация ника: только кириллица, латиница, цифры, нет пробелов, до 20 символов
  const usernameRegex = /^[A-Za-z\u0400-\u04FF0-9]{1,20}$/u;
  if (!usernameRegex.test(username)) {
    loginEl.classList.add('input-error');
    const err1 = document.getElementById('username-error');
    err1.textContent = 'Ник должен быть до 20 символов, без пробелов, только буквы и цифры';
    err1.classList.remove('hidden');
    return;
  }
  // Проверка на заполненность полей
  if (!username || !password) {
    return;
  }
  try {
    let token;
    if (mode === 'register') {
      const reg = await fetch('/api/auth/register', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username,password})
      });
      if (reg.status === 409) {
        // При регистрации показываем ошибку только под полем логин
        loginEl.classList.add('input-error');
        const err1 = document.getElementById('username-error');
        err1.textContent = 'Логин занят';
        err1.classList.remove('hidden');
        return;
      }
      // После успешной регистрации сразу логинимся
    }
    // Входим или после регистрации
    const res = await fetch('/api/auth/login', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username,password})
    });
    const data = await res.json();
    if (!res.ok) {
      // Показываем ошибку только под полем пароля
      passEl.classList.add('input-error');
      const err2 = document.getElementById('password-error');
      err2.textContent = 'Неверный логин или пароль';
      err2.classList.remove('hidden');
      return;
    }
    token = data.token;
    // Сохраняем токен и userId для фильтрации приватных предметов
    localStorage.setItem('token', token);
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      localStorage.setItem('currentUser', String(payload.userId));
      // Сохраняем ник пользователя для отображения в игре
      localStorage.setItem('currentUsername', username);
    } catch {
      console.warn('Не удалось разобрать userId из токена');
    }
    // После успешного логина: если админ, направляем в админку и ставим JWT cookie, иначе в игру
    if (data.isAdmin) {
      // устанавливаем JWT в cookie для доступа к /admin
      document.cookie = `token=${token}; path=/admin`;
      window.location.href = 'admin/index.html';
    } else {
      window.location.href = 'game.html';
    }
  } catch (e) {
    console.error(e);
  }
}

// Назначаем события на кнопки
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-register').addEventListener('click', ()=>showForm('register'));
  document.getElementById('btn-login').addEventListener('click', ()=>showForm('login'));
  document.getElementById('username').addEventListener('input', checkUniqueLogin);
  document.getElementById('submit-btn').addEventListener('click', handleSubmit);
});
