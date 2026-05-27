// ── PsicoManager — Frontend JS ────────────────────────────────
// Em produção (Vercel) a API está na mesma origem. Em dev, no localhost:3033
const API = window.location.hostname === 'localhost'
  ? 'http://localhost:3033/api'
  : window.location.origin + '/api';
let TOKEN  = localStorage.getItem('pm_token');
let USUARIO = JSON.parse(localStorage.getItem('pm_usuario') || 'null');

// ── Utilitários ───────────────────────────────────────────────
function authHeader() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` };
}

async function api(method, path, body) {
  try {
    const opts = { method, headers: authHeader() };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(API + path, opts);
    const data = await r.json();
    if (!r.ok) throw new Error(data.erro || 'Erro na requisição');
    return data;
  } catch (e) {
    if (e.message.includes('Failed to fetch'))
      alert('Não foi possível conectar ao servidor.\nVerifique se o backend está rodando (npm start).');
    else
      alert(e.message);
    return null;
  }
}

function fmtData(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('pt-BR');
}

function fmtHora(str) {
  if (!str) return '—';
  return new Date(str).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function fmtMoeda(v) {
  return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function badgeStatus(s) {
  const map = {
    confirmada: '<span class="badge badge-confirmed px-2 py-1 rounded-pill">Confirmada</span>',
    agendada:   '<span class="badge badge-pending px-2 py-1 rounded-pill">Agendada</span>',
    cancelada:  '<span class="badge badge-cancelled px-2 py-1 rounded-pill">Cancelada</span>',
    realizada:  '<span class="badge bg-secondary px-2 py-1 rounded-pill">Realizada</span>',
    pago:       '<span class="badge badge-paid px-2 py-1 rounded-pill">Pago</span>',
    pendente:   '<span class="badge badge-pending px-2 py-1 rounded-pill">Pendente</span>',
    cancelado:  '<span class="badge badge-cancelled px-2 py-1 rounded-pill">Cancelado</span>',
  };
  return map[s] || `<span class="badge bg-secondary">${s}</span>`;
}

function badgePlano(p) {
  const map = {
    particular_mensal: '<span class="badge bg-primary bg-opacity-10 text-primary">Mensal</span>',
    pacote_5:  '<span class="badge bg-info bg-opacity-10 text-info">Pacote 5x</span>',
    pacote_10: '<span class="badge bg-info bg-opacity-10 text-info">Pacote 10x</span>',
    convenio:  '<span class="badge bg-warning bg-opacity-10 text-warning">Convênio</span>',
  };
  return map[p] || `<span class="badge bg-secondary">${p}</span>`;
}

function iniciais(nome) {
  if (!nome) return '?';
  return nome.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase();
}

// ── LOGIN ──────────────────────────────────────────────────────
function setupLogin() {
  // Selecionar perfil
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const emails = {
        psicologo: 'ana@clinica.com',
        administrador: 'admin@clinica.com',
        paciente: 'maria@email.com',
      };
      document.getElementById('loginEmail').value = emails[btn.dataset.perfil] || '';
    });
  });

  document.getElementById('formLogin').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const senha = document.getElementById('loginSenha').value;
    const data  = await fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    }).then(r => r.json()).catch(() => null);

    if (!data || data.erro) {
      document.getElementById('loginErro').textContent = data?.erro || 'Erro de conexão com o servidor.';
      document.getElementById('loginErro').style.display = 'block';
      return;
    }
    TOKEN = data.token;
    USUARIO = data.usuario;
    localStorage.setItem('pm_token', TOKEN);
    localStorage.setItem('pm_usuario', JSON.stringify(USUARIO));
    window.location.href = 'index.html';
  });
}

// ── LOGOUT ────────────────────────────────────────────────────
function logout() {
  localStorage.removeItem('pm_token');
  localStorage.removeItem('pm_usuario');
  window.location.href = 'login.html';
}

// ── NAVEGAÇÃO ─────────────────────────────────────────────────
function initNav() {
  if (!TOKEN) { window.location.href = 'login.html'; return; }

  // Preencher dados do usuário na sidebar
  document.getElementById('sidebarNome').textContent  = USUARIO?.nome || '';
  document.getElementById('sidebarAvatar').textContent = iniciais(USUARIO?.nome);
  document.getElementById('sidebarPerfil').textContent  = USUARIO?.perfil || '';

  // Controle de permissão: ocultar itens de admin para psicólogo
  if (USUARIO?.perfil === 'paciente') {
    document.querySelectorAll('[data-role]').forEach(el => {
      if (el.dataset.role !== 'paciente') el.style.display = 'none';
    });
  }

  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => mostrarPagina(item.dataset.page, item));
  });

  // Página inicial
  mostrarPagina('dashboard');
}

function mostrarPagina(nome, navEl) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById('page-' + nome);
  if (page) page.classList.add('active');
  if (navEl) navEl.classList.add('active');
  else {
    const el = document.querySelector(`.nav-item[data-page="${nome}"]`);
    if (el) el.classList.add('active');
  }
  document.getElementById('topbarTitle').textContent = {
    dashboard:'Dashboard', agenda:'Agenda', pacientes:'Pacientes',
    prontuario:'Prontuários', financeiro:'Financeiro', relatorios:'Relatórios',
    tarefas:'Tarefas'
  }[nome] || nome;

  // Carregar dados da página
  const loaders = { dashboard, agenda, pacientes, financeiro, relatorios, tarefas };
  if (loaders[nome]) loaders[nome]();
}

// ── DASHBOARD ─────────────────────────────────────────────────
async function dashboard() {
  const d = await api('GET', '/dashboard');
  if (!d) return;
  document.getElementById('mSessoesHoje').textContent    = d.sessoes_hoje || 0;
  document.getElementById('mPacientes').textContent      = d.pacientes_ativos || 0;
  document.getElementById('mReceita').textContent        = fmtMoeda(d.receita_mes);
  document.getElementById('mTaxaPresenca').textContent   = (d.taxa_presenca || 0) + '%';

  // Sessões de hoje
  const s = await api('GET', '/sessoes/hoje');
  if (!s) return;
  document.getElementById('sessoesHojeTabela').innerHTML = s.length === 0
    ? '<tr><td colspan="5" class="text-center text-muted py-3">Nenhuma sessão hoje.</td></tr>'
    : s.map(x => `<tr>
        <td>${fmtHora(x.data_hora_inicio)}</td>
        <td>${x.paciente?.usuario?.nome || '—'}</td>
        <td><span class="badge bg-light text-dark">${x.modalidade}</span></td>
        <td>${badgeStatus(x.status)}</td>
        <td>${x.sala_id ? 'Sala ' + x.sala_id : 'Online'}</td>
      </tr>`).join('');

  // Gráfico receita
  const receita = await api('GET', '/financeiro/receita-mensal?ano=' + new Date().getFullYear());
  if (receita) renderGraficoReceita(receita);
}

function renderGraficoReceita(dados) {
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const valores = Array(12).fill(0);
  dados.forEach(d => { valores[d.mes - 1] = parseFloat(d.total || 0); });

  if (window.chartReceita) window.chartReceita.destroy();
  const ctx = document.getElementById('chartReceita');
  if (!ctx) return;
  window.chartReceita = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: meses,
      datasets: [{ label: 'Receita', data: valores, backgroundColor: '#1D9E75', borderRadius: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: v => 'R$ ' + (v/1000).toFixed(0) + 'k' }, grid: { color: '#f0f0f0' } },
        x: { grid: { display: false } }
      }
    }
  });
}

// ── AGENDA ────────────────────────────────────────────────────
async function agenda() {
  const hoje = new Date();
  const ano  = hoje.getFullYear();
  const mes  = hoje.getMonth();
  renderCalendario(ano, mes);

  // Form de novo agendamento
  await carregarSelectPacientes('agPacienteId');
  await carregarSelectPsicologos('agPsicologoId');

  document.getElementById('formAgendamento')?.addEventListener('submit', async e => {
    e.preventDefault();
    const body = {
      paciente_id:      document.getElementById('agPacienteId').value,
      psicologo_id:     document.getElementById('agPsicologoId').value,
      data_hora_inicio: document.getElementById('agDataInicio').value,
      data_hora_fim:    document.getElementById('agDataFim').value,
      modalidade:       document.getElementById('agModalidade').value,
      observacoes:      document.getElementById('agObs').value,
    };
    const r = await api('POST', '/sessoes', body);
    if (r) {
      alert('Sessão agendada com sucesso!');
      e.target.reset();
      renderCalendario(ano, mes);
    }
  });
}

async function renderCalendario(ano, mes) {
  const inicio = new Date(ano, mes, 1).toISOString();
  const fim    = new Date(ano, mes + 1, 0, 23, 59, 59).toISOString();
  const sessoes = await api('GET', `/sessoes?data_inicio=${inicio}&data_fim=${fim}`) || [];

  const grid = document.getElementById('calGrid');
  if (!grid) return;

  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                 'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  document.getElementById('calTitulo').textContent = meses[mes] + ' ' + ano;

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const ultimoDia   = new Date(ano, mes + 1, 0).getDate();
  const hoje        = new Date();

  let html = '';
  // Dias anteriores
  for (let i = 0; i < primeiroDia; i++) {
    const d = new Date(ano, mes, -primeiroDia + i + 1).getDate();
    html += `<div class="cal-cell other"><div class="cal-day-num">${d}</div></div>`;
  }
  // Dias do mês
  for (let d = 1; d <= ultimoDia; d++) {
    const isHoje = d === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();
    const daySessoes = sessoes.filter(s => new Date(s.data_hora_inicio).getDate() === d);
    const events = daySessoes.slice(0,3).map(s => {
      const cls = { confirmada:'ev-green', agendada:'ev-yellow', cancelada:'ev-red' }[s.status] || 'ev-yellow';
      return `<div class="ev ${cls}">${fmtHora(s.data_hora_inicio)} ${s.paciente?.usuario?.nome?.split(' ')[0] || ''}</div>`;
    }).join('');
    html += `<div class="cal-cell${isHoje ? ' today' : ''}">
               <div class="cal-day-num">${d}</div>${events}
             </div>`;
  }
  grid.innerHTML = html;
}

async function carregarSelectPacientes(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const lista = await api('GET', '/pacientes') || [];
  el.innerHTML = '<option value="">Selecione o paciente</option>' +
    lista.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
}

async function carregarSelectPsicologos(id) {
  // Lista local por simplicidade (poderia ter endpoint /api/psicologos)
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<option value="1">Dra. Ana Lima</option><option value="2">Dr. Carlos Mendes</option>`;
}

