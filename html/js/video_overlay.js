const backendDomain = 'lol-voice-extension-server.onrender.com';
const overlayStatus = document.getElementById('overlay-status');

// Use the absolute backend domain for the WebSocket connection
const ws = new WebSocket(`wss://${backendDomain}`);

ws.onopen = () => {
  overlayStatus.textContent = "Waiting for redemption...";
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'redeem') {
    overlayStatus.textContent = `Playing: ${data.champion}: ${data.lineLabel}`;
    const audioPlayer = new Audio(data.audioUrl);
    audioPlayer.play();
  }
};

ws.onerror = (err) => {
  overlayStatus.textContent = 'WebSocket error';
  console.error('WebSocket Error:', err);
};

ws.onclose = () => {
  overlayStatus.textContent = 'WebSocket disconnected';
};