// waveform.js — Entry point: initializes form events and handles export

import { initFormEvents } from './form.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all form listeners and initial render
  initFormEvents();

  // Export button & preview card container
  const exportBtn = document.getElementById('export-btn');
  const card      = document.getElementById('card-preview');

  if (exportBtn && card) {
    // waveform.js — Export tweaks for rounded PNG

exportBtn.addEventListener('click', () => {
    card.classList.add('exporting');
  
    html2canvas(card, {
      useCORS: true,
      backgroundColor: null,  // <— transparent corners
      scale: 2
    }).then(canvas => {
      card.classList.remove('exporting');
  
      const link = document.createElement('a');
      link.download = `${document.querySelector('.pokemon-name').textContent}.png`;
      link.href     = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }).catch(err => {
      console.error('Export failed:', err);
      card.classList.remove('exporting');
    });
  });
  
      
  }
});
