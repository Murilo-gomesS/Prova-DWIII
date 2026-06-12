const tablesGrid = document.getElementById('tablesGrid');
const reservationsBody = document.getElementById('reservationsBody');
const reservationForm = document.getElementById('reservationForm');
const reservationIdInput = document.getElementById('reservationId');
const formTitle = document.getElementById('formTitle');
const mesaSelect = document.getElementById('mesaNumero');
const reservationCount = document.getElementById('reservationCount');
const modal = document.getElementById('tableModal');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const toast = document.getElementById('toast');
const reserveTableButton = document.getElementById('reserveTableButton');
const closeModalButton = document.getElementById('closeModalButton');
const resetFormButton = document.getElementById('resetFormButton');
const filtersForm = document.getElementById('filtersForm');
const clearFiltersButton = document.getElementById('clearFiltersButton');

const state = {
  mesas: [],
  reservations: [],
  selectedMesa: null,
};

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add('hidden'), 3200);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDateOnly(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(new Date(value));
}

function toDatetimeLocalValue(value) {
  const date = new Date(value);
  const pad = (numberValue) => String(numberValue).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Não foi possível concluir a operação.');
  }
  return payload;
}

function getStatusClass(status) {
  return `status-${status}`;
}

function renderMesaSelect() {
  mesaSelect.innerHTML = state.mesas
    .map((mesa) => `<option value="${mesa.numero}">Mesa ${mesa.numero} - ${mesa.capacidade} lugares (${mesa.localizacao})</option>`)
    .join('');
}

function renderTablesGrid() {
  tablesGrid.innerHTML = state.mesas
    .map((mesa) => {
      const proximaReserva = mesa.proximaReserva ? `<strong>${mesa.proximaReserva.clienteNome}</strong><span>${formatDateTime(mesa.proximaReserva.dataHoraReserva)}</span>` : '<span>Sem reservas futuras</span>';
      return `
        <button type="button" class="mesa-card ${mesa.statusAtual}" data-mesa="${mesa.numero}">
          <span class="mesa-number">${mesa.numero}</span>
          <div class="mesa-meta">
            <strong>${mesa.statusAtual.toUpperCase()}</strong>
            <span>${mesa.capacidade} lugares • ${mesa.localizacao}</span>
            ${proximaReserva}
          </div>
        </button>
      `;
    })
    .join('');

  tablesGrid.querySelectorAll('.mesa-card').forEach((card) => {
    card.addEventListener('click', () => {
      const mesaNumero = Number(card.dataset.mesa);
      openMesaModal(mesaNumero);
    });
  });
}