// ── PACIENTES ─────────────────────────────────────────────────
async function pacientes(busca) {
  const url = busca ? `/pacientes?busca=${encodeURIComponent(busca)}` : '/pacientes';
  const lista = await api('GET', url) || [];

  document.getElementById('pacientesTabela').innerHTML = lista.length === 0
    ? '<tr><td colspan="6" class="text-center text-muted py-3">Nenhum paciente encontrado.</td></tr>'
    : lista.map(p => `<tr>
        <td>
          <div class="d-flex align-items-center gap-2">
            <div class="user-avatar" style="background:#534AB7;font-size:10px">${iniciais(p.nome)}</div>
            <span>${p.nome || '—'}</span>
          </div>
        </td>
        <td class="text-muted small">${p.email || '—'}</td>
        <td>${p.telefone || '—'}</td>
        <td>${badgePlano(p.plano)}</td>
        <td>${p.psicologo || '—'}</td>
        <td>
          <button class="btn btn-sm btn-outline-secondary" onclick="verProntuario(${p.id})">
            <i class="bi bi-file-medical"></i> Prontuário
          </button>
        </td>
      </tr>`).join('');

  // Busca ao vivo
  const inp = document.getElementById('buscaPaciente');
  if (inp && !inp.dataset.bound) {
    inp.dataset.bound = '1';
    inp.addEventListener('input', () => pacientes(inp.value));
  }

  // Form novo paciente
  await carregarSelectPsicologos('nPsicologoId');
  document.getElementById('formNovoPaciente')?.addEventListener('submit', async e => {
    e.preventDefault();
    const body = {
      nome:               document.getElementById('nNome').value,
      email:              document.getElementById('nEmail').value,
      telefone:           document.getElementById('nTelefone').value,
      cpf:                document.getElementById('nCpf').value,
      data_nascimento:    document.getElementById('nNasc').value,
      endereco:           document.getElementById('nEndereco').value,
      contato_emergencia: document.getElementById('nEmergencia').value,
      profissao:          document.getElementById('nProfissao').value,
      psicologo_id:       document.getElementById('nPsicologoId').value,
      plano:              document.getElementById('nPlano').value,
    };
    const r = await api('POST', '/pacientes', body);
    if (r) { alert('Paciente cadastrado! Senha padrão: 123456'); e.target.reset(); pacientes(); }
  });
}

