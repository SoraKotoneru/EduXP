let mode = null;

function showForm(selectedMode) {
  mode = selectedMode;
  document.getElementById('form-block').classList.remove('hidden');

  // Сброс полей
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