function renderReservationsTable() {
  reservationCount.textContent = `${state.reservations.length} registro(s)`;

  reservationsBody.innerHTML = state.reservations
    .map((reservation) => {
      const mesaNumero = reservation.mesa?.numero ?? '-';
      const status = reservation.status;
      return `
        <tr>
          <td><strong>${reservation.clienteNome}</strong></td>
          <td>${reservation.contatoCliente}</td>
          <td>Mesa ${mesaNumero}</td>
          <td>${reservation.quantidadePessoas}</td>
          <td>${formatDateTime(reservation.dataHoraReserva)}</td>
          <td><span class="status-badge ${getStatusClass(status)}">${status}</span></td>
          <td>
            <div class="row-actions">
              <button class="small-button" data-action="edit" data-id="${reservation._id}">Editar</button>
              <button class="small-button danger" data-action="delete" data-id="${reservation._id}">Cancelar</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  reservationsBody.querySelectorAll('button[data-action="edit"]').forEach((button) => {
    button.addEventListener('click', () => editReservation(button.dataset.id));
  });

  reservationsBody.querySelectorAll('button[data-action="delete"]').forEach((button) => {
    button.addEventListener('click', () => deleteReservation(button.dataset.id));
  });
}

function openMesaModal(mesaNumero) {
  const mesa = state.mesas.find((item) => item.numero === mesaNumero);
  if (!mesa) {
    return;
  }

  state.selectedMesa = mesa;
  modalTitle.textContent = `Mesa ${mesa.numero}`;
  modalContent.innerHTML = `
    <div><strong>Capacidade:</strong> ${mesa.capacidade} pessoas</div>
    <div><strong>Localização:</strong> ${mesa.localizacao}</div>
    <div><strong>Status atual:</strong> ${mesa.statusAtual}</div>
    <div><strong>Próxima reserva:</strong> ${mesa.proximaReserva ? `${mesa.proximaReserva.clienteNome} em ${formatDateTime(mesa.proximaReserva.dataHoraReserva)}` : 'Sem reservas futuras'}</div>
  `;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function resetForm() {
  reservationForm.reset();
  reservationIdInput.value = '';
  formTitle.textContent = 'Nova reserva';
}

function fillFormForReservation(reservation) {
  reservationIdInput.value = reservation._id;
  document.getElementById('clienteNome').value = reservation.clienteNome;
  document.getElementById('contatoCliente').value = reservation.contatoCliente;
  document.getElementById('mesaNumero').value = reservation.mesa?.numero ?? '';
  document.getElementById('quantidadePessoas').value = reservation.quantidadePessoas;
  document.getElementById('dataHoraReserva').value = toDatetimeLocalValue(reservation.dataHoraReserva);
  document.getElementById('observacoes').value = reservation.observacoes || '';
  formTitle.textContent = `Editando reserva #${reservation._id.slice(-6)}`;
}

async function loadMesas() {
  const payload = await requestJson('/mesas');
  state.mesas = payload.data;
  renderMesaSelect();
  renderTablesGrid();
}

async function loadReservations() {
  const params = new URLSearchParams();

  const cliente = document.getElementById('filterCliente').value.trim();
  const mesa = document.getElementById('filterMesa').value.trim();
  const data = document.getElementById('filterData').value;
  const status = document.getElementById('filterStatus').value;

  if (cliente) params.set('cliente', cliente);
  if (mesa) params.set('mesa', mesa);
  if (data) params.set('data', data);
  if (status) params.set('status', status);

  const url = params.toString() ? `/reservas?${params.toString()}` : '/reservas';
  const payload = await requestJson(url);
  state.reservations = payload.data;
  renderReservationsTable();
}

async function refreshData() {
  await loadMesas();
  await loadReservations();
}

async function editReservation(id) {
  const reservation = state.reservations.find((item) => item._id === id);
  if (!reservation) {
    showToast('Reserva não encontrada na lista atual.', 'error');
    return;
  }

  fillFormForReservation(reservation);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteReservation(id) {
  if (!confirm('Deseja cancelar esta reserva?')) {
    return;
  }

  await requestJson(`/reservas/${id}`, { method: 'DELETE' });
  showToast('Reserva cancelada com sucesso.');
  await refreshData();
}

reservationForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    clienteNome: document.getElementById('clienteNome').value,
    contatoCliente: document.getElementById('contatoCliente').value,
    mesaNumero: Number(document.getElementById('mesaNumero').value),
    quantidadePessoas: Number(document.getElementById('quantidadePessoas').value),
    dataHoraReserva: document.getElementById('dataHoraReserva').value,
    observacoes: document.getElementById('observacoes').value,
  };

  const reservationId = reservationIdInput.value;

  try {
    if (reservationId) {
      await requestJson(`/reservas/${reservationId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      showToast('Reserva atualizada com sucesso.');
    } else {
      await requestJson('/reservas', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast('Reserva criada com sucesso.');
    }

    resetForm();
    await refreshData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

filtersForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await loadReservations();
    showToast('Filtros aplicados com sucesso.');
  } catch (error) {
    showToast(error.message, 'error');
  }
});

clearFiltersButton.addEventListener('click', async () => {
  filtersForm.reset();
  await loadReservations();
});

reserveTableButton.addEventListener('click', () => {
  if (!state.selectedMesa) {
    return;
  }

  mesaSelect.value = String(state.selectedMesa.numero);
  closeModal();
  reservationForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

closeModalButton.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

resetFormButton.addEventListener('click', resetForm);

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await refreshData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});
