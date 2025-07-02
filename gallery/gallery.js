document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('gallery-container');
  const countEl = document.getElementById('gallery-count');
  container.innerHTML = '';
  const token = localStorage.getItem('token');
  try {
    // Запрашиваем все аватары (только для админа)
    const res = await fetch('/api/avatar/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Ошибка загрузки галереи');
    const data = await res.json(); // [{ userId, username, avatarConfig }]
    // Обновляем количество
    if (countEl) countEl.textContent = data.length;
    // Порядок слоёв
    const layerOrder = {
      background: 0, hair_back: 1, tail: 2, body: 3, eyes: 4,
      mouth: 4, face_accessory: 4, hair_strands: 5, bangs: 6,
      ears: 7, headwear: 8, shoes: 9, pants: 10, top: 11,
      dress: 10, jumpsuit: 10, coat: 12, accessory: 13, pet: 14
    };
    data.forEach((user, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'gallery-avatar';
      // Сортируем слои и создаём изображения
      const config = Array.isArray(user.avatarConfig) ? user.avatarConfig : [];
      config.sort((a, b) => (layerOrder[a.category] || 0) - (layerOrder[b.category] || 0));
      config.forEach(cfg => {
        const img = document.createElement('img');
        let src = `/assets/сlothes/${cfg.category}/${cfg.itemId}`;
        if (cfg.color) src += `_${cfg.color.slice(1)}`;
        img.src = src + '.png';
        img.style.zIndex = layerOrder[cfg.category] || 0;
        avatarDiv.appendChild(img);
      });
      const label = document.createElement('div');
      label.textContent = user.username;
      label.className = 'username';
      item.appendChild(avatarDiv);
      item.appendChild(label);
      container.appendChild(item);
      // Обработчик открытия lightbox
      item.addEventListener('click', () => openLightbox(index));
    });
    // Функции lightbox
    let galleryData = data;
    let currentIndex = 0;
    function openLightbox(index) {
      currentIndex = index;
      renderLightbox();
      document.getElementById('lightbox').classList.remove('hidden');
    }
    function closeLightbox() {
      document.getElementById('lightbox').classList.add('hidden');
      document.getElementById('lightbox-avatar').innerHTML = '';
    }
    function renderLightbox() {
      const avatarContainer = document.getElementById('lightbox-avatar');
      avatarContainer.innerHTML = '';
      const user = galleryData[currentIndex];
      const config = Array.isArray(user.avatarConfig) ? user.avatarConfig : [];
      config.sort((a,b) => (layerOrder[a.category]||0)-(layerOrder[b.category]||0));
      config.forEach(cfg => {
        const img = document.createElement('img');
        let src = `/assets/сlothes/${cfg.category}/${cfg.itemId}`;
        if (cfg.color) src += `_${cfg.color.slice(1)}`;
        img.src = src + '.png';
        img.style.zIndex = layerOrder[cfg.category] || 0;
        avatarContainer.appendChild(img);
      });
      // Показываем ник пользователя
      const usernameEl = document.getElementById('lightbox-username');
      if (usernameEl) usernameEl.textContent = user.username;
    }
    // Обработчики навигации
    document.getElementById('lightbox-prev').addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + galleryData.length) % galleryData.length;
      renderLightbox();
    });
    document.getElementById('lightbox-next').addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % galleryData.length;
      renderLightbox();
    });
    document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
    // Закрытие по ESC
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeLightbox();
    });
  } catch (err) {
    console.error(err);
    container.textContent = 'Не удалось загрузить галерею';
  }
});
