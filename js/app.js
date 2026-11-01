'use strict';

/* Interacción 1: menú adaptable mediante el componente Collapse de Bootstrap */
function initMenu() {
  const menu = document.getElementById('menu');
  const btn = document.querySelector('.navbar-toggler');

  if (!menu || !btn || !window.bootstrap?.Collapse) {
    console.error('No se pudo inicializar el menú de Bootstrap. Verifique la carga del Bootstrap Bundle.');
    return;
  }

  const menuCollapse = window.bootstrap.Collapse.getOrCreateInstance(menu, { toggle: false });
  const esMovil = () => window.matchMedia('(max-width: 767.98px)').matches;

  // En pantallas pequeñas, el menú se cierra al seleccionar una sección.
  // El menú desplegado flota sobre la página (ver CSS), así que cerrarlo no cambia la altura del
  // header ni mueve el contenido: el salto nativo a la sección llega a la posición correcta.
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a[href^="#"]') && esMovil()) {
      menuCollapse.hide();
    }
  });

  // Escape cierra el menú y devuelve el foco al botón que lo controla.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('show') && esMovil()) {
      menuCollapse.hide();
      btn.focus();
    }
  });
}

/* Interacción 2: filtros y carga de servicios con jQuery, AJAX y JSON */
let categoriaActual = 'todos';

function actualizarFiltro() {
  const $items = $('#lista > li');
  let visibles = 0;

  $items.each(function () {
    const ver = categoriaActual === 'todos' || this.dataset.cat === categoriaActual;
    $(this).prop('hidden', !ver);
    if (ver) visibles += 1;
  });

  $('[data-filter]').each(function () {
    $(this).attr('aria-pressed', String(this.dataset.filter === categoriaActual));
  });

  // #conteo es la única región en vivo del catálogo: anuncia el resultado del filtro.
  $('#conteo').text(`Mostrando ${visibles} de ${$items.length} servicios.`);
}

function initFilter() {
  // Delegación de eventos de jQuery para gestionar los botones de filtro.
  $(document).on('click', '[data-filter]', function () {
    categoriaActual = this.dataset.filter;
    actualizarFiltro();
  });

  // Al reintentar, el botón desaparece: el foco pasa al estado del catálogo para no perderlo.
  $(document).on('click', '#reintentar-servicios', function () {
    cargarServicios();
    $('#conteo').trigger('focus');
  });
}

function crearTarjeta(servicio) {
  // Se usan textContent y createElement para insertar texto sin interpretar HTML externo.
  const item = document.createElement('li');
  item.className = 'col-12 col-md-6 col-lg-4';
  item.dataset.cat = servicio.categoria;

  const tarjeta = document.createElement('article');
  tarjeta.className = 'card service-card h-100';

  const cuerpo = document.createElement('div');
  cuerpo.className = 'card-body';

  const etiqueta = document.createElement('span');
  etiqueta.className = 'service-tag';
  etiqueta.textContent = servicio.etiqueta;

  const titulo = document.createElement('h3');
  titulo.className = 'card-title';
  titulo.textContent = servicio.titulo;

  const descripcion = document.createElement('p');
  descripcion.className = 'card-text';
  descripcion.textContent = servicio.descripcion;

  cuerpo.append(etiqueta, titulo, descripcion);
  tarjeta.appendChild(cuerpo);
  item.appendChild(tarjeta);

  return item;
}

function permiteEfectos() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function mostrarIndicadorCarga() {
  const $indicador = $('#carga-servicios');
  $indicador.prop('hidden', false);

  // Efecto jQuery fadeIn: se omite cuando el usuario prefiere movimiento reducido.
  if (permiteEfectos()) {
    $indicador.stop(true, true).hide().fadeIn(180);
  } else {
    $indicador.show();
  }
}

function ocultarIndicadorCarga() {
  const $indicador = $('#carga-servicios');

  // Efecto jQuery fadeOut con alternativa sin animación para accesibilidad.
  // Se limpia el estilo en línea y se deja el atributo hidden como única fuente de ocultación.
  if (permiteEfectos()) {
    $indicador.stop(true, true).fadeOut(180, function () {
      $(this).prop('hidden', true).css('display', '');
    });
  } else {
    $indicador.prop('hidden', true);
  }
}

function mostrarErrorCarga(mensaje) {
  ocultarIndicadorCarga();
  $('#lista').empty();
  $('#error-servicios p').text(mensaje);
  $('#error-servicios').prop('hidden', false);
  $('#conteo').text('El catálogo no está disponible.');
}

function cargarServicios() {
  $('#error-servicios').prop('hidden', true);
  $('#lista').empty();
  mostrarIndicadorCarga();
  $('#conteo').text('Cargando catálogo de servicios…');

  // GET asíncrono: consulta el archivo JSON sin recargar toda la página.
  $.ajax({
    url: 'data/servicios.json',
    method: 'GET',
    dataType: 'json',
    timeout: 10000
  })
    .done((datos) => {
      if (!Array.isArray(datos)) {
        mostrarErrorCarga('El archivo JSON no tiene el formato de lista esperado.');
        return;
      }

      const categoriasPermitidas = ['electricidad', 'alarmas', 'camaras'];
      const serviciosValidos = datos.filter((servicio) =>
        servicio &&
        categoriasPermitidas.includes(servicio.categoria) &&
        ['etiqueta', 'titulo', 'descripcion'].every((campo) =>
          typeof servicio[campo] === 'string' && servicio[campo].trim().length > 0
        )
      );

      if (serviciosValidos.length === 0) {
        mostrarErrorCarga('No se encontraron servicios válidos en el archivo JSON.');
        return;
      }

      const fragmento = document.createDocumentFragment();
      serviciosValidos.forEach((servicio) => fragmento.appendChild(crearTarjeta(servicio)));
      document.getElementById('lista').appendChild(fragmento);

      ocultarIndicadorCarga();
      actualizarFiltro();
    })
    .fail((xhr, estado) => {
      let mensaje = 'No se pudo consultar el archivo de servicios. Compruebe que el servidor local esté activo.';

      if (estado === 'parsererror') {
        mensaje = 'El archivo servicios.json contiene datos JSON que no se pudieron interpretar.';
      } else if (xhr.status === 404) {
        mensaje = 'No se encontró data/servicios.json (HTTP 404). Revise la ubicación y el nombre del archivo.';
      } else if (xhr.status) {
        mensaje = `Ocurrió un error al consultar los servicios (HTTP ${xhr.status}).`;
      } else if (estado === 'timeout') {
        mensaje = 'La consulta tardó demasiado. Compruebe la conexión e inténtelo nuevamente.';
      }

      mostrarErrorCarga(mensaje);
    });
}

