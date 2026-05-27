// Módulo de comunicação com a API backend
const API_URL = 'http://localhost:3000/api';

function getToken() { return localStorage.getItem('pm_token'); }
function getUsuario() { return JSON.parse(localStorage.getItem('pm_usuario') || 'null'); }

async function apiFetch(rota, opcoes = {}) {
  const token = getToken();
  const config = {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...opcoes,
    body: opcoes.body ? JSON.stringify(opcoes.body) : undefined
  };
  const res = await fetch(API_URL + rota, config);
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || 'Erro na requisição');
  return data;
}

async function login(email, senha) {
  const data = await apiFetch('/auth/login', { method: 'POST', body: { email, senha } });
  localStorage.setItem('pm_token', data.token);
  localStorage.setItem('pm_usuario', JSON.stringify(data.usuario));
  return data;
}

function logout() {
  localStorage.removeItem('pm_token');
  localStorage.removeItem('pm_usuario');
  window.location.href = '/pages/login.html';
}

function verificarAuth() {
  const token = getToken();
  if (!token) { window.location.href = '/pages/login.html'; return null; }
  return getUsuario();
}

function toast(msg, tipo = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const id = 'toast_' + Date.now();
  const cores = { success: 'bg-success', danger: 'bg-danger', warning: 'bg-warning text-dark', info: 'bg-info' };
  container.insertAdjacentHTML('beforeend', `
    <div id="${id}" class="toast align-items-center text-white ${cores[tipo] || 'bg-success'} border-0 show mb-2" role="alert">
      <div class="d-flex">
        <div class="toast-body">${msg}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="document.getElementById('${id}').remove()"></button>
      </div>
    </div>`);
  setTimeout(() => { const el = document.getElementById(id); if (el) el.remove(); }, 4000);
}

function iniciarSidebar() {
  const usuario = getUsuario();
  if (!usuario) return;
  const nomeEl = document.getElementById('sidebarNome');
  const roleEl = document.getElementById('sidebarRole');
  const avatarEl = document.getElementById('sidebarAvatar');
  const perfis = { psicologo: 'Psicólogo', administrador: 'Administrador', paciente: 'Paciente' };
  if (nomeEl) nomeEl.textContent = usuario.nome;
  if (roleEl) roleEl.textContent = usuario.crp ? `CRP ${usuario.crp}` : perfis[usuario.perfil];
  if (avatarEl) avatarEl.textContent = usuario.nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  // Ativa link atual
  const atual = window.location.pathname;
  document.querySelectorAll('.pm-nav-link').forEach(link => {
    if (atual.includes(link.getAttribute('href'))) link.classList.add('active');
  });
}

window.PM = { apiFetch, login, logout, verificarAuth, getUsuario, getToken, toast, iniciarSidebar };
