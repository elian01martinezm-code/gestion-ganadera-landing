let animals = [
  {chapeta:"CH-0118", nombre:"Lucero", finca:"La Esperanza", raza:"Brahman", sexo:"H", peso:382, estado:"Sano"},
  {chapeta:"CH-0119", nombre:"Trueno", finca:"El Roble", raza:"Cebú", sexo:"M", peso:410, estado:"Sano"},
  {chapeta:"CH-0204", nombre:"Canela", finca:"Santa Rita", raza:"Holstein", sexo:"H", peso:295, estado:"Tratamiento"},
  {chapeta:"CH-0231", nombre:"Tormenta", finca:"La Esperanza", raza:"Brahman", sexo:"M", peso:455, estado:"Sano"},
  {chapeta:"CH-0250", nombre:"Estrella", finca:"Los Naranjos", raza:"Pardo Suizo", sexo:"H", peso:340, estado:"Cuarentena"},
  {chapeta:"CH-0262", nombre:"Relámpago", finca:"El Roble", raza:"Cebú", sexo:"M", peso:398, estado:"Sano"},
];

const grid = document.getElementById('grid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const filterFinca = document.getElementById('filterFinca');
const filterSexo = document.getElementById('filterSexo');
const filterEstado = document.getElementById('filterEstado');
const resultCount = document.getElementById('resultCount');
const overlay = document.getElementById('overlay');
const form = document.getElementById('animalForm');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');
const voiceBtn = document.getElementById('voiceBtn');
let recognition = null;
let isListening = false;

function refreshFincaOptions(){
  const fincas = [...new Set(animals.map(a => a.finca))].sort();
  const current = filterFinca.value;
  filterFinca.innerHTML = '<option value="">Todas las fincas</option>' +
    fincas.map(f => `<option value="${f}">${f}</option>`).join('');
  filterFinca.value = fincas.includes(current) ? current : "";
}

function updateStats(){
  document.getElementById('statTotal').textContent = animals.length;
  document.getElementById('statFincas').textContent = new Set(animals.map(a=>a.finca)).size;
  document.getElementById('statTrat').textContent = animals.filter(a=>a.estado==='Tratamiento').length;
  const avg = animals.length ? Math.round(animals.reduce((s,a)=>s+(Number(a.peso)||0),0)/animals.length) : 0;
  document.getElementById('statPeso').textContent = avg;
}

function matchesFilters(a){
  const q = searchInput.value.trim().toLowerCase();
  const matchesSearch = !q || a.chapeta.toLowerCase().includes(q) || (a.nombre||'').toLowerCase().includes(q) || (a.raza||'').toLowerCase().includes(q);
  const matchesFinca = !filterFinca.value || a.finca === filterFinca.value;
  const matchesSexo = !filterSexo.value || a.sexo === filterSexo.value;
  const matchesEstado = !filterEstado.value || a.estado === filterEstado.value;
  return matchesSearch && matchesFinca && matchesSexo && matchesEstado;
}

function render(){
  const filtered = animals.filter(matchesFilters);
  resultCount.textContent = `${filtered.length} resultado${filtered.length===1?'':'s'}`;
  grid.innerHTML = '';
  if(filtered.length === 0){
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    filtered.forEach((a, i) => {
      const card = document.createElement('div');
      card.className = 'tag-card';
      card.style.animationDelay = `${Math.min(i*0.05, 0.4)}s`;
      const estadoClass = a.estado === 'Sano' ? 'status-Sano' : a.estado === 'Tratamiento' ? 'status-Tratamiento' : 'status-Cuarentena';
      const estadoLabel = a.estado === 'Tratamiento' ? 'En tratamiento' : a.estado;
      card.innerHTML = `
        <div class="tag-top">
          <div>
            <div class="tag-number">${a.chapeta}</div>
            <div class="tag-name">${a.nombre || 'Sin nombre'}</div>
          </div>
          <button class="icon-btn" title="Eliminar registro" data-chapeta="${a.chapeta}">✕</button>
        </div>
        <div class="tag-finca">📍 ${a.finca}</div>
        <div class="tag-meta">
          <span class="pill sex-${a.sexo}">${a.sexo === 'M' ? 'Macho' : 'Hembra'}</span>
          <span class="pill">${a.raza || 'Raza no registrada'}</span>
          <span class="pill ${estadoClass}">${estadoLabel}</span>
        </div>
        <div class="tag-footer">
          <div class="tag-weight">${a.peso ? a.peso + ' kg' : '—'} <span>peso</span></div>
        </div>
      `;
      grid.appendChild(card);
    });
  }
  document.querySelectorAll('.icon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ch = btn.getAttribute('data-chapeta');
      animals = animals.filter(a => a.chapeta !== ch);
      refreshFincaOptions();
      updateStats();
      render();
      showToast('Registro eliminado');
    });
  });
}

