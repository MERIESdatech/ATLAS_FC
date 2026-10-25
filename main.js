
const playerModal = document.getElementById('playerModal');
const openPlayerModal = document.getElementById('openPlayerModal');
const closePlayerModal = document.getElementById('closePlayerModal');
const cancelPlayerModal = document.getElementById('cancelPlayerModal');
const modalTitle = document.getElementById('modalTitle');
const playerForm = document.getElementById('playerForm');
const playerName = document.getElementById('playerName');
const playerNumber = document.getElementById('playerNumber');
const nameError = document.getElementById('nameError');
const posteError = document.getElementById('posteError');
const numberError = document.getElementById('numberError');
const playerList = document.getElementById('playerList');
const playerCount = document.getElementById('playerCount');
const terrain = document.querySelector('.terrain-grid');
const confirmBar = document.getElementById('confirmBar');
const confirmText = document.getElementById('confirmText');
const confirmDelete = document.getElementById('confirmDelete');
const cancelDelete = document.getElementById('cancelDelete');


const storageKey = 'atlas-fc-players';
let players = [];
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(saved)) {
    players = saved.filter(p => p && typeof p.name === 'string' && positionsForRole(p.role).length && Number.isInteger(Number(p.number))).map(p => ({ ...p, id: p.id || makeId(), position: positionsForRole(p.role).includes(p.position) ? p.position : null }));
    const used = new Set();
    players.forEach(p => { if (p.position && used.has(p.position)) p.position = null; if (p.position) used.add(p.position); });
  }
} catch (error) { console.warn('Sauvegarde illisible', error); }
function positionsForRole(role) { return ({GB:['gb'], DEF:['dg','dc1','dc2','dd'], MIL:['mg','mc1','mc2','md'], ATT:['bu1','bu2']})[role] || []; }
function makeId() { return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'player-' + Date.now() + '-' + Math.random().toString(36).slice(2); }
function savePlayers() { try { localStorage.setItem(storageKey, JSON.stringify(players)); } catch (error) { console.warn('Sauvegarde impossible', error); } }
let notificationTimer;
function notify(message) {
  const el = document.getElementById('notification');
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(notificationTimer);
  notificationTimer = setTimeout(() => el.classList.add('hidden'), 3000);
}

let editingPlayer = null;
let playerToDelete = null;
let draggedPlayer = null;

const positions = {
  GB: ['gb'],
  DEF: ['dg', 'dc1', 'dc2', 'dd'],
  MIL: ['mg', 'mc1', 'mc2', 'md'],
  ATT: ['bu1', 'bu2']
};

const images = {
  GB: 'assets/players/goolkeeper.png',
  DEF: 'assets/players/def-player.png',
  MIL: 'assets/players/mil-player.png',
  ATT: 'assets/players/att-player.png'
};

const colors = {
  GB: '#fbbf24',
  DEF: '#3b9cff',
  MIL: '#22c55e',
  ATT: '#ef334b'
};

const nameRegex = /^[a-zA-ZÀ-ÿ ]+$/;
const numberRegex = /^[1-9][0-9]?$/;


function openModal(player) {
  editingPlayer = player;
  playerForm.reset();

  if (player) {
    modalTitle.textContent = 'Modifier un joueur';
    playerForm.querySelector('[type="submit"]').textContent = 'Enregistrer';
    playerName.value = player.name;
    playerNumber.value = player.number;
    playerForm.querySelector('[name="poste"][value="' + player.role + '"]').checked = true;
  } else {
    modalTitle.textContent = 'Ajouter un joueur';
    playerForm.querySelector('[type="submit"]').textContent = 'Ajouter';
  }

  nameError.textContent = '';
  posteError.textContent = '';
  numberError.textContent = '';

  playerModal.classList.remove('hidden');
  playerModal.classList.add('flex');
  document.body.classList.add('overflow-hidden');
  playerName.focus();
}

function closeModal() {
  playerModal.classList.add('hidden');
  playerModal.classList.remove('flex');
  document.body.classList.remove('overflow-hidden');
  editingPlayer = null;
  openPlayerModal.focus();
}


