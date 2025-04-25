const game = document.querySelector('#game');
const cursor = document.querySelector('#cursor');
game.width = 1200;
game.height = 600;
const gridCellSize = 5;

const ctx = game.getContext('2d');
const gridCtx = game.getContext('2d');

let currentColorChoice = "#000000"; // Couleur par défaut

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

// Ajout d'un champ de saisie pour le code hexadécimal
const colorInput = document.createElement('input');
colorInput.type = 'color'; // Utiliser un input de type color pour choisir la couleur
colorInput.value = currentColorChoice; // Valeur par défaut
document.body.appendChild(colorInput); // Ajouter l'input au body

colorInput.addEventListener('input', (event) => {
    currentColorChoice = event.target.value; // Mettre à jour la couleur actuelle
});

// Fonction pour créer un pixel
function createPixel(x, y, color) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.fillRect(x, y, gridCellSize, gridCellSize);
}

// Fonction pour ajouter un pixel dans le jeu
function addPixelIntoGame() {
    if (!currentColorChoice) {
        console.error("currentColorChoice is undefined");
        return; // Ne pas continuer si currentColorChoice n'est pas défini
    }

    const x = cursor.offsetLeft;
    const y = cursor.offsetTop - game.offsetTop;

    createPixel(x, y, currentColorChoice);

    const pixel = {
        x,
        y,
        color: currentColorChoice
    };

    const pixelRef = db.collection('pixels').doc(`${pixel.x}-${pixel.y}`);
    pixelRef.set(pixel, { merge: true }).catch(error => {
        console.error("Error adding pixel to Firestore: ", error);
    });
}

// Écouter le clic sur le canvas pour ajouter un pixel
game.addEventListener('click', addPixelIntoGame);

// Fonction pour dessiner la grille
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

// Écouter le mouvement de la souris pour déplacer le curseur
game.addEventListener('mousemove', function (event) {
    const cursorLeft = event.clientX - (cursor.offsetWidth / 2);
    const cursorTop = event.clientY - (cursor.offsetHeight / 2);

    cursor.style.left = Math.floor(cursorLeft / gridCellSize) * gridCellSize + "px";
    cursor.style.top = Math.floor(cursorTop / gridCellSize) * gridCellSize + "px";
});

// Écouter les changements dans Firestore pour mettre à jour le canvas
db.collection('pixels').onSnapshot(function (querySnapshot) {
    querySnapshot.docChanges().forEach(function (change) {
        const { x, y, color } = change.doc.data();
        createPixel(x, y, color);
    });
});
// Créer la modale
const modal = document.createElement('div');
modal.id = 'maModale';

// Créer le contenu de la modale
const modalContent = document.createElement('div');
modalContent.className = 'modal-content'; // Appliquer la classe CSS

// Créer le bouton de fermeture
const closeButton = document.createElement('span');
closeButton.innerHTML = '&times;';
closeButton.className = 'close'; // Appliquer la classe CSS

// Créer le message
const message = document.createElement('p');
message.textContent = 'Êtes-vous sûr de vouloir supprimer tous les pixels ?';
message.className = 'modal-message'; // Appliquer la classe CSS

// Créer le bouton de confirmation
const deleteButton = document.createElement('button');
deleteButton.textContent = 'Confirmer la suppression';
deleteButton.className = 'confirm-button'; // Appliquer la classe CSS

// Ajouter les éléments à la modale
modalContent.appendChild(closeButton);
modalContent.appendChild(message);
modalContent.appendChild(deleteButton);
modal.appendChild(modalContent);
document.body.appendChild(modal);

// Fonction pour supprimer tous les documents de la collection
async function deleteAllPixels() {
    const pixelsRef = db.collection("pixels");
    const snapshot = await pixelsRef.get();

    const batch = db.batch(); // Utiliser un batch pour supprimer plusieurs documents à la fois

    snapshot.forEach(doc => {
        batch.delete(doc.ref); // Ajouter chaque document à la batch
    });

    try {
        await batch.commit(); // Exécuter la batch
        console.log("Tous les pixels ont été supprimés avec succès !");
        modal.style.display = "none"; // Fermer la modale après la suppression
    } catch (error) {
        console.error("Erreur lors de la suppression des pixels : ", error);
    }
}

// Écouter le clic sur le bouton pour supprimer tous les pixels
deleteButton.addEventListener("click", deleteAllPixels);

// Écouter le clic sur le bouton de fermeture
closeButton.onclick = function() {
    modal.style.display = "none";
}

// Écouter le clic en dehors de la modale pour la fermer
window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
}

// Écouter le clic sur le bouton pour ouvrir la modale
deleteButton.addEventListener("click", deleteAllPixels);

// Écouter le clic sur le bouton de fermeture
closeButton.onclick = function() {
    modal.style.display = "none";
}

// Écouter le clic en dehors de la modale pour la fermer
window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
}

// Écouter le clic sur le bouton pour ouvrir la modale
document.getElementById("ouvrirModal").addEventListener("click", function() {
    modal.style.display = "block";
});