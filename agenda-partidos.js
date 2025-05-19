const partidos = {
  todos: [],
  libertadores: [],
  mundial: [],
  sudamericana: [],
  champions: []
};

const logos = {
  'TyC Sports': 'tyc.png',
  'ESPN': 'espn.png',
  'Star+': 'starplus.png',
  'TyC': 'tyc.png',
  'espn': 'espn.png',
  'start': 'starplus.png',
  'espnpremiun': 'espn.png',
  'tvplublica': 'publica.png',
  // Agrega más logos aquí según necesidad
};

let agendaCargada = false; // Controla si la agenda ya fue cargada

// Función para parsear la fecha en formato "18/05/2025"
function parseFecha(str) {
  return str.trim();
}

// Función para mapear código país a bandera unicode
function banderaPorCodigo(codigo) {
  const mapa = {
    'arg': '🇦🇷',
    // Agregar más si se necesitan
  };
  return mapa[codigo.toLowerCase()] || '';
}

// Función para parsear una entrada de partido (4 líneas)
function parsePartido(lineas) {
  // lineas: [equipos, hora+pais, canales, categorias]
  const [equipos, horaPais, canalesStr, categoriasStr] = lineas;
  const [hora, pais] = horaPais.split(',');
  const canales = canalesStr.split(',').map(c => c.trim());
  const categorias = categoriasStr.split(',').map(c => c.trim().toLowerCase());

  return {
    hora: hora.trim(),
    pais: banderaPorCodigo(pais.trim()),
    titulo: equipos.replace(/,/g, ' vs '),
    canales,
    categorias
  };
}

function showMatches(categoria) {
  const contenedor = document.getElementById('matchesContainer');

  if (!agendaCargada) {
    contenedor.innerHTML = `
      <div style="
        max-width: 320px;
        margin: 40px auto;
        padding: 20px;
        background-color: #232323;
        color: #eee;
        border-radius: 16px;
        box-shadow: 0 0 12px rgba(0,0,0,0.3);
        text-align: center;
        font-family: 'Arial', sans-serif;
      ">
        <img src="nohayagenda.png" alt="Error de carga" style="width:80%; max-width:180px; margin-bottom: 15px;">
        <h3 style="color:#ff6666; margin-bottom: 10px;">No se pudo cargar la agenda</h3>
        <p style="font-size: 14px; color:#ccc;">Verificá tu conexión o intentá nuevamente más tarde.</p>
      </div>
    `;
    return;
  }

  document.querySelectorAll('.match-option').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.match-option[onclick*="${categoria}"]`).classList.add('active');

  const grupo = partidos[categoria];

  if (!grupo || grupo.length === 0) {
    contenedor.innerHTML = `
      <div style="
        max-width: 320px;
        margin: 40px auto;
        padding: 20px;
        background-color: #232323;
        color: #eee;
        border-radius: 16px;
        box-shadow: 0 0 12px rgba(0,0,0,0.3);
        text-align: center;
        font-family: 'Arial', sans-serif;
      ">
        <img src="nohayagenda.png" alt="No hay partidos" style="width:80%; max-width:180px; margin-bottom: 15px;">
        <h3 style="color:#aaa; margin-bottom: 10px;">No hay partidos en esta categoría</h3>
        <p style="font-size: 14px; color:#ccc;">Volvé más tarde para ver nuevos partidos.</p>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = '';

  grupo.forEach(bloque => {
    const diaElem = document.createElement('div');
    diaElem.className = 'match-day';
    diaElem.textContent = bloque.dia;
    contenedor.appendChild(diaElem);

    bloque.lista.forEach(partido => {
      const item = document.createElement('div');
      item.className = 'match-item';

      item.innerHTML = `
        <div class="match-header">
          <span>${partido.hora}${partido.pais} ${partido.titulo}</span>
          <span class="toggle-icon">▼</span>
        </div>
        <div class="channel-list">
          <div class="channel-buttons">
            ${partido.canales.map(canal => `
              <button>
                <img src="${logos[canal] || 'canal.png'}" alt="${canal}" />
                ${canal}
              </button>`).join('')}
          </div>
        </div>
      `;
      contenedor.appendChild(item);
    });
  });

  document.querySelectorAll('.match-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      item.classList.toggle('active');
    });
  });
}

// Cargar archivo externo con la agenda
fetch('https://raw.githubusercontent.com/DarioCodex/pelota-libre-app/refs/heads/main/agenda.txt')
  .then(response => {
    if (!response.ok) throw new Error('No se pudo cargar el archivo');
    return response.text();
  })
.then(texto => {
  agendaCargada = true;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // normaliza

  const regex = /-\s*(\d{2}\/\d{2}\/\d{4})\s*([\s\S]*?)(?=(?:-\s*\d{2}\/\d{2}\/\d{4})|$)/g;
  let match;

  while ((match = regex.exec(texto)) !== null) {
    const fechaStr = match[1];
    const bloqueTexto = match[2].trim();

    const [dia, mes, año] = fechaStr.split('/');
    const fechaObj = new Date(Number(año), Number(mes) - 1, Number(dia));
    fechaObj.setHours(0, 0, 0, 0);

    if (fechaObj < hoy) continue; // ignorar fechas pasadas

    const etiqueta = fechaObj.getTime() === hoy.getTime()
      ? '📅 Partidos de Hoy'
      : `Agenda Deportiva (${fechaStr})`;

    const partidosBrutos = bloqueTexto.split('---').map(p => p.trim());
    partidosBrutos.forEach(pRaw => {
      const lineas = pRaw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lineas.length < 4) return;

      const partido = parsePartido(lineas);

partido.categorias.forEach(cat => {
  if (!partidos[cat]) partidos[cat] = [];
  let bloqueFecha = partidos[cat].find(b => b.dia === etiqueta);
  if (!bloqueFecha) {
    bloqueFecha = { dia: etiqueta, lista: [] };
    partidos[cat].push(bloqueFecha);
  }
  const yaExiste = bloqueFecha.lista.some(p => p.titulo === partido.titulo && p.hora === partido.hora);
  if (!yaExiste) bloqueFecha.lista.push(partido);
});

// También en 'todos'
if (!partidos['todos']) partidos['todos'] = [];
let bloqueTodos = partidos['todos'].find(b => b.dia === etiqueta);
if (!bloqueTodos) {
  bloqueTodos = { dia: etiqueta, lista: [] };
  partidos['todos'].push(bloqueTodos);
}
const yaExisteEnTodos = bloqueTodos.lista.some(p => p.titulo === partido.titulo && p.hora === partido.hora);
if (!yaExisteEnTodos) bloqueTodos.lista.push(partido);

    });
  }

  showMatches('todos');
})
.catch(err => {
  agendaCargada = false;
  const contenedor = document.getElementById('matchesContainer');
  contenedor.innerHTML = `
    <div style="
      max-width: 320px;
      margin: 40px auto;
      padding: 20px;
      background-color: #232323;
      color: #eee;
      border-radius: 16px;
      box-shadow: 0 0 12px rgba(0,0,0,0.3);
      text-align: center;
      font-family: 'Arial', sans-serif;
    ">
      <img src="nohayagenda.png" alt="Error de carga" style="width:80%; max-width:180px; margin-bottom: 15px;">
      <h3 style="color:#ff6666; margin-bottom: 10px;">No se pudo cargar la agenda</h3>
      <p style="font-size: 14px; color:#ccc;">Verificá tu conexión o intentá nuevamente más tarde.</p>
    </div>
  `;
});