// ── PRONTUÁRIO ────────────────────────────────────────────────
async function verProntuario(pacienteId) {
  mostrarPagina('prontuario');
  const p = await api('GET', `/prontuarios/${pacienteId}`);
  if (!p) return;

  document.getElementById('pronPacienteId').value            = pacienteId;
  document.getElementById('pronQueixa').value                = p.queixa_principal || '';
  document.getElementById('pronFamiliar').value              = p.historico_familiar || '';
  document.getElementById('pronClinico').value               = p.historico_clinico || '';
  document.getElementById('pronMedicamentos').value          = p.medicamentos || '';
  document.getElementById('pronHipotese').value              = p.hipotese_diagnostica || '';

  carregarEvolucoes(pacienteId);
}

async function carregarEvolucoes(pacienteId) {
  const lista = await api('GET', `/prontuarios/${pacienteId}/evolucoes`) || [];
  document.getElementById('evolucoesList').innerHTML = lista.length === 0
    ? '<p class="text-muted">Nenhuma evolução registrada.</p>'
    : lista.map(e => `
        <div class="card mb-2 border-0 bg-light">
          <div class="card-body py-2 px-3">
            <div class="d-flex justify-content-between mb-1">
              <small class="text-muted">Sessão ${fmtData(e.criado_em)} · ${e.psicologo?.nome || ''}</small>
              <span class="badge ${e.status_preenchimento === 'completo' ? 'badge-confirmed' : 'badge-pending'} rounded-pill px-2">
                ${e.status_preenchimento}
              </span>
            </div>
            <p class="mb-0 small">${e.observacoes_clinicas}</p>
          </div>
        </div>`).join('');
}