function validateName() {
  let value = playerName.value.trim();
  let valid = value.length >= 3 && value.length <= 30 && nameRegex.test(value);

  if (valid) {
    nameError.textContent = '';
  } else {
    playerName.nextElementSibling.textContent = 'Nom obligatoire : 3 à 30 caractères, lettres uniquement.';
  }
  return valid;
}

function validateRole() {
  let checked = playerForm.querySelector('[name="poste"]:checked');
  let valid = checked !== null;

  if (valid) {
    posteError.textContent = '';
  } else {
    posteError.textContent = 'Veuillez choisir un poste.';
  }
  return valid;
}

function validateNumber() {
  let value = playerNumber.value.trim();
  let formatOk = numberRegex.test(value);
  let duplicate = false;

  for (let i = 0; i < players.length; i++) {
    if (String(players[i].number) === value && players[i] !== editingPlayer) {
      duplicate = true;
    }
  }

  if (!formatOk) {
    playerNumber.nextElementSibling.textContent = 'Numéro obligatoire entre 1 et 99.';
  } else if (duplicate) {
    playerNumber.nextElementSibling.textContent = 'Ce numéro est déjà utilisé.';
  } else {
    numberError.textContent = '';
  }
  return formatOk && !duplicate;
}


function findFreePosition(role) {
  let roleCells = positions[role];

  for (let i = 0; i < roleCells.length; i++) {
    let taken = false;
    for (let j = 0; j < players.length; j++) {
      if (players[j].position === roleCells[i]) {
        taken = true;
      }
    }
    if (!taken) {
      return roleCells[i];
    }
  }
  return null;
}

function togglePlayerPosition(player) {
  if (player.position) {
    player.position = null;
  } else {
    let free = findFreePosition(player.role);
    if (!free) {
      notify('Aucune position libre pour ce poste.');
      return;
    }
    player.position = free;
  }
  renderPlayers();
  notify(player.position ? 'Joueur placé sur le terrain.' : 'Joueur retourné au banc.');
}


function askDeleteConfirmation(player) {
  playerToDelete = player;
  confirmText.textContent = 'Supprimer ' + player.name + ' ?';
  confirmBar.classList.remove('hidden');
  confirmBar.classList.add('flex');
  cancelDelete.focus();
}

function closeConfirmBar() {
  playerToDelete = null;
  confirmBar.classList.add('hidden');
  confirmBar.classList.remove('flex');
}

function deletePlayer() {
  if (playerToDelete) {
    const item = document.querySelector('[data-player-id="' + playerToDelete.id + '"]');
    if (item) item.closest('.sidebar-player').remove();
    players = players.filter(p => p.id !== playerToDelete.id);
    notify('Joueur supprimé.');
    renderPlayers();
  }
  closeConfirmBar();
}


function makeButton(icon, action, label, player) {
  let button = document.createElement('button');
  button.type = 'button';
  button.className = 'sidebar-action ' + action + ' inline-flex items-center justify-center size-[27px] border border-[#35505a] rounded-[7px] bg-[#102731] text-white text-xs hover:bg-[#21424d] hover:border-[#c7a95b]';
  button.title = label;
  button.setAttribute('aria-label', label + ' ' + player.name);
  button.innerHTML = '<i aria-hidden="true" class="fa-solid fa-' + icon + '"></i>';
  return button;
}

