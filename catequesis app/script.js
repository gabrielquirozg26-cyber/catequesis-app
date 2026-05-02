import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    updateDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBiWAeFwGc_arBs1wzMbiw5eIid6TVe1Ec",
    authDomain: "catequesisapp-2182c.firebaseapp.com",
    projectId: "catequesisapp-2182c",
    storageBucket: "catequesisapp-2182c.firebasestorage.app",
    messagingSenderId: "505750741903",
    appId: "1:505750741903:web:c9315dacf16c6bedfea1fa"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let isLoginMode = false;
let userNivelActual = 1; // Controla qué nivel ha desbloqueado el niño
let startTime;           // Guardará el momento exacto en que inicia el juego
let erroresCometidos = 0; // Contará cuántas veces se equivoca el niño en un nivel

// --- NAVEGACIÓN ---
window.showView = (id) => {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    window.scrollTo(0,0);
};

// --- ALTERNAR ENTRE LOGIN Y REGISTRO ---
window.toggleAuthMode = () => {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const btnAction = document.getElementById('btn-auth-action');
    const extraFields = document.getElementById('extra-fields');
    const switchText = document.getElementById('auth-switch-text');
    const switchBtn = document.getElementById('auth-switch-btn');

    if (isLoginMode) {
        title.innerText = "¡Bienvenido de nuevo!";
        btnAction.innerText = "Entrar";
        extraFields.classList.add('hidden');
        switchText.innerText = "¿No tienes cuenta?";
        switchBtn.innerText = "Regístrate";
    } else {
        title.innerText = "Crear Cuenta";
        btnAction.innerText = "Registrarse";
        extraFields.classList.remove('hidden');
        switchText.innerText = "¿Ya tienes cuenta?";
        switchBtn.innerText = "Inicia Sesión";
    }
};

// --- ACCIÓN PRINCIPAL (REGISTRO O LOGIN POR EMAIL) ---
document.getElementById('btn-auth-action').onclick = async () => {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;

    if (isLoginMode) {
        if(!email || !pass) return alert("Por favor, ingresa correo y contraseña.");
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (e) { 
            alert("Error: Correo o contraseña incorrectos."); 
        }
    } else {
        const name = document.getElementById('reg-name').value;
        const group = document.getElementById('reg-group').value;
        if(!name || !email || !pass) return alert("Por favor, llena todos los campos.");

        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, pass);
            await setDoc(doc(db, "estudiantes", userCred.user.uid), {
                nombre: name,
                grupo: group,
                nivelActual: 1
            });
        } catch (e) { 
            alert("Error al registrar: " + e.message); 
        }
    }
};

// --- LOGIN CON GOOGLE ---
window.loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const userRef = doc(db, "estudiantes", result.user.uid);
        const snap = await getDoc(userRef);
        if(!snap.exists()) {
            await setDoc(userRef, { 
                nombre: result.user.displayName, 
                grupo: "San Francisco", 
                nivelActual: 1 
            });
        }
    } catch (e) { 
        alert("Error con Google Auth"); 
    }
};

window.logout = () => signOut(auth);