function showToast(msg){
  toastMsg.textContent = msg;
  toast.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function normalizeText(text){
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function initVoiceRecognition(){
  if (recognition) return;

  if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) {
    showToast('Tu navegador no soporta reconocimiento de voz');
    return;
  }

  const isSecureContext = window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (!isSecureContext) {
    showToast('Abre la página con HTTPS o localhost para usar el micrófono');
    return;
  }

  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognitionCtor();
  recognition.lang = 'es-ES';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    voiceBtn.classList.add('is-listening');
    voiceBtn.textContent = '⏹';
    voiceBtn.title = 'Detener escucha';
  };

  recognition.onend = () => {
    isListening = false;
    voiceBtn.classList.remove('is-listening');
    voiceBtn.textContent = '🎙️';
    voiceBtn.title = 'Registrar por voz';
  };

  recognition.onerror = (event) => {
    const msg = event.error === 'not-allowed'
      ? 'Permiso de micrófono denegado'
      : event.error === 'no-speech'
        ? 'No se escuchó nada. Intenta de nuevo'
        : 'No se pudo usar el micrófono';
    showToast(msg);
    if (recognition) recognition.stop();
  };

  recognition.onresult = (event) => {
    const finalTranscript = Array.from(event.results)
      .filter(result => result.isFinal)
      .map(result => result[0].transcript)
      .join(' ')
      .trim();

    if (finalTranscript) {
      handleVoiceTranscript(finalTranscript);
    }
  };
}

function handleVoiceTranscript(transcript){
  const text = normalizeText(transcript);

  const chapetaMatch = text.match(/(?:chapeta|numero de chapeta)\s*[:\-]?\s*([a-z]{1,3}[- ]?\d{3,})/) ||
    text.match(/\b([a-z]{1,3}[- ]?\d{3,})\b/);
  if (chapetaMatch) {
    const chapeta = chapetaMatch[1].replace(/\s+/g, '-').toUpperCase();
    document.getElementById('in-chapeta').value = chapeta;
  }

  const nombreMatch = text.match(/(?:nombre|alias|llamado|llama)\s+(.+?)(?=(?:finca|raza|sexo|peso|estado|registrar|guardar|$))/i);
  if (nombreMatch) {
    document.getElementById('in-nombre').value = nombreMatch[1].trim();
  }

  const fincaMap = {
    'la esperanza': 'La Esperanza',
    'el roble': 'El Roble',
    'santa rita': 'Santa Rita',
    'los naranjos': 'Los Naranjos'
  };
  const fincaKey = Object.keys(fincaMap).find(key => text.includes(key));
  if (fincaKey) {
    document.getElementById('in-finca').value = fincaMap[fincaKey];
  }

  const razaMatch = text.match(/(?:raza|tipo)\s+(.+?)(?=(?:sexo|peso|estado|registrar|guardar|$))/i);
  if (razaMatch) {
    document.getElementById('in-raza').value = razaMatch[1].trim();
  }

  if (text.includes('macho') || text.includes('varon') || text.includes('varón')) {
    document.getElementById('in-sexo').value = 'M';
  } else if (text.includes('hembra')) {
    document.getElementById('in-sexo').value = 'H';
  }

  const pesoMatch = text.match(/(?:peso)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i);
  if (pesoMatch) {
    document.getElementById('in-peso').value = pesoMatch[1];
  }

  if (text.includes('sano') || text.includes('saludable')) {
    document.getElementById('in-estado').value = 'Sano';
  } else if (text.includes('tratamiento') || text.includes('en tratamiento')) {
    document.getElementById('in-estado').value = 'Tratamiento';
  } else if (text.includes('cuarentena')) {
    document.getElementById('in-estado').value = 'Cuarentena';
  }

  if (/(registrar|guardar|agregar|crear).*(animal|registro)/.test(text) || text.includes('registrar animal') || text.includes('guardar animal')) {
    const chapeta = document.getElementById('in-chapeta').value.trim();
    const finca = document.getElementById('in-finca').value;
    const sexo = document.getElementById('in-sexo').value;
    const estado = document.getElementById('in-estado').value;
    if (chapeta && finca && sexo && estado) {
      form.requestSubmit();
    } else {
      showToast('Faltan datos para registrar');
    }
  }
}

