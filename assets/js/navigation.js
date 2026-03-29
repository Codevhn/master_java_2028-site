
const contentCache = new Map()

// Esperar a que el html cargue para luego cargar el contenido
document.addEventListener('DOMContentLoaded', () => {

  // Escuchar clicks en los enlaces del sidebar
  document.getElementById('sidebar').addEventListener('click', (e) => {
    const link = e.target.closest('a[data-content]')
    if (!link) return
    e.preventDefault()
    const path = link.getAttribute('data-content')
    loadContent(path, link)
  })

  // Botón hamburguesa — mostrar/ocultar sidebar
  document.getElementById('btn-menu').addEventListener('click', () => {
    document.body.classList.toggle('sidebar-hidden')
  })

  // Restaurar subtema desde la URL al recargar la página
  const hash = location.hash.replace('#', '')
  if (hash) {
    const link = document.querySelector(`a[data-content="${hash}"]`)
    if (link) loadContent(hash, link)
  }

  // Navegar con botones atrás/adelante del navegador
  window.addEventListener('popstate', (e) => {
    if (e.state?.path) {
      const link = document.querySelector(`a[data-content="${e.state.path}"]`)
      if (link) loadContent(e.state.path, link, false)
    }
  })

})

// Cargar y mostrar el contenido correspondiente al enlace clickeado
function loadContent(path, link, pushHistory = true) {

  if (contentCache.has(path)) {
    renderHtml(contentCache.get(path), link)
    if (pushHistory) history.pushState({ path }, '', `#${path}`)
    return
  }

  fetch(`content/${path}.html`)
    .then(res => res.text())
    .then(html => {
      contentCache.set(path, html)
      renderHtml(html, link)
      if (pushHistory) history.pushState({ path }, '', `#${path}`)
    })
    .catch((error) => {
      console.error(error)
      document.getElementById('content').innerHTML = '<p>Contenido aun no disponible</p>'
    })
}

// Insertar el html en el área de contenido
function renderHtml(html, link) {
  // Marcar link activo
  document.querySelectorAll('#sidebar a.active').forEach(a => a.classList.remove('active'))
  link.classList.add('active')

  document.getElementById('content').innerHTML =
    `<div class="subtema-content">${html}<hr class="subtema-end"></div>`
  renderBreadcrumb(link)
  renderNavegation(link)
  Prism.highlightAll()
  document.getElementById('content').scrollTop = 0
}

// Actualizar el breadcrumb con la ruta fase / tema / subtema
function renderBreadcrumb(link) {
  const faseEl = link.closest('details.fase')
  const temaEl = link.closest('details.tema')

  const faseName      = faseEl ? faseEl.querySelector(':scope > summary').textContent.trim() : ''
  const temaNombre    = temaEl ? temaEl.querySelector(':scope > summary').textContent.trim() : ''
  const subtemaNombre = link.textContent.trim()

  const breadcrumb = document.getElementById('breadcrumb')
  breadcrumb.innerHTML = `
    <span class="bc-fase">${faseName}</span>
    <span class="bc-sep">/</span>
    <span class="bc-tema">${temaNombre}</span>
    <span class="bc-sep">/</span>
    <span class="bc-subtema">${subtemaNombre}</span>
  `
}

function renderNavegation(link) {

  const faseActual = link.closest('details.fase')
  const lista = Array.from(faseActual.querySelectorAll('a[data-content]'))
  const indice = lista.findIndex(el => el === link)

  const anterior = indice > 0 ? lista[indice - 1] : null
  const siguiente = indice !== lista.length - 1 ? lista[indice + 1] : null

  const navArea = document.getElementById('nav-area')
  navArea.innerHTML = `
    <div class="nav-botones">
      ${anterior ? `<button id="btn-anterior">&#8592; Anterior</button>` : ''}
      ${siguiente ? `<button id="btn-siguiente">Siguiente &#8594;</button>` : ''}
    </div>
  `

  if (anterior) {
    document.getElementById('btn-anterior').addEventListener('click', () => {
      loadContent(anterior.getAttribute('data-content'), anterior)
    })
  }

  if (siguiente) {
    document.getElementById('btn-siguiente').addEventListener('click', () => {
      loadContent(siguiente.getAttribute('data-content'), siguiente)
    })
  }
}