// --- CONTENIDO DE LAS ORACIONES ---
const nivelesOraciones = {
    padrenuestro: [
        { frase: "Padre nuestro que estás en el ____", correcta: "Cielo", opciones: ["Cielo", "Mar", "Sol"] },
        { frase: "Santificado sea tu ____", correcta: "Nombre", opciones: ["Nombre", "Reino", "Poder"] },
        { frase: "Venga a nosotros tu ____", correcta: "Reino", opciones: ["Reino", "Paz", "Amor"] },
        { frase: "Hágase tu ____ en la tierra como en el cielo", correcta: "Voluntad", opciones: ["Voluntad", "Deseo", "Luz"] },
        { frase: "Danos hoy nuestro ____ de cada día", correcta: "Pan", opciones: ["Pan", "Fruto", "Agua"] }
    ],
    avemaria: [
        { frase: "Dios te salve María, llena eres de ____", correcta: "Gracia", opciones: ["Gracia", "Luz", "Vida"] },
        { frase: "El Señor es ____", correcta: "Contigo", opciones: ["Contigo", "Bueno", "Grande"] },
        { frase: "Bendita tú eres entre todas las ____", correcta: "Mujeres", opciones: ["Mujeres", "Niñas", "Santas"] },
        { frase: "Y bendito es el ____ de tu vientre, Jesús", correcta: "Fruto", opciones: ["Fruto", "Hijo", "Niño"] }
    ],
    gloria: [
        { frase: "Gloria al Padre, al Hijo y al Espíritu ____", correcta: "Santo", opciones: ["Santo", "Puro", "Gran"] },
        { frase: "Como era en el ____", correcta: "Principio", opciones: ["Principio", "Pasado", "Inicio"] },
        { frase: "Ahora y siempre, por los siglos de los ____", correcta: "Siglos", opciones: ["Siglos", "Años", "Días"] }
    ],
    confieso: [
        { frase: "Yo confieso ante Dios ____", correcta: "Todopoderoso", opciones: ["Todopoderoso", "Grande", "Bueno"] },
        { frase: "Y ante ustedes hermanos, que he pecado mucho de ____", correcta: "Pensamiento", opciones: ["Pensamiento", "Acción", "Deseo"] },
        { frase: "Palabra, obra y ____", correcta: "Omisión", opciones: ["Omisión", "Error", "Olvido"] }
    ],
    angel: [
        { frase: "Ángel de mi ____", correcta: "Guarda", opciones: ["Guarda", "Vida", "Camino"] },
        { frase: "Mi dulce ____", correcta: "Compañía", opciones: ["Compañía", "Amistad", "Luz"] },
        { frase: "No me desampares ni de noche ni de ____", correcta: "Día", opciones: ["Día", "Tarde", "Mañana"] }
    ],
    salve: [
        { frase: "Dios te salve, Reina y ____ de misericordia", correcta: "Madre", opciones: ["Madre", "Amiga", "Señora"] },
        { frase: "Vida, dulzura y ____ nuestra", correcta: "Esperanza", opciones: ["Esperanza", "Alegría", "Luz"] },
        { frase: "A ti llamamos los desterrados hijos de ____", correcta: "Eva", opciones: ["Eva", "María", "Dios"] }
    ],
    credo: [
        { frase: "Creo en Dios Padre ____", correcta: "Todopoderoso", opciones: ["Todopoderoso", "Creador", "Eterno"] },
        { frase: "Creador del cielo y de la ____", correcta: "Tierra", opciones: ["Tierra", "Universo", "Mundo"] },
        { frase: "Creo en Jesucristo, su ____ Hijo", correcta: "Único", opciones: ["Único", "Primer", "Gran"] }
    ]
};

const MAPA_UI = [
    { id: 'padrenuestro', n: 'Padre Nuestro', i: '🙏', c: '#f97316', nivel: 1 },
    { id: 'avemaria', n: 'Ave María', i: '🌹', c: '#3b82f6', nivel: 2 },
    { id: 'gloria', n: 'Gloria', i: '✨', c: '#a855f7', nivel: 3 },
    { id: 'confieso', n: 'Yo Confieso', i: '🤲', c: '#22c55e', nivel: 4 },
    { id: 'angel', n: 'Ángel', i: '👼', c: '#eab308', nivel: 5 },
    { id: 'salve', n: 'La Salve', i: '👑', c: '#6366f1', nivel: 6 },
    { id: 'credo', n: 'El Credo', i: '📜', c: '#ef4444', nivel: 7 }
];

function renderMap() {
    const container = document.getElementById('level-map');
    container.innerHTML = "";
    MAPA_UI.forEach(lvl => {
        const estaBloqueado = lvl.nivel > userNivelActual;
        const div = document.createElement('div');
        div.className = `flex flex-col items-center animate__animated animate__fadeInUp ${estaBloqueado ? 'opacity-40 grayscale' : ''}`;
        
        div.innerHTML = `
            <div onclick="${estaBloqueado ? "alert('¡Nivel Bloqueado! Completa el anterior.')" : `startLevel('${lvl.id}', ${lvl.nivel})`}" 
                 class="level-btn" 
                 style="background:${estaBloqueado ? '#94a3b8' : lvl.c}; color:white; cursor: ${estaBloqueado ? 'not-allowed' : 'pointer'}">
                ${estaBloqueado ? '🔒' : lvl.i}
            </div>
            <span class="mt-4 glass px-6 py-2 rounded-full font-black text-xs shadow-md uppercase">${lvl.n}</span>
        `;
        container.appendChild(div);
    });
}

let curData = [], curIdx = 0, selAns = "", curNivelNum = 1;

// Reemplaza tu función startLevel por esta:
window.startLevel = (nivelId, nivelNum) => {
    curNivelNum = nivelNum; // Ahora sí guarda el NÚMERO (1, 2, 3...)
    curData = nivelesOraciones[nivelId]; // Usa el ID para buscar la oración
    curIdx = 0;
    
    erroresCometidos = 0;
    startTime = Date.now();
    
    showView('view-game');
    loadStep();
};