// ── FINANCEIRO ────────────────────────────────────────────────
async function financeiro() {
  const resumo = await api('GET', '/financeiro/resumo');
  if (resumo) {
    document.getElementById('fReceita').textContent       = fmtMoeda(resumo.receita);
    document.getElementById('fTotalSessoes').textContent  = resumo.total_sessoes || 0;
    document.getElementById('fCanceladas').textContent    = resumo.canceladas || 0;
    document.getElementById('fTicket').textContent        = fmtMoeda(resumo.ticket_medio);
  }

  const lista = await api('GET', '/financeiro') || [];
  document.getElementById('pagamentosTabela').innerHTML = lista.length === 0
    ? '<tr><td colspan="6" class="text-center text-muted py-3">Nenhum lançamento encontrado.</td></tr>'
    : lista.map(p => `<tr>
        <td>${p.paciente?.usuario?.nome || '—'}</td>
        <td>${fmtData(p.data_pagamento)}</td>
        <td>${fmtMoeda(p.valor)}</td>
        <td><span class="badge bg-light text-dark">${p.forma_pagamento}</span></td>
        <td>${badgeStatus(p.status)}</td>
        <td><small class="text-muted">${p.observacoes || '—'}</small></td>
      </tr>`).join('');

  await carregarSelectPacientes('fPacienteId');
  document.getElementById('formPagamento')?.addEventListener('submit', async e => {
    e.preventDefault();
    const body = {
      sessao_id:       1, // simplificado
      paciente_id:     document.getElementById('fPacienteId').value,
      valor:           document.getElementById('fValor').value,
      forma_pagamento: document.getElementById('fForma').value,
      data_pagamento:  document.getElementById('fData').value,
      observacoes:     document.getElementById('fObs').value,
    };
    const r = await api('POST', '/financeiro', body);
    if (r) { alert('Pagamento registrado!'); e.target.reset(); financeiro(); }
  });
}

