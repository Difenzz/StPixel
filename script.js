const game = document.querySelector('#game');
const cursor = document.querySelector('#cursor');
game.width = 1200;
game.height = 600;
const gridCellSize = 5;

const ctx = game.getContext('2d');
const gridCtx = game.getContext('2d');

let currentColorChoice = "#000000";
let pixelX, pixelY;
let colorPickerOpen = false;
let cursorFollowEnabled = true;

// Cacher la souris par défaut
game.style.cursor = 'none';

const firebaseConfig = {
    apiKey: "AIzaSyCP8hz2asEyJ8zMOFsq2xBqrDTIsRn0NGA",
    authDomain: "stpixel-7509b.firebaseapp.com",
    projectId: "stpixel-7509b",
    storageBucket: "stpixel-7509b.firebasestorage.app",
    messagingSenderId: "170173332778",
    appId: "1:170173332778:web:ec457cf3f945e99c267253",
    measurementId: "G-5N02M3DN4Q"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const colorInput = document.createElement('input');
colorInput.type = 'color';
colorInput.value = currentColorChoice;
colorInput.style.position = 'absolute';
colorInput.style.display = 'none';
document.body.appendChild(colorInput);

function createPixel(x, y, color) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.fillRect(x, y, gridCellSize, gridCellSize);
}

function clearCanvas() {
    ctx.clearRect(0, 0, game.width, game.height);
    drawGrids(gridCtx, game.width, game.height, gridCellSize, gridCellSize);
}

function drawGrids(ctx, width, height, cellWidth, cellHeight) {
    ctx.beginPath();
    ctx.strokeStyle = "#ccc";
    for (let i = 0; i < width; i++) {
        ctx.moveTo(i * cellWidth, 0);
        ctx.lineTo(i * cellWidth, height);
    }
    for (let i = 0; i < height; i++) {
        ctx.moveTo(0, i * cellHeight);
        ctx.lineTo(width, i * cellHeight);
    }
    ctx.stroke();
}
drawGrids(gridCtx, game.width, game.height, gridCellSize, gridCellSize);

// Curseur personnalisé qui suit la souris uniquement si pas en sélection couleur
game.addEventListener('mousemove', function (event) {
    if (!cursorFollowEnabled) return;

    const rect = game.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const cursorLeft = Math.floor(x / gridCellSize) * gridCellSize;
    const cursorTop = Math.floor(y / gridCellSize) * gridCellSize;

    cursor.style.left = (rect.left + cursorLeft) + "px";
    cursor.style.top = (rect.top + cursorTop) + "px";
});

// Mise à jour des pixels en temps réel depuis Firestore
db.collection('pixels').onSnapshot(function (querySnapshot) {
    querySnapshot.docChanges().forEach(function (change) {
        const { x, y, color } = change.doc.data();
        createPixel(x, y, color);
    });
});

// Modal suppression pixels
const modal = document.createElement('div');
modal.id = 'maModale';
const modalContent = document.createElement('div');
modalContent.className = 'modal-content';
const closeButton = document.createElement('span');
closeButton.innerHTML = '&times;';
closeButton.className = 'close';
const message = document.createElement('p');
message.textContent = 'Êtes-vous sûr de vouloir supprimer tous les pixels ?';
message.className = 'modal-message';
const deleteButton = document.createElement('button');
deleteButton.textContent = 'Confirmer la suppression';
deleteButton.className = 'confirm-button';

modalContent.appendChild(closeButton);
modalContent.appendChild(message);
modalContent.appendChild(deleteButton);
modal.appendChild(modalContent);
document.body.appendChild(modal);

async function deleteAllPixels() {
    const pixelsRef = db.collection("pixels");
    const snapshot = await pixelsRef.get();
    const batch = db.batch();

    snapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    try {
        await batch.commit();
        console.log("Tous les pixels ont été supprimés avec succès !");
        clearCanvas();
        modal.style.display = "none";
    } catch (error) {
        console.error("Erreur lors de la suppression des pixels : ", error);
    }
}

deleteButton.addEventListener("click", deleteAllPixels);
closeButton.onclick = () => { modal.style.display = "none"; };
window.onclick = (event) => { if (event.target === modal) modal.style.display = "none"; };
document.getElementById("ouvrirModal").addEventListener("click", () => { modal.style.display = "block"; });

// Bouton Valider
const validateBtn = document.createElement('button');
validateBtn.textContent = "👍";
validateBtn.style.position = 'absolute';
validateBtn.style.display = 'none';
validateBtn.style.padding = '8px 16px';
validateBtn.style.backgroundColor = '#28a745';
validateBtn.style.color = 'white';
validateBtn.style.border = 'none';
validateBtn.style.borderRadius = '4px';
validateBtn.style.cursor = 'pointer';
validateBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
validateBtn.style.fontWeight = 'bold';
validateBtn.style.fontSize = '14px';
validateBtn.style.zIndex = '1000';
validateBtn.style.transition = 'background-color 0.3s ease';
validateBtn.onmouseenter = () => validateBtn.style.backgroundColor = '#218838';
validateBtn.onmouseleave = () => validateBtn.style.backgroundColor = '#28a745';
document.body.appendChild(validateBtn);

