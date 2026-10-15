// Scatto diretto dalla fotocamera (webcam del Mac, fotocamera dell'iPad), con timer e linee guida.
// L'immagine resta nel browser: passa al normale caricamento delle foto (sfocatura del viso inclusa).
import { esc } from './util.js';

let flusso = null;

function ferma() {
  flusso?.getTracks().forEach((t) => t.stop());
  flusso = null;
}

async function apriFlusso(video, deviceId, posteriore) {
  ferma();
  const vincoli = deviceId
    ? { deviceId: { exact: deviceId } }
    : { facingMode: posteriore ? 'environment' : 'user' };
  flusso = await navigator.mediaDevices.getUserMedia({ video: { ...vincoli, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
  video.srcObject = flusso;
  await video.play();
}

// Restituisce un File JPEG oppure null se si chiude senza scattare
export function scattaFoto(titolo = 'Fotocamera') {
  return new Promise((risolvi) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Questo browser non permette di usare la fotocamera: carica una foto dal dispositivo.');
      risolvi(null);
      return;
    }
    const m = document.createElement('div');
    m.className = 'modal camera-modal';
    m.innerHTML = `<div class="modal-box camera-box">
      <div class="modal-head"><strong>${esc(titolo)}</strong><button data-cam="chiudi">Chiudi</button></div>
      <div class="camera-vista"><video playsinline muted></video>
        <svg class="camera-guide" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <line x1="50" y1="0" x2="50" y2="100"/><line x1="0" y1="33.3" x2="100" y2="33.3"/><line x1="0" y1="66.6" x2="100" y2="66.6"/></svg>
        <div class="camera-conto" hidden></div></div>
      <div class="toolbar" style="margin-top:8px;justify-content:space-between">
        <div class="toolbar">
          <select data-cam="dispositivo" aria-label="Fotocamera"><option value="">Fotocamera posteriore</option><option value="fronte">Fotocamera frontale</option></select>
          <select data-cam="timer" aria-label="Timer"><option value="0">Senza timer</option><option value="3">Timer 3 s</option><option value="5">Timer 5 s</option><option value="10">Timer 10 s</option></select>
        </div>
        <button class="primary grande" data-cam="scatta">Scatta</button>
      </div>
      <p class="muted small" style="margin:6px 0 0">Linea centrale verticale: allinea il cliente al centro, figura intera dai piedi alla testa.</p>
    </div>`;
    document.body.appendChild(m);
    const video = m.querySelector('video');
    const sel = m.querySelector('[data-cam="dispositivo"]');
    const conto = m.querySelector('.camera-conto');
    let chiuso = false;
    const fine = (file) => { if (chiuso) return; chiuso = true; ferma(); m.remove(); risolvi(file); };

    const avvia = async () => {
      try {
        const v = sel.value;
        await apriFlusso(video, v && v !== 'fronte' ? v : null, v !== 'fronte');
      } catch (e) {
        console.error(e);
        alert('Non riesco ad accedere alla fotocamera. Controlla di aver dato il permesso al browser.');
        fine(null);
        return;
      }
      // con il permesso concesso compaiono anche i nomi delle fotocamere (es. iPhone con Continuità)
      const dev = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
      if (dev.length > 1 && !sel.dataset.pieno) {
        sel.dataset.pieno = '1';
        const attuale = flusso?.getVideoTracks()[0]?.getSettings().deviceId;
        sel.innerHTML = dev.map((d, i) => `<option value="${esc(d.deviceId)}"${d.deviceId === attuale ? ' selected' : ''}>${esc(d.label || `Fotocamera ${i + 1}`)}</option>`).join('');
      }
    };

    m.addEventListener('click', async (e) => {
      const a = e.target.closest('[data-cam]')?.dataset.cam;
      if (a === 'chiudi') fine(null);
      if (a !== 'scatta' || !flusso) return;
      const sec = Number(m.querySelector('[data-cam="timer"]').value);
      for (let s = sec; s > 0 && !chiuso; s--) {
        conto.hidden = false; conto.textContent = s;
        await new Promise((r) => setTimeout(r, 1000));
      }
      conto.hidden = true;
      if (chiuso) return;
      const c = document.createElement('canvas');
      c.width = video.videoWidth; c.height = video.videoHeight;
      c.getContext('2d').drawImage(video, 0, 0);
      c.toBlob((b) => fine(b ? new File([b], `scatto-${Date.now()}.jpg`, { type: 'image/jpeg' }) : null), 'image/jpeg', 0.92);
    });
    sel.addEventListener('change', avvia);
    document.addEventListener('keydown', function esc_(e) { if (e.key === 'Escape') { document.removeEventListener('keydown', esc_); fine(null); } });
    avvia();
  });
}
