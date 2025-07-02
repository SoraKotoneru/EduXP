document.addEventListener('DOMContentLoaded', async () => {
  // Выводим ник
  const usernameEl = document.getElementById('username');
  const username = localStorage.getItem('currentUsername') || 'Гость';
  usernameEl.textContent = username;

  // Контейнер для аватара
  const avatarContainer = document.getElementById('profile-avatar');

  // Порядок слоёв как в game.js
  const layerOrder = {
    background:     0,
    hair_back:      1,
    tail:           2,
    body:           3,
    eyes:           4,
    mouth:          4,
    face_accessory: 4,
    hair_strands:   5,
    bangs:          6,
    ears:           7,
    headwear:       8,
    shoes:          9,
    pants:          10,
    top:            11,
    dress:          10,
    jumpsuit:       10,
    coat:           12,
    accessory:      13,
    pet:            14
  };

  // Функция получения конфига аватара
  async function fetchAvatarConfig() {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/avatar', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      console.error('Ошибка загрузки конфига аватара');
      return [];
    }
    return res.json();
  }

  // Загружаем и отображаем
  try {
    const config = await fetchAvatarConfig();
    // Сортируем по порядку слоёв
    config.sort((a, b) => (layerOrder[a.category] || 0) - (layerOrder[b.category] || 0));
    config.forEach(item => {
      const img = document.createElement('img');
      // Формируем путь к изображению
      let src = `assets/сlothes/${item.category}/${item.itemId}`;
      if (item.color) {
        src += `_${item.color.slice(1)}`;
      }
      src += '.png';
      img.src = src;
      img.style.zIndex = layerOrder[item.category] || 0;
      avatarContainer.appendChild(img);
    });
  } catch (err) {
    console.error(err);
  }
}); 