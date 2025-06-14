const twitch = window.Twitch.ext;

document.addEventListener('DOMContentLoaded', () => {
  const audio = new Audio();

  // Listen for broadcast messages from panel or backend
  twitch.listen('broadcast', (target, contentType, message) => {
    if (contentType === 'play') {
      const { url } = message;
      audio.src = url;
      audio.play().catch(err => console.error('Playback error:', err));
    }
  });
});