function createSidebarItem(player) {
  let li = document.createElement('li');
  li.className = 'sidebar-player grid grid-cols-[31px_minmax(0,1fr)_auto] items-center gap-2 min-h-[75px] px-1 py-2 border-b border-[#20343b] odd:bg-[#10232b85]';
  li.dataset.role = player.role;
  li.dataset.playerId = player.id;
  if (player.position) li.classList.add('player-placed');
  li.draggable = true;
  li.title = 'Glisser vers une position sur le terrain';
  li.addEventListener('dragstart', function (event) {
    draggedPlayer = player;
    event.dataTransfer.setData('text/plain', String(players.indexOf(player)));
    event.dataTransfer.effectAllowed = 'move';
    showAvailablePositions(player);
  });
  li.addEventListener('dragend', function () {
    draggedPlayer = null;
    renderPlayers();
  });
  li.style.borderLeft = '3px solid ' + colors[player.role];
  let shirt = document.createElement('img');
  shirt.src = images[player.role];
  shirt.alt = 'Maillot de ' + player.name;
  shirt.className = 'sidebar-shirt w-[31px] h-[35px] object-contain';
  let info = document.createElement('span');
  info.className = 'sidebar-player-info grid gap-0.5 min-w-0';
  let name = document.createElement('strong');
  name.className = 'sidebar-player-name text-xs font-extrabold text-white break-words';
  name.textContent = player.name;
  let status = 'Banc';
  if (player.position) {
    status = 'Terrain';
  }
  let meta = document.createElement('small');
  meta.className = 'sidebar-player-meta text-[10px]';
  meta.style.color = colors[player.role];
  meta.textContent = '#' + player.number + ' · ' + player.role + ' · ' + status;

  info.append(name, meta);

  
  let selectLabel = 'Sélectionner';
  if (player.position) {
    selectLabel = 'Retour au banc';
  }
  let selectButton = makeButton('check', 'select-action', selectLabel, player);
  let editButton = makeButton('pen', 'edit-action', 'Modifier', player);
  let removeButton = makeButton('trash', 'remove-action', 'Supprimer', player);

  selectButton.addEventListener('click', function () {
    togglePlayerPosition(player);
  });
  editButton.addEventListener('click', function () {
    openModal(player);
  });
  removeButton.addEventListener('click', function () {
    askDeleteConfirmation(player);
  });

  let positionSelect = document.createElement('select');
  positionSelect.className = 'position-select rounded bg-[#102731] text-white text-[10px] border border-[#35505a] max-w-[90px]';
  positionSelect.setAttribute('aria-label', 'Position de ' + player.name);
  positionSelect.dataset.playerId = player.id;
  positionSelect.innerHTML = '<option value="">Banc</option>';
  positions[player.role].forEach(pos => {
    const option = document.createElement('option');
    option.value = pos;
    option.textContent = pos.toUpperCase();
    option.disabled = players.some(p => p.id !== player.id && p.position === pos);
    positionSelect.append(option);
  });
  positionSelect.value = player.position || '';
  info.append(positionSelect);
  let actions = document.createElement('span');
  actions.className = 'sidebar-actions flex items-center gap-1';
  actions.append(selectButton, editButton, removeButton);

  li.append(shirt, info, actions);
  return li;
}

function createPitchPlayer(player) {
  let article = document.createElement('article');
  article.className = 'pitch-player ' + player.position + ' color-' + player.role.toLowerCase();
  article.title = player.name;
  article.setAttribute('aria-label', player.name + ', numéro ' + player.number);

  let figure = document.createElement('figure');
  figure.className = 'shirt';

  let image = document.createElement('img');
  image.src = images[player.role];
  image.alt = 'Maillot de ' + player.name;

  let number = document.createElement('span');
  number.textContent = player.number;

  figure.append(image, number);

  let role = document.createElement('small');
  role.className = 'pitch-role';
  role.textContent = player.position.replace(/[0-9]/g, '').toUpperCase();

  let playerLabel = document.createElement('strong');
  playerLabel.className = 'pitch-name';
  playerLabel.textContent = player.name;
  article.append(playerLabel, figure, role);
  return article;
}


function showAvailablePositions(player) {
  terrain.querySelectorAll('.pitch-slot').forEach(slot => {
    const occupied = players.some(p => p.id !== player.id && p.position === slot.dataset.position);
    slot.classList.toggle('drop-position', slot.dataset.role === player.role && !occupied);
  });
}

