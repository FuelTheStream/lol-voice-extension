const backendUrl = 'https://lol-voice-extension-server.onrender.com';

function showStatus(msg) {
  const statusEl = document.getElementById('config-status');
  if (statusEl) {
    statusEl.textContent = msg;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('config-form');
  const priceInput = document.getElementById('voiceLinePrice');

  fetch(`${backendUrl}/api/get-price`)
    .then(res => res.json())
    .then(data => {
      if (data.price !== undefined) {
        priceInput.value = data.price;
        showStatus('Loaded current price.');
      }
    })
    .catch(err => {
      console.error('Failed to load price:', err);
      showStatus('Failed to load current price.');
    });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const price = parseInt(priceInput.value, 10);
    if (!price || isNaN(price) || price < 1) {
      showStatus('Please enter a valid price.');
      return;
    }

    showStatus('Saving...');
    try {
      const res = await fetch(`${backendUrl}/api/set-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price })
      });
      const result = await res.json();
      if (result.success) {
        showStatus('Price saved!');
      } else {
        showStatus(result.message || 'Save failed.');
      }
    } catch (err) {
      console.error('Error saving price:', err);
      showStatus('Error saving price.');
    }
  });
});