function loadStep() {
    const step = curData[curIdx];
    document.getElementById('game-progress').style.width = `${(curIdx / curData.length) * 100}%`;
    document.getElementById('sentence-area').innerHTML = step.frase.replace("____", `<span id="blank" class="text-indigo-600 border-b-4 border-indigo-200 px-4">____</span>`);
    const optDiv = document.getElementById('options-area');
    optDiv.innerHTML = "";
    step.opciones.forEach(o => {
        const b = document.createElement('button');
        b.className = "glass px-8 py-4 rounded-2xl font-black text-xl shadow-lg hover:bg-white transition-all";
        b.innerText = o;
        b.onclick = () => { document.getElementById('blank').innerText = o; selAns = o; };
        optDiv.appendChild(b);
    });
}

document.getElementById('btn-verify').onclick = async () => {
    if(selAns === curData[curIdx].correcta) {
        curIdx++;
        
        
        if(curIdx >= curData.length) {
            // --- 1. LÓGICA DE ESTRELLAS Y TIEMPO ---
            const endTime = Date.now();
            const tiempoTotal = (endTime - startTime) / 1000;
            
            let estrellasGanadas = 1; 
            if (tiempoTotal < 20) estrellasGanadas = 2;
            if (erroresCometidos === 0 && tiempoTotal < 15) estrellasGanadas = 3;
            
            let visualEstrellas = "⭐".repeat(estrellasGanadas);

            // --- 2. DATOS DEL ESTUDIANTE ---
            const userRef = doc(db, "estudiantes", auth.currentUser.uid);
            const snap = await getDoc(userRef);
            const data = snap.data();
    
            let monedasActuales = snap.exists() ? (snap.data().monedas || 0) : 0;
            let nuevasMonedas = monedasActuales + 10;
            let grupoDelNiño = snap.exists() ? (snap.data().grupo || "General") : "General";

            const hoy = new Date().toLocaleDateString();
            let rachaActual = data.racha || 0;
            const ultimaVez = data.ultimaVez || "";

            if (ultimaVez !== hoy) {
                const ayer = new Date();
                ayer.setDate(ayer.getDate() - 1);
                const fechaAyer = ayer.toLocaleDateString();
    
                if (ultimaVez === fechaAyer) {
                    rachaActual++; // Siguió la racha
                } else {
                    rachaActual = 1; // Empezó de nuevo
                }
            }
            // --- 3. GUARDAR EN FIREBASE (CORREGIDO) ---
            // Creamos el objeto de actualización para no repetir código
            const infoParaActualizar = {
                monedas: nuevasMonedas,
                racha: rachaActual,
                ultimaVez: hoy,
            
                [`estrellas.nivel${curNivelNum}`]: estrellasGanadas
            };

            // Si es un nivel nuevo, subimos el nivelActual
            if (curNivelNum === userNivelActual && userNivelActual < 7) {
                userNivelActual++;
                infoParaActualizar.nivelActual = userNivelActual;
            }
            
            await updateDoc(userRef, infoParaActualizar);

            // --- 4. ACTUALIZAR RANKING GLOBAL ---
            const rankingRef = doc(db, "rankings", grupoDelNiño);
            const rankingSnap = await getDoc(rankingRef);

            if (rankingSnap.exists()) {
                await updateDoc(rankingRef, { puntos: (rankingSnap.data().puntos || 0) + 10 });
            } else {
                await setDoc(rankingRef, { puntos: 10 });
            }

            // --- 5. INTERFAZ Y EFECTOS ---
            document.getElementById('display-coins').innerText = nuevasMonedas;
            document.getElementById('display-streak').innerText = rachaActual + " Días";
            window.lanzarConfeti();
            window.lluviaMonedas(); // ¡Que lluevan las monedas!

            // Reemplaza el alert viejo por esto:
            setTimeout(() => {
                window.mostrarVictoria(estrellasGanadas, tiempoTotal, erroresCometidos);
            }, 600);
            window.vibrarExito();

        } else { 
            loadStep(); 
            selAns = ""; 
        
        }
    } else { 
        window.vibrarError();
        // --- LÓGICA DE ERROR ---
        erroresCometidos++; 
        const errorSound = document.getElementById('audio-error');
        errorSound.currentTime = 0;
        errorSound.volume = 0.6;
    
        errorSound.play()
            .then(() => {
                setTimeout(() => { alert("¡Casi! Inténtalo de nuevo 🙏"); }, 400);
            })
            .catch(error => {
                alert("¡Casi! Inténtalo de nuevo 🙏");
            });
    }
};

