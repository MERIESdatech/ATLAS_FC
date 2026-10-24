
var playerModal = document.getElementById('playerModal');
var openPlayerModal = document.getElementById('openPlayerModal');
var closePlayerModal = document.getElementById('closePlayerModal');
var cancelPlayerModal = document.getElementById('cancelPlayerModal');
var modalTitle = document.getElementById('modalTitle');
var playerForm = document.getElementById('playerForm');
var playerName = document.getElementById('playerName');
var playerNumber = document.getElementById('playerNumber');
var nameError = document.getElementById('nameError');
var posteError = document.getElementById('posteError');
var numberError = document.getElementById('numberError');
var playerList = document.getElementById('playerList');
var playerCount = document.getElementById('playerCount');
var terrain = document.querySelector('.terrain-grid');
var confirmBar = document.getElementById('confirmBar');
var confirmText = document.getElementById('confirmText');
var confirmDelete = document.getElementById('confirmDelete');
var cancelDelete = document.getElementById('cancelDelete');


var players = [];
var editingPlayer = null;
var playerToDelete = null;

var positions = {
  GB: ['gb'],
  DEF: ['dg', 'dc1', 'dc2', 'dd'],
  MIL: ['mg', 'mc1', 'mc2', 'md'],
  ATT: ['bu1', 'bu2']
};

var images = {
  GB: 'assets/players/goolkeeper.png',
  DEF: 'assets/players/def-player.png',
  MIL: 'assets/players/mil-player.png',
  ATT: 'assets/players/att-player.png'
};

var colors = {
  GB: '#fbbf24',
  DEF: '#3b9cff',
  MIL: '#22c55e',
  ATT: '#ef334b'
};

