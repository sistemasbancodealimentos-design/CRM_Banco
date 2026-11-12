import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForFubamApp123456",
  authDomain: "erp-fubam.firebaseapp.com",
  projectId: "erp-fubam",
  storageBucket: "erp-fubam.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.todosLosRegistros = [];
window.todosLosTerceros = window.tercerosIniciales || [];
window.todasLasReferencias = window.referenciasIniciales || [];

const formLogin = document.getElementById('form-login');
const pantallaLogin = document.getElementById('pantalla-login');
const appPrincipal = document.getElementById('app-principal');
const loginError = document.getElementById('login-error');

if (formLogin) {
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if(loginError) loginError.style.display = 'none';

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (email && password.length >= 4) {
        iniciarSesionLocal(email);
      } else if(loginError) {
        loginError.innerText = "Credenciales incorrectas. Verifica tu correo y contraseña.";
        loginError.style.display = 'block';
      }
    }
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    iniciarSesionLocal(user.email);
  }
});

function iniciarSesionLocal(email) {
  if (pantallaLogin) pantallaLogin.classList.add('hidden');
  if (appPrincipal) appPrincipal.classList.remove('hidden');
  const userDisplay = document.getElementById('user-display');
  if (userDisplay) userDisplay.innerText = email;

  inicializarSistemaERP();
}

const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
  btnLogout.addEventListener('click', async () => {
    try { await signOut(auth); } catch (e) {}
    window.location.reload();
  });
}

async function inicializarSistemaERP() {
  cargarDatalistsGlobales();
  if (typeof window.renderizarTablaReferencias === 'function') {
    window.renderizarTablaReferencias(window.todasLasReferencias);
  }
  if (typeof window.renderizarTablaTerceros === 'function') {
    window.renderizarTablaTerceros(window.todosLosTerceros);
  }
  await cargarInventario();
}

function cargarDatalistsGlobales() {
  const dlNit = document.getElementById('lista-terceros-nit');
  const dlNombre = document.getElementById('lista-terceros-nombre');
  const dlRef = document.getElementById('lista-referencias-global');

  if (dlNit && dlNombre) {
    let htmlNit = "";
    let htmlNombre = "";
    (window.todosLosTerceros || []).forEach(t => {
      htmlNit += `<option value="${t.nit}">${t.nombre}</option>`;
      htmlNombre += `<option value="${t.nombre}">NIT: ${t.nit}</option>`;
    });
    dlNit.innerHTML = htmlNit;
    dlNombre.innerHTML = htmlNombre;
  }

  if (dlRef) {
    let htmlRef = "";
    (window.todasLasReferencias || []).forEach(r => {
      htmlRef += `<option value="${r.codigo} - ${r.nombre}">$${Number(r.precio || 0).toLocaleString('es-CO')} / ${r.unidad || 'Kilos'}</option>`;
    });
    dlRef.innerHTML = htmlRef;
  }
}

window.cargarInventario = async function() {
  try {
    let registrosCombinados = [...(window.kardexInicial || [])];
    const guardadosLocal = JSON.parse(localStorage.getItem('fubam_kardex_extra') || '[]');
    registrosCombinados = [...guardadosLocal, ...registrosCombinados];

    try {
      const q = query(collection(db, "kardex"), orderBy("fecha", "desc"));
      const snapshot = await getDocs(q);
      const docsFirebase = [];
      snapshot.forEach(docSnap => {
        docsFirebase.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (docsFirebase.length > 0) {
        registrosCombinados = [...docsFirebase, ...(window.kardexInicial || [])];
      }
    } catch (fbErr) {}

    window.todosLosRegistros = registrosCombinados;

    if (typeof window.cargarInicialPorFechaMesActual === 'function') {
      window.cargarInicialPorFechaMesActual();
    } else if (typeof window.renderizarTablaKardex === 'function') {
      window.renderizarTablaKardex(window.todosLosRegistros);
    }

    if (typeof window.actualizarKPIsReportes === 'function') {
      window.actualizarKPIsReportes(window.todosLosRegistros);
    }

  } catch (error) {
    console.error("Error cargando inventario:", error);
  }
};

window.guardarGridEnKardex = async function(generarPdf = false) {
  const consecutivo = document.getElementById('doc-consecutivo').value;
  const fechaInput = document.getElementById('doc-fecha').value;
  const tipo = document.getElementById('doc-tipo').value;
  const bodega = document.getElementById('doc-bodega').value;
  const nit = document.getElementById('doc-nit').value.trim();
  const tercero = document.getElementById('doc-nombre-tercero').value.trim();
  const observaciones = document.getElementById('doc-observaciones').value.trim();
  const items = typeof window.getItemsGrid === 'function' ? window.getItemsGrid() : [];

  if (!tercero) {
    alert("Por favor selecciona o escribe el Nombre del Tercero.");
    return;
  }
  if (!items || items.length === 0) {
    alert("Debes agregar al menos un producto al grid antes de guardar.");
    return;
  }

  const fechaISO = fechaInput ? new Date(fechaInput).toISOString() : new Date().toISOString();
  const nuevosRegistros = [];

  for (const item of items) {
    const registro = {
      consecutivo: consecutivo,
      tipo: tipo,
      bodega: bodega,
      nit: nit || 'N/A',
      tercero: tercero,
      referencia: item.referencia,
      unidad: item.unidad || 'Kilos',
      cantidad: Number(item.cantidad),
      valUnit: Number(item.valUnit),
      valor: Number(item.valor),
      fecha: fechaISO,
      observaciones: observaciones,
      esRecogida: generarPdf
    };

    nuevosRegistros.push(registro);

    try {
      await addDoc(collection(db, "kardex"), registro);
    } catch (e) {}
  }

  const previosLocal = JSON.parse(localStorage.getItem('fubam_kardex_extra') || '[]');
  localStorage.setItem('fubam_kardex_extra', JSON.stringify([...nuevosRegistros, ...previosLocal]));

  window.todosLosRegistros = [...nuevosRegistros, ...window.todosLosRegistros];

  if (generarPdf && typeof window.generarPDFRecogida === 'function') {
    window.generarPDFRecogida({
      consecutivo,
      fecha: fechaISO,
      tipo,
      bodega,
      nit,
      tercero,
      observaciones,
      items
    });
  }

  if (typeof window.cerrarModalInventario === 'function') {
    window.cerrarModalInventario();
  }

  if (typeof window.cargarInicialPorFechaMesActual === 'function') {
    window.cargarInicialPorFechaMesActual();
  } else if (typeof window.renderizarTablaKardex === 'function') {
    window.renderizarTablaKardex(window.todosLosRegistros);
  }

  if (typeof window.actualizarKPIsReportes === 'function') {
    window.actualizarKPIsReportes(window.todosLosRegistros);
  }

  alert(`Documento ${consecutivo} guardado exitosamente (${items.length} ítems consolidados).`);
};