function renderPlayers() {
  playerList.innerHTML = '';
  playerCount.textContent = players.length;
  document.getElementById('placedCount').textContent = 'Joueurs placés : ' + players.filter(p => p.position).length + ' / 11';
  terrain.querySelectorAll('.pitch-slot').forEach(slot => {
    slot.querySelectorAll('.pitch-player').forEach(child => child.remove());
    slot.classList.remove('drop-position');
    const player = players.find(p => p.position === slot.dataset.position);
    slot.querySelector('.slot-status').textContent = slot.dataset.position.toUpperCase() + ' · ' + (player ? 'Occupée' : 'Libre');
    slot.setAttribute('aria-label', slot.dataset.position.toUpperCase() + ' : ' + (player ? 'Occupée par ' + player.name : 'Libre'));
    if (player) slot.append(createPitchPlayer(player));
  });
  players.forEach(player => playerList.append(createSidebarItem(player)));
  savePlayers();
}

playerList.addEventListener('change', function(event) {
  const select = event.target.closest('.position-select');
  if (!select) return;
  const player = players.find(p => p.id === select.dataset.playerId);
  if (!player) return;
  const target = select.value;
  if (target && (!positions[player.role].includes(target) || players.some(p => p.id !== player.id && p.position === target))) {
    notify('Position incompatible ou occupée.');
    renderPlayers();
    return;
  }
  player.position = target || null;
  renderPlayers();
  notify(target ? 'Joueur placé sur le terrain.' : 'Joueur retourné au banc.');
});

terrain.addEventListener('dragover', function(event) {
  const slot = event.target.closest('.pitch-slot');
  if (slot && draggedPlayer && slot.dataset.role === draggedPlayer.role && !players.some(p => p.id !== draggedPlayer.id && p.position === slot.dataset.position)) event.preventDefault();
});
terrain.addEventListener('drop', function(event) {
  const slot = event.target.closest('.pitch-slot');
  if (!slot || !draggedPlayer) return;
  event.preventDefault();
  if (slot.dataset.role !== draggedPlayer.role || players.some(p => p.id !== draggedPlayer.id && p.position === slot.dataset.position)) {
    notify('Position incompatible ou occupée.');
    return;
  }
  draggedPlayer.position = slot.dataset.position;
  draggedPlayer = null;
  renderPlayers();
  notify('Joueur placé sur le terrain.');
});


function handleSubmit(event) {
  event.preventDefault();

  let nameValid = validateName();
  let roleValid = validateRole();
  let numberValid = validateNumber();

  if (!nameValid || !roleValid || !numberValid) {
    return;
  }

  let name = playerName.value.trim();
  let role = playerForm.querySelector('[name="poste"]:checked').value;
  let number = Number(playerNumber.value);

  if (editingPlayer) {
    
    if (editingPlayer.role !== role) {
      editingPlayer.position = null;
    }
    editingPlayer.name = name;
    editingPlayer.role = role;
    editingPlayer.number = number;
  } else {
    players.push({ id: makeId(), name: name, role: role, number: number, position: null });
  }

  renderPlayers();
  playerForm.reset();
  closeModal();
  notify(editingPlayer ? 'Joueur modifié.' : 'Effectif enregistré.');
}


openPlayerModal.addEventListener('click', function () {
  openModal(null);
});
closePlayerModal.addEventListener('click', closeModal);
cancelPlayerModal.addEventListener('click', closeModal);

document.getElementById('modalContent').addEventListener('click', function(event) { event.stopPropagation(); });
playerModal.addEventListener('click', function (event) {
  if (event.target === playerModal) {
    closeModal();
  }
});

document.addEventListener('keydown', function (event) {
  if (event.key !== 'Escape') {
    return;
  }
  if (!confirmBar.classList.contains('hidden')) {
    closeConfirmBar();
  } else if (!playerModal.classList.contains('hidden')) {
    closeModal();
  }
});

confirmDelete.addEventListener('click', deletePlayer);
cancelDelete.addEventListener('click', closeConfirmBar);
playerName.addEventListener('input', validateName);
playerNumber.addEventListener('input', validateNumber);

const radios = playerForm.querySelectorAll('[name="poste"]');
for (let i = 0; i < radios.length; i++) {
  radios[i].addEventListener('change', validateRole);
}

playerForm.addEventListener('submit', handleSubmit);
renderPlayers();