// ── RELATÓRIOS ────────────────────────────────────────────────
async function relatorios() {
  const pendentes = await api('GET', '/prontuarios-pendentes') || [];
  document.getElementById('pendentesTabela').innerHTML = pendentes.length === 0
    ? '<tr><td colspan="4" class="text-center text-muted py-3">Nenhum prontuário pendente.</td></tr>'
    : pendentes.map(s => `<tr>
        <td>${s.paciente?.usuario?.nome || '—'}</td>
        <td>${fmtData(s.data_hora_inicio)}</td>
        <td>${s.psicologo?.nome || '—'}</td>
        <td><button class="btn btn-sm btn-teal" onclick="verProntuario(${s.paciente_id})">Preencher</button></td>
      </tr>`).join('');

  const porProf = await api('GET', '/atendimentos-profissional') || [];
  document.getElementById('porProfTabela').innerHTML = porProf.length === 0
    ? '<tr><td colspan="2" class="text-center text-muted py-3">Sem dados.</td></tr>'
    : porProf.map(r => `<tr><td>${r.psicologo?.nome || '—'}</td><td>${r.total}</td></tr>`).join('');
}

// ── TAREFAS ───────────────────────────────────────────────────
async function tarefas() {
  const lista = await api('GET', '/tarefas') || [];
  document.getElementById('tarefasList').innerHTML = lista.length === 0
    ? '<p class="text-muted">Nenhuma tarefa encontrada.</p>'
    : lista.map(t => `
        <div class="d-flex align-items-start gap-3 p-3 mb-2 bg-white rounded-3 border">
          <input type="checkbox" class="form-check-input mt-1" ${t.concluida ? 'checked' : ''}
                 onchange="toggleTarefa(${t.id}, this)" />
          <div class="flex-grow-1 ${t.concluida ? 'text-decoration-line-through text-muted' : ''}">
            <div class="fw-semibold small">${t.descricao}</div>
            <div class="text-muted" style="font-size:11px">
              Prazo: ${t.prazo ? fmtData(t.prazo) : '—'} · ${t.responsavel?.nome || ''}
              ${t.paciente?.usuario?.nome ? '· ' + t.paciente.usuario.nome : ''}
            </div>
          </div>
          <span class="badge ${t.concluida ? 'badge-confirmed' : 'badge-pending'} rounded-pill px-2">
            ${t.concluida ? 'Concluída' : 'Pendente'}
          </span>
        </div>`).join('');

  await carregarSelectPacientes('tPacienteId');
  document.getElementById('formTarefa')?.addEventListener('submit', async e => {
    e.preventDefault();
    const body = {
      descricao:   document.getElementById('tDescricao').value,
      paciente_id: document.getElementById('tPacienteId').value || null,
      prazo:       document.getElementById('tPrazo').value,
    };
    const r = await api('POST', '/tarefas', body);
    if (r) { alert('Tarefa criada!'); e.target.reset(); tarefas(); }
  });
}

async function toggleTarefa(id) {
  await api('PATCH', `/tarefas/${id}`, {});
  tarefas();
}

// ── TABS ──────────────────────────────────────────────────────
function switchTab(btn, tabId) {
  const parent = btn.closest('[data-tab-group]');
  parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const groupId = parent.dataset.tabGroup;
  document.querySelectorAll(`[data-tab="${groupId}"]`).forEach(t => t.style.display = 'none');
  document.getElementById(tabId).style.display = 'block';
}

// ── PRONTUÁRIO SAVE ───────────────────────────────────────────
async function salvarProntuario() {
  const id = document.getElementById('pronPacienteId').value;
  if (!id) return alert('Selecione um paciente primeiro.');
  const body = {
    queixa_principal:     document.getElementById('pronQueixa').value,
    historico_familiar:   document.getElementById('pronFamiliar').value,
    historico_clinico:    document.getElementById('pronClinico').value,
    medicamentos:         document.getElementById('pronMedicamentos').value,
    hipotese_diagnostica: document.getElementById('pronHipotese').value,
  };
  const r = await api('PUT', `/prontuarios/${id}`, body);
  if (r) alert('Prontuário salvo com sucesso!');
}

async function salvarEvolucao() {
  const id = document.getElementById('pronPacienteId').value;
  const obs = document.getElementById('evObs').value;
  if (!id || !obs) return alert('Preencha as observações clínicas.');
  const r = await api('POST', `/prontuarios/${id}/evolucoes`, {
    sessao_id: 1,
    observacoes_clinicas: obs,
    status_preenchimento: 'completo',
  });
  if (r) {
    alert('Evolução registrada!');
    document.getElementById('evObs').value = '';
    carregarEvolucoes(id);
  }
}