var nameRegex = /^[\p{L}]+(?:[ '\-][\p{L}]+)*$/u;
var numberRegex = /^(?:[1-9]|[1-9][0-9])$/;


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
  var value = playerName.value.trim();
  var valid = value.length >= 3 && value.length <= 30 && nameRegex.test(value);

  if (valid) {
    nameError.textContent = '';
  } else {
    nameError.textContent = 'Nom obligatoire : 3 à 30 caractères, lettres uniquement.';
  }
  return valid;
}

function validateRole() {
  var checked = playerForm.querySelector('[name="poste"]:checked');
  var valid = checked !== null;

  if (valid) {
    posteError.textContent = '';
  } else {
    posteError.textContent = 'Veuillez choisir un poste.';
  }
  return valid;
}

function validateNumber() {
  var value = playerNumber.value.trim();
  var formatOk = numberRegex.test(value);
  var duplicate = false;

  for (var i = 0; i < players.length; i++) {
    if (String(players[i].number) === value && players[i] !== editingPlayer) {
      duplicate = true;
    }
  }

  if (!formatOk) {
    numberError.textContent = 'Numéro obligatoire entre 1 et 99.';
  } else if (duplicate) {
    numberError.textContent = 'Ce numéro est déjà utilisé.';
  } else {
    numberError.textContent = '';
  }
  return formatOk && !duplicate;
}


function findFreePosition(role) {
  var roleCells = positions[role];

  for (var i = 0; i < roleCells.length; i++) {
    var taken = false;
    for (var j = 0; j < players.length; j++) {
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
    var free = findFreePosition(player.role);
    if (!free) {
      alert('Aucune position libre pour ce poste.');
      return;
    }
    player.position = free;
  }
  renderPlayers();
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
    var index = players.indexOf(playerToDelete);
    players.splice(index, 1);
    renderPlayers();
  }
  closeConfirmBar();
}


function makeButton(icon, action, label, player) {
  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'sidebar-action ' + action + ' inline-flex items-center justify-center size-[27px] border border-[#35505a] rounded-[7px] bg-[#102731] text-white text-xs hover:bg-[#21424d] hover:border-[#c7a95b]';
  button.title = label;
  button.setAttribute('aria-label', label + ' ' + player.name);
  button.innerHTML = '<i aria-hidden="true" class="fa-solid fa-' + icon + '"></i>';
  return button;
}

function createSidebarItem(player) {
  var li = document.createElement('li');
  li.className = 'sidebar-player grid grid-cols-[31px_minmax(0,1fr)_auto] items-center gap-2 min-h-[75px] px-1 py-2 border-b border-[#20343b] odd:bg-[#10232b85]';
  li.dataset.role = player.role;
  li.style.borderLeft = '3px solid ' + colors[player.role];
  var shirt = document.createElement('img');
  shirt.src = images[player.role];
  shirt.alt = 'Maillot de ' + player.name;
  shirt.className = 'sidebar-shirt w-[31px] h-[35px] object-contain';
  var info = document.createElement('span');
  info.className = 'sidebar-player-info grid gap-0.5 min-w-0';
  var name = document.createElement('strong');
  name.className = 'sidebar-player-name text-xs font-extrabold text-white break-words';
  name.textContent = player.name;
  var status = 'Banc';
  if (player.position) {
    status = 'Terrain';
  }
  var meta = document.createElement('small');
  meta.className = 'sidebar-player-meta text-[10px]';
  meta.style.color = colors[player.role];
  meta.textContent = '#' + player.number + ' · ' + player.role + ' · ' + status;

  info.append(name, meta);

  
  var selectLabel = 'Sélectionner';
  if (player.position) {
    selectLabel = 'Retour au banc';
  }
  var selectButton = makeButton('check', 'select-action', selectLabel, player);
  var editButton = makeButton('pen', 'edit-action', 'Modifier', player);
  var removeButton = makeButton('trash', 'remove-action', 'Supprimer', player);

  selectButton.addEventListener('click', function () {
    togglePlayerPosition(player);
  });
  editButton.addEventListener('click', function () {
    openModal(player);
  });
  removeButton.addEventListener('click', function () {
    askDeleteConfirmation(player);
  });

  var actions = document.createElement('span');
  actions.className = 'sidebar-actions flex items-center gap-1';
  actions.append(selectButton, editButton, removeButton);

  li.append(shirt, info, actions);
  return li;
}

function createPitchPlayer(player) {
  var article = document.createElement('article');
  article.className = 'pitch-player ' + player.position + ' color-' + player.role.toLowerCase();
  article.title = player.name;

  var figure = document.createElement('figure');
  figure.className = 'shirt';

  var image = document.createElement('img');
  image.src = images[player.role];
  image.alt = 'Maillot de ' + player.name;

  var number = document.createElement('span');
  number.textContent = player.number;

  figure.append(image, number);

  var role = document.createElement('small');
  role.className = 'pitch-role';
  role.textContent = player.position.replace(/[0-9]/g, '').toUpperCase();

  article.append(figure, role);
  return article;
}


function renderPlayers() {
  playerList.innerHTML = '';
  terrain.innerHTML = '';
  playerCount.textContent = players.length;

  for (var i = 0; i < players.length; i++) {
    var player = players[i];

    playerList.append(createSidebarItem(player));

    if (player.position) {
      terrain.append(createPitchPlayer(player));
    }
  }
}


function handleSubmit(event) {
  event.preventDefault();

  var nameValid = validateName();
  var roleValid = validateRole();
  var numberValid = validateNumber();

  if (!nameValid || !roleValid || !numberValid) {
    return;
  }

  var name = playerName.value.trim();
  var role = playerForm.querySelector('[name="poste"]:checked').value;
  var number = Number(playerNumber.value);

  if (editingPlayer) {
    
    if (editingPlayer.role !== role) {
      editingPlayer.position = null;
    }
    editingPlayer.name = name;
    editingPlayer.role = role;
    editingPlayer.number = number;
  } else {
    players.push({ name: name, role: role, number: number, position: null });
  }

  renderPlayers();
  playerForm.reset();
  closeModal();
}


openPlayerModal.addEventListener('click', function () {
  openModal(null);
});
closePlayerModal.addEventListener('click', closeModal);
cancelPlayerModal.addEventListener('click', closeModal);

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

var radios = playerForm.querySelectorAll('[name="poste"]');
for (var i = 0; i < radios.length; i++) {
  radios[i].addEventListener('change', validateRole);
}

playerForm.addEventListener('submit', handleSubmit);
renderPlayers();