// Ouvrir color picker au clic
game.addEventListener('click', (event) => {
    const rect = game.getBoundingClientRect();
    const clickX = Math.floor((event.clientX - rect.left) / gridCellSize) * gridCellSize;
    const clickY = Math.floor((event.clientY - rect.top) / gridCellSize) * gridCellSize;

    if (colorPickerOpen && clickX === pixelX && clickY === pixelY) {
        return;
    }

    pixelX = clickX;
    pixelY = clickY;

    colorInput.value = currentColorChoice;
    colorInput.style.left = `${event.clientX}px`;
    colorInput.style.top = `${event.clientY}px`;
    colorInput.style.display = 'block';

    validateBtn.style.left = `${event.clientX + colorInput.offsetWidth + 5}px`;
    validateBtn.style.top = `${event.clientY}px`;
    validateBtn.style.display = 'block';

    // Bloquer curseur personnalisé
    cursorFollowEnabled = false;

    // Fixer le curseur sur le pixel choisi
    cursor.style.left = (rect.left + pixelX) + 'px';
    cursor.style.top = (rect.top + pixelY) + 'px';

    // Montrer la souris native
    game.style.cursor = 'default';

    colorInput.focus();
    colorPickerOpen = true;
});

// Valider la couleur sélectionnée
validateBtn.addEventListener('click', () => {
    currentColorChoice = colorInput.value;
    createPixel(pixelX, pixelY, currentColorChoice);

    const pixel = { x: pixelX, y: pixelY, color: currentColorChoice };
    const pixelRef = db.collection('pixels').doc(`${pixel.x}-${pixel.y}`);
    pixelRef.set(pixel, { merge: true }).catch(console.error);

    colorInput.style.display = 'none';
    validateBtn.style.display = 'none';
    colorPickerOpen = false;

    // Réactiver le curseur personnalisé
    cursorFollowEnabled = true;

    // Cacher la souris native
    game.style.cursor = 'none';
});


// Créer la modale
const fullscreenModal = document.createElement('div');
fullscreenModal.id = 'fullscreenModal';
fullscreenModal.innerHTML = `
  <div class="fullscreen-modal-content">
    <p>🎮 Pour une expérience plus amusante et afin d'éviter les bugs sur ordinateur, veuillez mettre votre page en plein écran !</p>
    <button id="closeFullscreenModal">OK</button>
  </div>
`;
document.body.appendChild(fullscreenModal);

const style = document.createElement('style');
style.textContent = `
  #fullscreenModal {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 2000;
  }
  .fullscreen-modal-content {
    background: white;
    padding: 20px 30px;
    border-radius: 12px;
    text-align: center;
    max-width: 400px;
    font-size: 16px;
    font-family: sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: pop 0.3s ease-out;
  }
  /* ✅ Bouton de la modale — vert même en dark mode */
  .fullscreen-modal-content button {
    margin-top: 15px;
    padding: 8px 16px;
    background: #00720a !important;  /* forçage ici */
    border: none !important;
    color: white !important;
    font-weight: bold;
    border-radius: 6px;
    cursor: pointer;
  }
  .fullscreen-modal-content button:hover {
    background: rgb(0, 226, 38) !important;
  }

  /* Optional: support for dark modal */
  body.dark-mode .fullscreen-modal-content {
    background: #1e1e1e;
    color: #f0f0f0;
    box-shadow: 0 4px 12px rgba(255,255,255,0.1);
  }

  @keyframes pop {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;
document.head.appendChild(style);

// Affichage conditionnel
window.addEventListener('load', () => {
  const isDesktop = window.innerWidth > 768;
  if (isDesktop) {
    fullscreenModal.style.display = 'flex';
  }
});

// Fermeture de la modale
document.getElementById('closeFullscreenModal').addEventListener('click', () => {
  fullscreenModal.style.display = 'none';
});

// DARK MODE 
const darkModeBtn = document.createElement('button');
darkModeBtn.textContent = '🌙 Mode sombre';
darkModeBtn.style.position = 'absolute';
darkModeBtn.style.top = '10px';
darkModeBtn.style.right = '10px';
darkModeBtn.style.padding = '8px 16px';
darkModeBtn.style.border = 'none';
darkModeBtn.style.borderRadius = '30px';  // Corrigé pour avoir un vrai arrondi
darkModeBtn.style.cursor = 'pointer';
darkModeBtn.style.backgroundColor = '#222';
darkModeBtn.style.color = 'white';
darkModeBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
darkModeBtn.style.fontWeight = 'bold';
darkModeBtn.style.zIndex = '1001';
document.body.appendChild(darkModeBtn);

const image = document.querySelector('.stpix'); // cible l'image à changer

function updateImageSrc(isDark) {
    if (!image) return; // si pas d'image, ne rien faire
    image.src = isDark ? 'darkstpix.png' : 'stpix.png';
}

darkModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');

    const isDark = document.body.classList.contains('dark-mode');
    darkModeBtn.textContent = isDark ? '☀️ Mode clair' : '🌙 Mode sombre';

    updateImageSrc(isDark);

    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
});

// Au chargement de la page, applique l'état sauvegardé
const savedMode = localStorage.getItem('darkMode');
if (savedMode === 'enabled') {
    document.body.classList.add('dark-mode');
    darkModeBtn.textContent = '☀️ Mode clair';
    updateImageSrc(true);
} else {
    updateImageSrc(false);
}
