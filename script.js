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
    <h1 class="h1">BIENVENUE SUR ST-PIXEL</h1>
    <p class="pO">🎮 Pour une expérience plus amusante et afin d'éviter les bugs sur ordinateur, veuillez mettre votre page en plein écran ! 🎮</p>
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

  .h1{
  font-size : 40px; 
  }

  .pO{
  align-content: center;
  font-size:15px;  

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











// ----- BOUTON TOGGLE -----
const toggleChatBtn = document.createElement('button');
toggleChatBtn.textContent = '💬';
toggleChatBtn.id = 'toggle-chat-btn';
document.body.appendChild(toggleChatBtn);

let chatVisible = false;

// ----- CHAT UI -----
const chatContainer = document.createElement('div');
chatContainer.id = 'chat-container';
chatContainer.style.display = 'none'; // Chat fermé par défaut
chatContainer.innerHTML = `
  <div id="chat-header">
    💬 Chat
    <button id="change-pseudo-btn" title="Changer pseudo" style="margin-left:10px; font-size:14px; padding:2px 6px; cursor:pointer; border:none; border-radius:6px; background:#ffc107; color:#333;">✎</button>
  </div>
  <div id="chat-messages"></div>
  <div id="chat-input-container">
    <input type="text" id="chat-input" placeholder="Tape ton message ici...">
    <button id="send-chat">➤</button>
  </div>
`;
document.body.appendChild(chatContainer);

// ----- MODALE PSEUDO -----
const modalOverlay = document.createElement('div');
modalOverlay.id = 'modal-overlay';
modalOverlay.style.display = 'none';
modalOverlay.innerHTML = `
  <div id="modal">
    <h2>Choisis ton pseudo</h2>
    <input type="text" id="pseudo-input" placeholder="Ton pseudo">
    <button id="pseudo-ok">OK</button>
  </div>
`;
document.body.appendChild(modalOverlay);

// ----- STYLES -----
const styles = document.createElement('style');
styles.textContent = `
  #toggle-chat-btn {
    position: fixed;
    bottom: 10px;
    right: 10px;
    padding: 10px 16px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 0 8px rgba(0,0,0,0.2);
    z-index: 1000;
    font-size: 14px;
  }
  #toggle-chat-btn:hover {
    background: #218838;
  }
  #chat-container {
    position: fixed;
    bottom: 80px;
    right: 20px;
    width: 320px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
    overflow: hidden;
    font-family: 'Segoe UI', sans-serif;
    font-size: 13px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    border: 1px solid #ddd;
  }
  #chat-header {
    background: #007bff;
    color: white;
    padding: 10px;
    font-weight: bold;
    text-align: center;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #change-pseudo-btn {
    margin-left: 10px;
    font-size: 14px;
    padding: 2px 6px;
    cursor: pointer;
    border: none;
    border-radius: 6px;
    background: #ffc107;
    color: #333;
    transition: background 0.3s ease;
  }
  #change-pseudo-btn:hover {
    background: #e0a800;
  }
  #chat-messages {
    height: 260px;
    padding: 10px;
    overflow-y: auto;
    background: #f5f7fa;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .chat-message {
    max-width: 80%;
    padding: 8px 12px;
    border-radius: 16px;
    font-size: 13px;
    word-wrap: break-word;
    position: relative;
    transition: background 0.3s ease;
  }
  .from-me {
    align-self: flex-end;
    background: #d1e7dd;
    border-bottom-right-radius: 0;
    text-align: right;
  }
  .from-others {
    align-self: flex-start;
    background: #f8d7da;
    border-bottom-left-radius: 0;
    text-align: left;
  }
  .chat-pseudo {
    font-weight: 700;
    font-size: 12px;
    color: #555;
    margin-bottom: 4px;
  }
  .message-info {
    font-size: 10px;
    color: #888;
    margin-top: 4px;
  }
  #chat-input-container {
    display: flex;
    padding: 10px;
    border-top: 1px solid #ddd;
    background: #fff;
  }
  #chat-input {
    flex: 1;
    padding: 8px;
    border-radius: 20px;
    border: 1px solid #ccc;
    font-size: 13px;
    outline: none;
  }
  #send-chat {
    margin-left: 8px;
    background: #007bff;
    color: white;
    border: none;
    padding: 0 16px;
    border-radius: 20px;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  #send-chat:hover {
    background: #0056b3;
  }
  #modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
  }

  #modal {
  background: white;
  padding: 20px 30px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 280px;

  font-family: 'Segoe UI', sans-serif; /* même police que le chat */
  font-size: 16px;
  color: #222;
}


  
  #modal h2 {
    margin: 0;
    font-weight: 700;
    font-size: 18px;
    color: #333;
  }
  #pseudo-input {
    padding: 8px 12px;
    font-size: 14px;
    border-radius: 8px;
    border: 1px solid #ccc;
    outline: none;
  }
  #pseudo-ok {
    padding: 8px 12px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    transition: background 0.2s ease;
  }
  #pseudo-ok:hover {
    background: #218838;
  }
`;
document.head.appendChild(styles);

// ----- DEVICE ID -----
let deviceId = localStorage.getItem("deviceId");
if (!deviceId) {
  deviceId = crypto.randomUUID();
  localStorage.setItem("deviceId", deviceId);
}

// ----- Mots interdits -----
const forbiddenWords = ["merde", "connard", "fdp", "putain"]; // adapte la liste

// ----- UTILITAIRES -----
function containsLink(text) {
  const linkRegex = /(https?:\/\/|www\.)\S+/i;
  return linkRegex.test(text);
}

function containsForbiddenWord(text) {
  const lower = text.toLowerCase();
  return forbiddenWords.some(word => lower.includes(word));
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate();
  const now = new Date();

  const sameDay = date.getFullYear() === now.getFullYear() &&
                  date.getMonth() === now.getMonth() &&
                  date.getDate() === now.getDate();

  if (sameDay) {
    // Affiche hh:mm
    return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  } else {
    // Affiche jj/mm/aaaa
    return date.toLocaleDateString();
  }
}

// ----- MODALE PSEUDO -----
const pseudoInput = document.getElementById('pseudo-input') || (() => {
  const el = document.querySelector('#pseudo-input');
  return el;
})();
const pseudoOkBtn = document.getElementById('pseudo-ok') || (() => {
  const el = document.querySelector('#pseudo-ok');
  return el;
})();

function updateUsername(pseudo) {
  localStorage.setItem("pseudo", pseudo.trim());
}

function openModal() {
  modalOverlay.style.display = "flex";
}

function closeModal() {
  modalOverlay.style.display = "none";
}

// ----- INITIALISATION -----

// On récupère les éléments de chat après ajout au DOM
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat');
const chatMessages = document.getElementById('chat-messages');
const changePseudoBtn = document.getElementById('change-pseudo-btn');

toggleChatBtn.addEventListener('click', () => {
  chatVisible = !chatVisible;
  if (chatVisible) {
    chatContainer.style.display = 'flex';
    toggleChatBtn.textContent = '❌';
  } else {
    chatContainer.style.display = 'none';
    toggleChatBtn.textContent = '💬';
  }
});

// Validation pseudo
pseudoOkBtn.addEventListener('click', () => {
  const pseudo = pseudoInput.value.trim();
  if (pseudo === "") {
    alert("Merci de saisir un pseudo valide.");
    return;
  }
  updateUsername(pseudo);
  closeModal();
  chatContainer.style.display = 'none';  // Chat reste fermé après choix pseudo
  chatVisible = false;
  toggleChatBtn.textContent = '💬';
  pseudoInput.value = "";
});

// Ouvrir modale changement pseudo via bouton
changePseudoBtn.addEventListener('click', () => {
  openModal();
});

// Envoie message
function sendMessage() {
  const text = chatInput.value.trim();
  if (text === "") return;

  if (containsLink(text)) {
    alert("Les liens ne sont pas autorisés dans le chat.");
    return;
  }

  if (containsForbiddenWord(text)) {
    // Juste vider le champ sans envoyer
    chatInput.value = "";
    return;
  }

  const pseudo = localStorage.getItem("pseudo") || "Anonyme";

  db.collection("chat").add({
    message: text,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    deviceId: deviceId,
    pseudo: pseudo,
  });

  chatInput.value = "";
}

sendChatBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Affichage en temps réel
db.collection("chat").orderBy("timestamp", "asc").onSnapshot(snapshot => {
  chatMessages.innerHTML = "";
  snapshot.forEach(doc => {
    const msg = doc.data();
    const bubble = document.createElement('div');
    bubble.classList.add('chat-message');

    if (msg.deviceId === deviceId) {
      bubble.classList.add('from-me');
    } else {
      bubble.classList.add('from-others');
    }

    const pseudoDiv = document.createElement('div');
    pseudoDiv.classList.add('chat-pseudo');
    pseudoDiv.textContent = msg.pseudo || "Anonyme";

    const textDiv = document.createElement('div');
    textDiv.textContent = msg.message;

    const info = document.createElement('div');
    info.classList.add('message-info');
    info.textContent = formatTimestamp(msg.timestamp);

    bubble.appendChild(pseudoDiv);
    bubble.appendChild(textDiv);
    bubble.appendChild(info);

    chatMessages.appendChild(bubble);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Au démarrage, gestion pseudo et chat fermé
const savedPseudo = localStorage.getItem("pseudo");
if (savedPseudo && savedPseudo.trim() !== "") {
  updateUsername(savedPseudo);
  modalOverlay.style.display = "none";
  chatContainer.style.display = "none";
  chatVisible = false;
  toggleChatBtn.textContent = '💬';
} else {
  modalOverlay.style.display = "flex";
  chatContainer.style.display = "none";
  chatVisible = false;
  toggleChatBtn.textContent = '💬';
}