function toggleVoiceCapture(){
  initVoiceRecognition();
  if (!recognition) {
    return;
  }
  if (isListening) {
    recognition.stop();
    return;
  }

  openModal();
  try {
    recognition.start();
  } catch (error) {
    showToast('No se pudo iniciar el micrófono');
  }
}

[searchInput, filterFinca, filterSexo, filterEstado].forEach(el => {
  el.addEventListener('input', render);
  el.addEventListener('change', render);
});

document.getElementById('clearFiltersBtn').addEventListener('click', () => {
  searchInput.value = '';
  filterFinca.value = '';
  filterSexo.value = '';
  filterEstado.value = '';
  render();
});

function openModal(){
  overlay.classList.add('open');
  document.getElementById('in-chapeta').focus();
}
function closeModal(){
  overlay.classList.remove('open');
  form.reset();
  document.querySelectorAll('.field').forEach(f => f.classList.remove('error'));
}

document.getElementById('openModalBtn').addEventListener('click', openModal);
voiceBtn.addEventListener('click', toggleVoiceCapture);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => { if(e.target === overlay) closeModal(); });
document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && overlay.classList.contains('open')) closeModal(); });

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const chapeta = document.getElementById('in-chapeta').value.trim();
  const nombre = document.getElementById('in-nombre').value.trim();
  const finca = document.getElementById('in-finca').value;
  const raza = document.getElementById('in-raza').value.trim();
  const sexo = document.getElementById('in-sexo').value;
  const peso = document.getElementById('in-peso').value;
  const estado = document.getElementById('in-estado').value;

  let valid = true;
  const setErr = (id, isErr) => document.getElementById(id).classList.toggle('error', isErr);

  if(!chapeta){ setErr('f-chapeta', true); valid = false; } else setErr('f-chapeta', false);
  if(!finca){ setErr('f-finca', true); valid = false; } else setErr('f-finca', false);
  if(!sexo){ setErr('f-sexo', true); valid = false; } else setErr('f-sexo', false);
  if(!estado){ setErr('f-estado', true); valid = false; } else setErr('f-estado', false);

  if(animals.some(a => a.chapeta.toLowerCase() === chapeta.toLowerCase())){
    setErr('f-chapeta', true);
    document.querySelector('#f-chapeta .err-msg').textContent = 'Esa chapeta ya existe.';
    valid = false;
  }

  if(!valid) return;

  animals.unshift({chapeta, nombre, finca, raza, sexo, peso, estado});
  refreshFincaOptions();
  updateStats();
  render();
  closeModal();
  showToast('Animal registrado correctamente');
});

function animateStats(){
  document.querySelectorAll('.stat .num').forEach(el => {
    const target = Number(el.textContent) || 0;
    let cur = 0;
    const step = Math.max(1, Math.ceil(target / 24));
    const t = setInterval(() => {
      cur += step;
      if(cur >= target){ cur = target; clearInterval(t); }
      el.textContent = cur;
    }, 16);
  });
}

refreshFincaOptions();
updateStats();
render();
animateStats();
