import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCIY2_rx2mEyn6U5ym-QYhd5xWM78Y2GEM",
  authDomain: "crmfubam-61e45.firebaseapp.com",
  projectId: "crmfubam-61e45",
  storageBucket: "crmfubam-61e45.firebasestorage.app",
  messagingSenderId: "747233524546",
  appId: "1:747233524546:web:573402dbb3a1c628e926db",
  measurementId: "G-L6D908N8EK"
};

const app = initializeApp(firebaseConfig);
window.db = getFirestore(app);
const auth = getAuth(app);

onAuthStateChanged(auth, async (user) => {
  const pantallaLogin = document.getElementById('pantalla-login');
  const appPrincipal = document.getElementById('app-principal');
  const userDisplay = document.getElementById('user-display');

  if (user) {
    pantallaLogin.classList.add('hidden');
    appPrincipal.classList.remove('hidden');
    if(userDisplay) userDisplay.innerText = user.email;

    popularDatalistsGlobales();
    renderizarTablaReferenciasUI();
    renderizarTablaTercerosUI();

    await cargarInventario();
  } else {
    pantallaLogin.classList.remove('hidden');
    appPrincipal.classList.add('hidden');
  }
});

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.style.display = 'none';

  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (error) {
    errorEl.innerText = "Usuario o contraseña incorrectos.";
    errorEl.style.display = 'block';
  }
});

document.getElementById('btn-logout').addEventListener('click', () => { signOut(auth); });

window.cargarInventario = async function() {
  try {
    const querySnapshot = await getDocs(collection(window.db, "inventario"));
    if(!querySnapshot.empty) {
      const firebaseItems = [];
      querySnapshot.forEach((doc) => {
        const item = doc.data();
        item._id = doc.id;
        firebaseItems.push(item);
      });
      window.todosLosRegistros = firebaseItems.concat(window.KARDEX_INICIAL_EXCEL || []);
    }
  } catch (error) {
    console.log("Usando Kárdex pre-cargado");
  }
  window.cargarInicialPorFechaMesActual();
  if (typeof window.actualizarModuloReportes === 'function') {
    window.actualizarModuloReportes();
  }
};

window.guardarGridEnKardex = async function(esRecogida) {
  const consecutivo = document.getElementById('doc-consecutivo').value;
  const tipo = document.getElementById('doc-tipo').value;
  const bodega = document.getElementById('doc-bodega').value;
  const nit = document.getElementById('doc-nit').value;
  const tercero = document.getElementById('doc-nombre-tercero').value;
  const fechaVal = document.getElementById('doc-fecha').value;
  const observaciones = document.getElementById('doc-observaciones').value;
  const itemsGrid = window.getItemsGrid();

  if(!itemsGrid || itemsGrid.length === 0) {
    alert("Debes agregar al menos 1 producto al grid.");
    return;
  }

  const fechaFinal = fechaVal ? new Date(fechaVal).toISOString() : new Date().toISOString();

  for (let item of itemsGrid) {
    const nuevoRegistro = {
      consecutivo: consecutivo,
      tipo: tipo,
      bodega: bodega,
      nit: nit || 'N/A',
      tercero: tercero,
      referencia: item.referencia,
      unidad: item.unidad,
      cantidad: item.cantidad,
      valUnit: item.valUnit,
      valor: item.valor,
      esRecogida: esRecogida,
      fecha: fechaFinal,
      observaciones: observaciones || ''
    };

    try {
      await addDoc(collection(window.db, "inventario"), nuevoRegistro);
    } catch(e) { console.log("Guardando en memoria local..."); }

    window.todosLosRegistros.unshift(nuevoRegistro);
  }

  if (esRecogida) {
    const canvasFirma = document.getElementById('canvas-firma');
    const firmaData = canvasFirma ? canvasFirma.toDataURL('image/png') : null;
    window.generarPDFComprobante(consecutivo, tipo, bodega, nit, tercero, firmaData, itemsGrid, fechaFinal, observaciones);
  }

  cerrarModalInventario();
  window.cargarInicialPorFechaMesActual();
  if (typeof window.actualizarModuloReportes === 'function') {
    window.actualizarModuloReportes();
  }
  alert("¡Guardado correctamente en Kárdex!");
};