// ── PLANOS ────────────────────────────────────────────────────
async function planos() {
  const lista = await api('GET', '/pacientes') || [];
  const el = document.getElementById('planosLista');
  if (!el) return;

  const comPlano = lista.filter(p => p.plano && p.plano !== 'particular_mensal');
  if (comPlano.length === 0) {
    el.innerHTML = '<div class="empty-state"><i class="bi bi-collection"></i><p>Nenhum paciente com pacote ativo.</p></div>';
    return;
  }

  el.innerHTML = comPlano.map(p => {
    const total    = p.plano === 'pacote_5' ? 5 : p.plano === 'pacote_10' ? 10 : null;
    const usado    = total ? (total - (p.saldo || 0)) : 0;
    const pct      = total ? Math.round((usado / total) * 100) : 0;
    const label    = { pacote_5:'Pacote 5x', pacote_10:'Pacote 10x', convenio:'Convênio', particular_mensal:'Mensal' }[p.plano] || p.plano;
    const badgeCls = { pacote_5:'badge-blue', pacote_10:'badge-blue', convenio:'badge-amber' }[p.plano] || 'badge-gray';
    return `
      <div class="plan-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="font-weight:700;font-size:14px;color:#0D1B2A">${p.nome || '—'}</div>
          <span class="badge ${badgeCls}">${label}</span>
        </div>
        <div style="font-size:12px;color:#718096">${p.psicologo || '—'}</div>
        ${total ? `
          <div style="margin-top:12px">
            <div style="display:flex;justify-content:space-between;font-size:12px;color:#4A5568;margin-bottom:4px">
              <span>Sessões usadas</span><span><strong>${usado}</strong> / ${total}</span>
            </div>
            <div class="plan-progress"><div class="plan-progress-bar" style="width:${pct}%"></div></div>
            <div style="font-size:11px;color:#718096;margin-top:4px">Saldo restante: <strong>${p.saldo || 0} sessão(ões)</strong></div>
          </div>` : ''}
      </div>`;
  }).join('');
}

// ── LEMBRETES ─────────────────────────────────────────────────
async function lembretes() {
  await carregarSelectPacientes('lembPaciente');
}

async function enviarLembrete() {
  const paciente = document.getElementById('lembPaciente')?.value;
  const msg      = document.getElementById('lembMsg')?.value;
  if (!paciente || !msg) return alert('Selecione um paciente e escreva a mensagem.');
  alert('✅ Lembrete enviado por e-mail com sucesso!\n\n(Em produção usa Nodemailer/SendGrid)');
}

// ── DOCUMENTOS ────────────────────────────────────────────────
async function documentos() {
  await carregarSelectPacientes('docPaciente');
  const hoje = new Date().toISOString().split('T')[0];
  const docData = document.getElementById('docData');
  if (docData) docData.value = hoje;
}

async function gerarDocumento() {
  const tipo     = document.getElementById('docTipo')?.value;
  const paciente = document.getElementById('docPaciente')?.options[document.getElementById('docPaciente').selectedIndex]?.text;
  const data     = document.getElementById('docData')?.value;
  if (!paciente || !data) return alert('Preencha todos os campos.');
  const tipos = { recibo:'Recibo de sessão', declaracao:'Declaração de comparecimento', laudo:'Laudo psicológico', relatorio:'Relatório clínico', contrato:'Contrato de serviços' };
  alert(`📄 ${tipos[tipo] || tipo} gerado com sucesso!\nPaciente: ${paciente}\nData: ${data}\n\n(PDF seria gerado aqui com biblioteca como pdfkit)`);
}

// ── ESPACOS ───────────────────────────────────────────────────
async function espacos() { /* dados já estão no HTML estático */ }

// ── OVERRIDE initNav para incluir novos módulos ───────────────
const _origMostrar = window.mostrarPagina;
window.mostrarPagina = function(nome, navEl) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById('page-' + nome);
  if (page) page.classList.add('active');
  if (navEl) navEl.classList.add('active');
  else { const el = document.querySelector(`.nav-item[data-page="${nome}"]`); if (el) el.classList.add('active'); }
  document.getElementById('topbarTitle').textContent = {
    dashboard:'Dashboard', agenda:'Agenda', pacientes:'Pacientes',
    prontuario:'Prontuários', financeiro:'Financeiro', planos:'Planos',
    convenios:'Convênios', documentos:'Documentos', lembretes:'Lembretes',
    espacos:'Espaços', tarefas:'Tarefas', relatorios:'Relatórios'
  }[nome] || nome;
  const loaders = { dashboard, agenda, pacientes, financeiro, relatorios, tarefas, planos, lembretes, documentos, espacos };
  if (loaders[nome]) loaders[nome]();
  // Fechar sidebar no mobile
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('show');
};

