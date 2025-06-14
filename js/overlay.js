// Constants & UI elements
const categories = ['taunt','joke','laugh','death','attack','move','kill','cast'];
const ROLE_MAP = {
  Top: ['Fighter','Tank'],
  Jungle: ['Fighter','Tank','Assassin'],
  Mid: ['Mage','Assassin'],
  ADC: ['Marksman'],
  Support: ['Support'],
  All: []
};
const R2_BASE_URL = "https://your-r2-domain.com/voice-lines";
const clickSound = new Audio("../assets/click.mp3");

const searchInput = document.getElementById('search');
const suggestions = document.getElementById('champion-suggestions');
const champList = document.getElementById('champion-list');
const categoryContainer = document.getElementById('category-container');
const voiceLineContainer = document.getElementById('voice-line-container');
const spinner = document.getElementById('spinner');
const backButton = document.getElementById('back-button');
const themeToggle = document.getElementById('toggle-theme');
const roleFilters = document.querySelectorAll('#role-filters button');

let champions = [], currentChampion = null;

// Utility
const playClick = () => { clickSound.currentTime = 0; clickSound.play(); };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

// Show/Hide spinner
const showSpinner = () => spinner.classList.remove('hidden');
const hideSpinner = () => spinner.classList.add('hidden');

// Fetch champions + populate suggestions
async function fetchChampions() {
  showSpinner();
  try {
    const res = await fetch("https://ddragon.leagueoflegends.com/cdn/14.11.1/data/en_US/champion.json");
    const data = await res.json();
    champions = Object.values(data.data).map(c => ({
      id: c.id.toLowerCase(),
      name: c.id,
      tags: c.tags // Riot-defined tags
    })).sort((a,b) => a.id.localeCompare(b.id));
    updateSuggestions();
    renderChampionList();
  } catch (e) {
    console.error("Fetch champions failed:", e);
  }
  hideSpinner();
}

function updateSuggestions() {
  suggestions.innerHTML = '';
  champions.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    suggestions.appendChild(opt);
  });
}

// Render champions (with optional filter by role/search)
function renderChampionList(filter='', role='All') {
  currentChampion = null;
  backButton.classList.add('hidden');
  categoryContainer.classList.add('hidden');
  voiceLineContainer.classList.add('hidden');
  champList.classList.remove('hidden');
  champList.innerHTML = '';
  champions
    .filter(c => (!filter || c.id.includes(filter.toLowerCase())))
    .filter(c => role==='All' || ROLE_MAP[role].some(tag=>c.tags.includes(tag)))
    .forEach(c => champList.appendChild(createChampionButton(c)));
}

// Create champion card
function createChampionButton({id}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'champion-wrapper';
  wrapper.title = `Role: ${champions.find(x=>x.id===id).tags.join(', ')}`;

  const img = document.createElement('img');
  img.src = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${cap(id)}_0.jpg`;
  img.alt = id; img.className = 'champion-img';

  const btn = document.createElement('button');
  btn.textContent = cap(id);
  btn.onclick = () => {
    playClick(); currentChampion = id;
    showCategories(id);
  };

  wrapper.append(img, btn);
  return wrapper;
}

// Show category buttons
function showCategories(champ) {
  champList.classList.add('hidden');
  backButton.classList.remove('hidden');
  categoryContainer.innerHTML = '';
  categoryContainer.classList.remove('hidden');
  voiceLineContainer.classList.add('hidden');
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'category-button';
    btn.textContent = cap(cat);
    btn.title = `${cat.charAt(0).toUpperCase()+cat.slice(1)} lines`;
    btn.onclick = () => {
      playClick(); loadVoiceLines(champ, cat);
    };
    categoryContainer.appendChild(btn);
  });
}

// Load voice line buttons
function loadVoiceLines(champ, cat) {
  categoryContainer.classList.add('hidden');
  voiceLineContainer.innerHTML = '';
  voiceLineContainer.classList.remove('hidden');
  showSpinner();
  let found = false;
  for(let i=1;i<=5;i++){
    const suffix = i===1?'':i;
    const url = `${R2_BASE_URL}/${champ}/${cat}${suffix}.mp3`;
    const audio = new Audio(url);
    audio.oncanplaythrough = () => {
      found = true;
      hideSpinner();
      const btn = document.createElement('button');
      btn.className = 'voice-line-button';
      btn.textContent = `${cap(cat)}${suffix}`;
      btn.onclick = () => { playClick(); new Audio(url).play(); };
      voiceLineContainer.appendChild(btn);
    };
    audio.onerror = () => {
      if(i===1){
        // fallback to unnumbered
        const fb = `${R2_BASE_URL}/${champ}/${cat}.mp3`;
        const fba = new Audio(fb);
        fba.oncanplaythrough = () => {
          found = true;
          hideSpinner();
          const btn = document.createElement('button');
          btn.className = 'voice-line-button';
          btn.textContent = cap(cat);
          btn.onclick = () => { playClick(); new Audio(fb).play(); };
          voiceLineContainer.appendChild(btn);
        };
      }
      if(i===5 && !found){
        hideSpinner();
        voiceLineContainer.innerHTML = '<p>No lines found.</p>';
      }
    };
  }
}

// Back button
backButton.onclick = () => {
  playClick();
  if(voiceLineContainer.classList.contains('hidden')){
    renderChampionList(searchInput.value, [...roleFilters].find(b=>b.classList.contains('active'))?.dataset.role||'All');
  } else {
    showCategories(currentChampion);
  }
};

// Theme toggle
themeToggle.onclick = () => {
  const isLight = document.body.classList.toggle('light');
  themeToggle.textContent = isLight ? '🌞' : '🌙';
};

// Search
searchInput.addEventListener('input', e => renderChampionList(e.target.value));

// Role filters
roleFilters.forEach(btn => {
  btn.onclick = () => {
    playClick();
    roleFilters.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    renderChampionList(searchInput.value, btn.dataset.role);
  };
});

// PubSub
Twitch.ext.onAuthorized(() => {
  Twitch.ext.listen('broadcast', (_,__,msg) => {
    try {
      const {champion, category} = JSON.parse(msg);
      playClick(); currentChampion=champion;
      showCategories(champion); loadVoiceLines(champion, category);
    } catch(e){ console.error(e); }
  });
});

// Initial bootstrap
document.addEventListener('DOMContentLoaded', fetchChampions);