// --- CONTROL DE SESIÓN ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const snap = await getDoc(doc(db, "estudiantes", user.uid));
        
        if(snap.exists()){
            // Dentro de if(snap.exists()) en onAuthStateChanged
            const hora = new Date().getHours();
            let saludo = "¡Bendiciones!";
            if (hora >= 5 && hora < 12) saludo = "¡Buenos días, valiente!";
            if (hora >= 12 && hora < 19) saludo = "¡Buenas tardes, explorador!";
            if (hora >= 19 || hora < 5) saludo = "¡Buenas noches, ángel!";

            document.getElementById('display-greeting').innerText = saludo;
            const data = snap.data();
            const monedas = data.monedas || 0;
            const grupo = data.grupo || "General";
            
            // 1. Calculamos el rango y el emoji usando las funciones base
            const rango = window.obtenerRango(monedas);
            const emojiGrupo = window.obtenerEmojiGrupo(grupo);

            userNivelActual = data.nivelActual || 1;
            
            // 2. Actualizamos los textos en pantalla
            document.getElementById('display-name').innerText = data.nombre;
            document.getElementById('display-group').innerText = "Grupo: " + grupo;
            document.getElementById('display-coins').innerText = monedas;
            // Actualiza el texto de la racha
            document.getElementById('display-streak').innerText = (data.racha || 0) + " Días";  
            
            // Actualizamos el saldo de la tienda también
            if(document.getElementById('shop-coins')) {
                document.getElementById('shop-coins').innerText = monedas;
            }

            // 3. Actualizamos el Rango (Texto y Color de fondo)
            const rankLabel = document.getElementById('display-rank');
            if(rankLabel) {
                rankLabel.innerText = rango.nombre;
                rankLabel.className = `text-[10px] font-black text-white px-2 py-0.5 rounded-md w-fit mt-1 uppercase tracking-tighter shadow-sm ${rango.color}`;
            }
            
            // 4. Actualizamos el Avatar con el emoji del grupo
            const avatarDiv = document.getElementById('user-avatar');
            if(avatarDiv) {
                avatarDiv.innerText = emojiGrupo;
            }

            // --- NUEVO: APLICAR MEJORAS DE LA TIENDA SI EXISTEN ---
            if (data.items && window.aplicarMejorasVisuales) {
                window.aplicarMejorasVisuales(data.items);
            }
        }

        // Mostramos el dashboard y cargamos el mapa/ranking
        showView('view-dashboard'); 
        renderMap();
        if(window.cargarRanking) window.cargarRanking();

    } else { 
        // Si no hay usuario, mandamos a la pantalla de inicio
        showView('view-landing'); 
    }
});

// Función de Confeti (se mantiene igual)
window.lanzarConfeti = () => {
    const sound = document.getElementById('audio-victory');
    if(sound) {
        sound.currentTime = 0;
        sound.play();
    }

    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
};

import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ... (asegúrate de agregar 'collection', 'getDocs', 'query' y 'orderBy' en tus imports de firestore arriba)

window.cargarRanking = async () => {
    const rankingDiv = document.getElementById('ranking-list');
    const q = query(collection(db, "rankings"), orderBy("puntos", "desc"));
    
    try {
        const querySnapshot = await getDocs(q);
        rankingDiv.innerHTML = "";
        
        let posicion = 1;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const esPrimero = posicion === 1;
            
            rankingDiv.innerHTML += `
                <div class="flex items-center justify-between p-4 ${esPrimero ? 'bg-orange-100 border-2 border-orange-400' : 'bg-white/50'} rounded-2xl shadow-sm">
                    <div class="flex items-center gap-4">
                        <span class="text-2xl font-black ${esPrimero ? 'text-orange-500' : 'text-slate-400'}">#${posicion}</span>
                        <span class="font-black text-slate-800 text-lg">${doc.id}</span>
                    </div>
                    <div class="font-black text-indigo-600 bg-white px-4 py-1 rounded-full shadow-inner">
                        ${data.puntos} 🪙
                    </div>
                </div>
            `;
            posicion++;
        });
    } catch (e) {
        console.error("Error cargando ranking: ", e);
    }
};

window.obtenerRango = (monedas) => {
    if (monedas >= 301) return { nombre: "Maestro de Oración ⭐", color: "bg-yellow-500" };
    if (monedas >= 151) return { nombre: "Guardián 🛡️", color: "bg-green-500" };
    if (monedas >= 51) return { nombre: "Explorador 🧭", color: "bg-blue-500" };
    return { nombre: "Novicio 🌱", color: "bg-slate-500" };
};

