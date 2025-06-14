const twitch = window.Twitch.ext;

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('config-app')) {
    // --- Config View Logic ---
    const input = document.getElementById('reward-cost');
    const saveBtn = document.getElementById('save-btn');
    const status = document.getElementById('status');

    twitch.onAuthorized(() => {
      const config = twitch.configuration.broadcaster?.content;
      if (config) {
        try {
          const parsed = JSON.parse(config);
          if (parsed.rewardCost != null) {
            input.value = parsed.rewardCost;
          }
        } catch {}
      }
    });

    saveBtn.addEventListener('click', () => {
      const cost = parseInt(input.value, 10) || 0;
      const payload = JSON.stringify({ rewardCost: cost });
      // version "1" of broadcaster config namespace
      twitch.configuration.set('broadcaster', '1', payload);
      status.textContent = 'Saved!';
    });

  } else {
    // --- Panel View Logic ---
    const champSel = document.getElementById('champion-select');
    const catSel = document.getElementById('category-select');
    const playBtn = document.getElementById('play-btn');
    let champions = [];

    fetch('./assets/champions.json')
      .then(r => r.json())
      .then(data => {
        champions = data;
        data.forEach(champ => {
          const opt = document.createElement('option');
          opt.value = champ.id;
          opt.textContent = champ.name;
          champSel.appendChild(opt);
        });
        updateCategories();
      });

    champSel.addEventListener('change', updateCategories);

    function updateCategories() {
      const chap = champions.find(c => c.id === champSel.value);
      catSel.innerHTML = '';
      Object.keys(chap.categories).forEach(cat => {
        const o = document.createElement('option');
        o.value = cat;
        o.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        catSel.appendChild(o);
      });
    }

    playBtn.addEventListener('click', () => {
      const champ = champions.find(c => c.id === champSel.value);
      const cat = catSel.value;
      const files = champ.categories[cat];
      const choice = files[Math.floor(Math.random() * files.length)];
      // files in JSON should be full URLs
      twitch.send('broadcast', 'play', { url: choice });
    });
  }
});
