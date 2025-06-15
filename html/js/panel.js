// The absolute URL of your backend server on Render
const backendUrl = 'https://lol-voice-extension-server.onrender.com';

function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function showStatus(message) {
  const status = document.getElementById('status');
  if (status) status.textContent = message;
}

async function initializePanel(config = {}) {
  const championSelect = document.getElementById('champion-select');
  const voiceLineSelect = document.getElementById('voice-line-select');
  const previewButton = document.getElementById('preview-button');
  const redeemButton = document.getElementById('redeem-button');
  const volumeRange = document.getElementById('volume-range');

  if (!championSelect || !voiceLineSelect || !previewButton || !redeemButton) {
    console.error('Missing required DOM elements');
    showStatus('Error: Missing required elements.');
    return;
  }

  championSelect.disabled = true;
  voiceLineSelect.disabled = true;
  previewButton.disabled = true;
  redeemButton.disabled = true;
  if (volumeRange) volumeRange.disabled = true;

  showStatus('Loading champion data...');

  let champions = {};
  try {
    // This fetch is correct because champions.json is hosted with the frontend
    const response = await fetch('assets/champions.json');
    if (!response.ok) throw new Error(`Failed to load champions.json: ${response.status}`);
    champions = await response.json();
  } catch (error) {
    console.error(error);
    showStatus('Error loading champion data.');
    return;
  }

  const enabledChampions = config.enabledChampions ?? Object.keys(champions);

  const fragment = document.createDocumentFragment();
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  defaultOption.textContent = 'Select a champion';
  fragment.appendChild(defaultOption);

  enabledChampions.forEach(champId => {
    if (champions[champId]) {
      const option = document.createElement('option');
      option.value = champId;
      option.textContent = capitalizeFirstLetter(champions[champId].name);
      fragment.appendChild(option);
    }
  });

  championSelect.appendChild(fragment);
  championSelect.disabled = false;
  if (volumeRange) volumeRange.disabled = false;

  championSelect.addEventListener('change', () => {
    const selectedId = championSelect.value;
    voiceLineSelect.innerHTML = '';
    previewButton.disabled = true;
    redeemButton.disabled = true;

    if (selectedId && champions[selectedId]) {
      const enabledVoiceLinesForChamp = config.enabledVoiceLines?.[selectedId] ?? [];

      const lineFragment = document.createDocumentFragment();
      const defaultLineOption = document.createElement('option');
      defaultLineOption.value = '';
      defaultLineOption.disabled = true;
      defaultLineOption.selected = true;
      defaultLineOption.textContent = 'Select a voice line';
      lineFragment.appendChild(defaultLineOption);

      champions[selectedId].lines.forEach(line => {
        if (enabledVoiceLinesForChamp.length === 0 || enabledVoiceLinesForChamp.includes(line.file)) {
          const option = document.createElement('option');
          option.value = line.file;
          option.textContent = line.label;
          lineFragment.appendChild(option);
        }
      });

      voiceLineSelect.appendChild(lineFragment);
      voiceLineSelect.disabled = false;
    } else {
      voiceLineSelect.disabled = true;
    }
  });

  voiceLineSelect.addEventListener('change', () => {
    const valid = !!voiceLineSelect.value;
    previewButton.disabled = !valid;
    redeemButton.disabled = !valid;
  });

  const audioPlayer = new Audio();
  audioPlayer.volume = volumeRange ? parseFloat(volumeRange.value) : 0.5;

  if (volumeRange) {
    volumeRange.addEventListener('input', () => {
      audioPlayer.volume = parseFloat(volumeRange.value);
    });
  }

  function getFullAudioUrl() {
    const championId = championSelect.value;
    // Assuming champion names in audio folder are lowercase
    const championName = champions[championId]?.name.toLowerCase();
    const voiceFile = voiceLineSelect.value;
    if (!championName || !voiceFile) return null;
    
    // Construct the URL based on the required folder structure, pointing to the backend
    return `${backendUrl}/audio/${championName}/${voiceFile}`;
  }

  previewButton.addEventListener('click', () => {
    const fullUrl = getFullAudioUrl();
    const champName = championSelect.options[championSelect.selectedIndex]?.text || '';
    const voiceLabel = voiceLineSelect.options[voiceLineSelect.selectedIndex]?.text || '';
    if (!fullUrl) return;

    showStatus(`Previewing: ${champName}: ${voiceLabel}`);
    audioPlayer.src = fullUrl;
    audioPlayer.play().catch(error => {
      console.error('Audio playback error:', error);
      showStatus('Error playing audio.');
    });
  });

  redeemButton.addEventListener('click', async () => {
    const fullUrl = getFullAudioUrl();
    const champName = championSelect.options[championSelect.selectedIndex]?.text || '';
    const voiceLabel = voiceLineSelect.options[voiceLineSelect.selectedIndex]?.text || '';

    if (!fullUrl) return;

    showStatus('Redeeming Channel Points...');

    try {
      const response = await fetch(`${backendUrl}/api/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          champion: champName,
          lineLabel: voiceLabel,
          audioUrl: fullUrl
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showStatus('Redemption successful! Voice line will play on stream.');
        } else {
          showStatus(data.message || 'Redemption failed.');
        }
      } else {
        showStatus('Redemption request failed.');
      }
    } catch (err) {
      showStatus('Error contacting backend.');
      console.error(err);
    }
  });

  showStatus('Select a champion to begin.');
}

document.addEventListener('DOMContentLoaded', () => {
  initializePanel({});
});