window.obtenerEmojiGrupo = (grupo) => {
    const emojis = {
        "San Francisco": "🐺",
        "San Diego": "☀️",
        "Santa Rosa": "🌹",
        "San Antonio": "🍞",
        "Santa Clara": "🕯️"
    };
    return emojis[grupo] || "👤";
};

window.mostrarVictoria = (estrellas, tiempo, errores) => {
    const modal = document.getElementById('modal-victoria');
    const estrellasDiv = document.getElementById('modal-estrellas');
    
    // Ponemos las estrellas amarillas (usando un color real)
    let estrellasHTML = "";
    for(let i=0; i<3; i++) {
        estrellasHTML += `<span style="color: ${i < estrellas ? '#FFD700' : '#CBD5E1'}">★</span>`;
    }
    
    estrellasDiv.innerHTML = estrellasHTML;
    document.getElementById('modal-tiempo').innerText = tiempo.toFixed(1) + "s";
    document.getElementById('modal-errores').innerText = errores;
    
    modal.classList.remove('hidden');
};

window.cerrarVictoria = () => {
    document.getElementById('modal-victoria').classList.add('hidden');
    showView('view-dashboard');
    renderMap();
    if(window.cargarRanking) window.cargarRanking();
};

window.comprarItem = async (itemKey, precio) => {
    const userRef = doc(db, "estudiantes", auth.currentUser.uid);
    const snap = await getDoc(userRef);
    const data = snap.data();
    const monedas = data.monedas || 0;
    const misItems = data.items || [];

    if (misItems.includes(itemKey)) {
        alert("¡Ya tienes este tesoro! 🏆");
        return;
    }

    if (monedas >= precio) {
        const nuevasMonedas = monedas - precio;
        
        await updateDoc(userRef, {
            monedas: nuevasMonedas,
            items: [...misItems, itemKey]
        });

        // Actualizar UI
        document.getElementById('display-coins').innerText = nuevasMonedas;
        document.getElementById('shop-coins').innerText = nuevasMonedas;
        alert("¡Compra exitosa! Revisa tu perfil. ✨");
        
        // Aplicar cambios visuales inmediatamente
        aplicarMejorasVisuales([...misItems, itemKey]);
    } else {
        alert("¡Ups! Te faltan monedas. Sigue practicando. 🪙");
    }
};

window.aplicarMejorasVisuales = (items) => {
    if (items.includes('marcoOro')) {
        document.getElementById('user-avatar').classList.add('border-yellow-400', 'ring-4', 'ring-yellow-200');
    }
    if (items.includes('tituloApostol')) {
        const rankLabel = document.getElementById('display-rank');
        rankLabel.innerText = "Apóstol Legendario 👑";
        rankLabel.className = "text-[10px] font-black text-white px-2 py-0.5 rounded-md w-fit mt-1 uppercase bg-red-600 animate-pulse";
    }
};

let musicaActiva = false;

window.toggleMusica = () => {
    const bgMusic = document.getElementById('audio-bg');
    const btn = document.getElementById('btn-music');
    
    if (!musicaActiva) {
        bgMusic.volume = 0.2; // Música bajita para que no moleste
        bgMusic.play();
        btn.innerText = "🔊";
        musicaActiva = true;
    } else {
        bgMusic.pause();
        btn.innerText = "🔇";
        musicaActiva = false;
    }
};

// --- FEEDBACK TÁCTIL (Vibración) ---
window.vibrarError = () => {
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]); // Vibra dos veces rápido
    }
};

window.vibrarExito = () => {
    if (navigator.vibrate) {
        navigator.vibrate(50); // Una vibración muy corta y sutil
    }
};

window.lluviaMonedas = () => {
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const coin = document.createElement('div');
            coin.innerText = '🪙';
            coin.className = 'coin-particle';
            
            // Salen del centro de la pantalla
            coin.style.left = '50%';
            coin.style.top = '50%';
            
            // Les damos un poquito de desorden para que salgan hacia los lados
            const randomX = (Math.random() * 300 - 150) + 'px';
            coin.style.marginLeft = randomX;
            
            document.body.appendChild(coin);
            
            // Las borramos después de 1 segundo para que no llenen la memoria
            setTimeout(() => coin.remove(), 1000);
        }, i * 100); // Salen una por una (estilo metralleta de monedas)
    }
};