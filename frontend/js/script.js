document.addEventListener('DOMContentLoaded', function() {
  const dz = document.getElementById('dropzone');
  const fi = document.getElementById('fileInput');
  const statusEl = document.getElementById('status');
  const resultEl = document.getElementById('result');
  const progressEl = document.querySelector('.progress');

  // Configurer l'URL de l'API selon l'environnement
  const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api/audio' 
    : 'https://audiolab.onrender.com/api/audio';

  function setStatus(msg, isError = false) {
    statusEl.textContent = msg;
    statusEl.style.color = isError ? 'var(--error-color)' : 'white';
  }

  function setProgress(percent) {
    progressEl.style.width = `${percent}%`;
    progressEl.style.backgroundColor = percent === 100 ? 'var(--success-color)' : 'var(--primary-color)';
  }

  function setResultLink(url, name) {
    resultEl.innerHTML = '';
    const a = document.createElement('a');
    a.href = url;
    a.download = name || 'audio_traite.mp3';
    a.innerHTML = `<i class="fas fa-download"></i> Télécharger "${name}"`;
    a.classList.add('download-btn');
    resultEl.appendChild(a);
    a.style.animation = 'fadeInUp 0.5s ease';
  }

  // Gestionnaires d'événements
  dz.addEventListener('click', () => fi.click());
  
  dz.addEventListener('dragover', (e) => {
    e.preventDefault();
    dz.classList.add('dragover');
  });

  dz.addEventListener('dragleave', () => {
    dz.classList.remove('dragover');
  });

  dz.addEventListener('drop', (e) => {
    e.preventDefault();
    dz.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });

  fi.addEventListener('change', (e) => {
    if (fi.files.length) {
      handleFileUpload(fi.files[0]);
    }
  });

  async function handleFileUpload(file) {
    setProgress(0);
    resultEl.innerHTML = '';
    
    // Validation du fichier
    if (file.type !== 'audio/mpeg' && !file.name.toLowerCase().endsWith('.mp3')) {
      setStatus('❌ Seuls les fichiers MP3 sont acceptés', true);
      return;
    }

    if (file.size > 20 * 1024 * 1024) { // 20MB
      setStatus('❌ Fichier trop volumineux (max 20MB)', true);
      return;
    }

    setStatus(`Envoi de "${file.name}"...`);
    setProgress(30);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/process`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur du serveur');
      }

      setProgress(80);
      const data = await response.json();

      setStatus('Traitement terminé ✅');
      setProgress(100);
      
      // Construire l'URL complète pour le téléchargement
      const downloadUrl = data.data.download_url.startsWith('http')
        ? data.data.download_url
        : `${window.location.origin}${data.data.download_url}`;
      
      setResultLink(downloadUrl, data.data.output_name);
    } catch (error) {
      console.error('Erreur:', error);
      setStatus(`❌ ${error.message}`, true);
      setProgress(0);
    }
  }

  // Animation CSS dynamique
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .download-btn {
      display: inline-block;
      background: var(--success-color);
      color: white;
      padding: 1rem 2rem;
      border-radius: 50px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0, 184, 148, 0.3);
      margin-top: 1rem;
    }
    .download-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 184, 148, 0.4);
    }
  `;
  document.head.appendChild(style);
});