// ── CONVÊNIOS (real, banco de dados) ─────────────────────────
async function convenios() {
  const lista = await api('GET', '/convenios') || [];
  const el = document.getElementById('conveniosList');
  if (!el) return;

  el.innerHTML = lista.length === 0
    ? '<div class="empty-state"><i class="bi bi-shield-x"></i><p>Nenhum convênio cadastrado.</p></div>'
    : lista.filter(c => c.ativo).map(c => `
        <div class="fin-row">
          <div>
            <div class="fin-label">${c.nome}</div>
            <div class="fin-sub">Cobre ${c.percentual_pago}% · Coparticipação ${c.coparticipacao}%
              ${c.valor_referencia ? ` · Referência: R$ ${Number(c.valor_referencia).toFixed(2)}` : ''}
            </div>
            ${c.observacoes ? `<div class="fin-sub" style="font-style:italic">${c.observacoes}</div>` : ''}
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <span class="badge badge-green">Ativo</span>
            <button class="btn-icon" onclick="removerConvenio(${c.id})" title="Desativar">
              <i class="bi bi-trash" style="color:#E17055"></i>
            </button>
          </div>
        </div>`).join('');

  // Form de cadastro
  const form = document.getElementById('formConvenio');
  if (form && !form.dataset.bound) {
    form.dataset.bound = '1';
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const body = {
        nome:             document.getElementById('convNome').value,
        percentual_pago:  document.getElementById('convPct').value,
        coparticipacao:   document.getElementById('convCopa').value,
        valor_referencia: document.getElementById('convValor').value || null,
        observacoes:      document.getElementById('convObs').value || null,
      };
      const r = await api('POST', '/convenios', body);
      if (r) { alert('Convênio cadastrado!'); form.reset(); convenios(); }
    });
  }
}

async function removerConvenio(id) {
  if (!confirm('Desativar este convênio?')) return;
  const r = await api('DELETE', `/convenios/${id}`, {});
  if (r) { alert('Convênio desativado.'); convenios(); }
}

// ── LEMBRETES — envio real ─────────────────────────────────────
async function lembretes() {
  await carregarSelectPacientes('lembPaciente');
}

async function enviarLembrete() {
  const paciente_id = document.getElementById('lembPaciente')?.value;
  if (!paciente_id) return alert('Selecione um paciente.');

  const btn = document.querySelector('[onclick="enviarLembrete()"]');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Enviando...'; }

  const r = await api('POST', '/lembretes/enviar', { paciente_id });

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-envelope"></i> Enviar por e-mail'; }
  if (r) alert('✅ ' + r.mensagem);
}

// ── DOCUMENTOS — download real de PDF ─────────────────────────
async function documentos() {
  await carregarSelectPacientes('docPaciente');
  const hoje = new Date().toISOString().split('T')[0];
  const docData = document.getElementById('docData');
  if (docData) docData.value = hoje;
}

async function gerarDocumento() {
  const tipo      = document.getElementById('docTipo')?.value;
  const pacienteEl = document.getElementById('docPaciente');
  const pacienteId = pacienteEl?.value;

  if (!pacienteId) return alert('Selecione um paciente.');

  if (tipo === 'laudo') {
    window.open(`${window.location.origin}/api/documentos/laudo/${pacienteId}`, '_blank');
    return;
  }

  // Para recibo, buscar último pagamento do paciente
  const pagamentos = await api('GET', `/financeiro?status=pago`) || [];
  const pag = pagamentos.find(p => String(p.paciente_id) === String(pacienteId));
  if (!pag) return alert('Nenhum pagamento encontrado para este paciente.\nCadastre um pagamento primeiro.');

  window.open(`${window.location.origin}/api/documentos/recibo/${pag.id}`, '_blank');
}