/* Interacción 3: validación accesible. JavaScript es el único que marca is-valid / is-invalid;
   no se usa .was-validated de Bootstrap para evitar estilos contradictorios. */
function initForm() {
  const form = document.getElementById('form');
  const resumen = document.getElementById('resumen');

  if (!form || !resumen) return;

  const reglas = {
    nombre: (valor) => valor.length >= 3 ? '' : 'Escriba su nombre completo (mínimo 3 caracteres).',
    correo: (valor, campo) => {
      if (!valor) return 'Ingrese su correo electrónico.';
      return campo.validity.valid ? '' : 'Escriba un correo válido, por ejemplo nombre@correo.com.';
    },
    telefono: (valor) => {
      if (valor === '') return '';
      const digitos = valor.replace(/\D/g, '');
      const formatoValido = /^\+?[0-9 ]+$/.test(valor);
      return formatoValido && digitos.length >= 7 && digitos.length <= 15
        ? ''
        : 'Use entre 7 y 15 dígitos; puede empezar con + y usar espacios.';
    },
    servicio: (valor) => valor ? '' : 'Seleccione un servicio.'
  };

  const campos = Object.keys(reglas).map((nombre) => form.elements[nombre]);
  let intentoEnvio = false; // true cuando la persona ya intentó enviar: valida en vivo

  const mensajeDe = (campo) => reglas[campo.name](campo.value.trim(), campo);

  function validar(campo) {
    const valor = campo.value.trim();
    const mensaje = mensajeDe(campo);
    const feedback = document.getElementById(`e-${campo.name}`);
    const tieneError = Boolean(mensaje);

    feedback.textContent = mensaje;
    campo.classList.toggle('is-invalid', tieneError);
    campo.classList.toggle('is-valid', !tieneError && valor !== '');

    if (tieneError) {
      campo.setAttribute('aria-invalid', 'true');
    } else {
      campo.removeAttribute('aria-invalid');
    }

    return !tieneError;
  }

  function limpiarEstados() {
    campos.forEach((campo) => {
      campo.classList.remove('is-valid', 'is-invalid');
      campo.removeAttribute('aria-invalid');
      document.getElementById(`e-${campo.name}`).textContent = '';
    });
  }

  // Resumen de errores con enlaces que llevan el foco al campo correspondiente.
  function mostrarResumenErrores(invalidos) {
    const titulo = document.createElement('p');
    titulo.className = 'mb-0';
    titulo.textContent = invalidos.length === 1
      ? 'Hay 1 campo con errores. Corríjalo para continuar:'
      : `Hay ${invalidos.length} campos con errores. Corríjalos para continuar:`;

    const lista = document.createElement('ul');
    invalidos.forEach((campo) => {
      const etiqueta = form.querySelector(`label[for="${campo.id}"]`);
      const enlace = document.createElement('a');
      enlace.href = `#${campo.id}`;
      enlace.textContent = etiqueta
        ? etiqueta.textContent.replace('*', '').replace('(opcional)', '').trim()
        : campo.name;

      const item = document.createElement('li');
      item.appendChild(enlace);
      lista.appendChild(item);
    });

    resumen.className = 'alert alert-danger';
    resumen.replaceChildren(titulo, lista);
    resumen.hidden = false;
  }

  campos.forEach((campo) => {
    campo.addEventListener('blur', () => validar(campo));
    campo.addEventListener('input', () => {
      if (!intentoEnvio) return;
      validar(campo);
      if (campos.every((elemento) => mensajeDe(elemento) === '')) {
        resumen.hidden = true;
      }
    });
    campo.addEventListener('change', () => {
      if (intentoEnvio) validar(campo);
    });
  });

  // Los enlaces del resumen enfocan el campo en lugar de solo cambiar el hash.
  resumen.addEventListener('click', (e) => {
    const enlace = e.target.closest('a[href^="#"]');
    if (!enlace) return;
    e.preventDefault();
    document.getElementById(enlace.getAttribute('href').slice(1))?.focus();
  });

  // Al volver a escribir tras un envío correcto, se retira el mensaje de confirmación.
  form.addEventListener('input', () => {
    if (resumen.classList.contains('alert-success')) resumen.hidden = true;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    intentoEnvio = true;

    const invalidos = campos.filter((campo) => !validar(campo));

    if (invalidos.length > 0) {
      mostrarResumenErrores(invalidos);
      invalidos[0].focus();
      return;
    }

    // La actividad no incluye un servidor para guardar solicitudes: se confirma como simulación.
    form.reset();
    intentoEnvio = false;
    limpiarEstados();

    resumen.className = 'alert alert-success';
    resumen.textContent = 'Gracias. Recibimos su solicitud y le contactaremos pronto (simulación).';
    resumen.hidden = false;
    resumen.focus();
  });
}

initMenu();
initFilter();
initForm();
cargarServicios();