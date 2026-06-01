const { google } = require('googleapis');
require('dotenv').config();

// Configurar OAuth2
function criarOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// Gerar URL de autorização
function gerarUrlAutorizacao() {
  const oauth2Client = criarOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent',
  });
}

// Trocar código por tokens
async function trocarCodigoPorTokens(code) {
  const oauth2Client = criarOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Criar cliente autenticado com tokens do usuário
function criarClienteAutenticado(tokens) {
  const oauth2Client = criarOAuth2Client();
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}

// Criar evento no Google Calendar
async function criarEvento(tokens, dadosSessao) {
  const auth     = criarClienteAutenticado(tokens);
  const calendar = google.calendar({ version: 'v3', auth });

  const { nomePaciente, nomePsicologo, dataInicio, dataFim, modalidade, observacoes } = dadosSessao;

  const evento = {
    summary:     `Sessão — ${nomePaciente}`,
    description: `Psicólogo(a): ${nomePsicologo}\nModalidade: ${modalidade}\n${observacoes ? 'Obs: ' + observacoes : ''}`,
    start: {
      dateTime: new Date(dataInicio).toISOString(),
      timeZone: 'America/Bahia',
    },
    end: {
      dateTime: new Date(dataFim).toISOString(),
      timeZone: 'America/Bahia',
    },
    colorId: '2', // Verde
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email',  minutes: 24 * 60 }, // 1 dia antes
        { method: 'popup',  minutes: 30 },        // 30 min antes
      ],
    },
  };

  const resultado = await calendar.events.insert({
    calendarId: 'primary',
    resource:   evento,
  });

  return resultado.data;
}

// Atualizar evento no Google Calendar
async function atualizarEvento(tokens, googleEventId, dadosSessao) {
  const auth     = criarClienteAutenticado(tokens);
  const calendar = google.calendar({ version: 'v3', auth });

  const { nomePaciente, nomePsicologo, dataInicio, dataFim, modalidade, status } = dadosSessao;

  // Cor por status
  const cores = { confirmada: '2', cancelada: '11', agendada: '5', realizada: '8' };

  const evento = {
    summary:     `Sessão — ${nomePaciente}${status === 'cancelada' ? ' (CANCELADA)' : ''}`,
    description: `Psicólogo(a): ${nomePsicologo}\nModalidade: ${modalidade}\nStatus: ${status}`,
    start: { dateTime: new Date(dataInicio).toISOString(), timeZone: 'America/Bahia' },
    end:   { dateTime: new Date(dataFim).toISOString(),   timeZone: 'America/Bahia' },
    colorId: cores[status] || '2',
  };

  const resultado = await calendar.events.update({
    calendarId: 'primary',
    eventId:    googleEventId,
    resource:   evento,
  });

  return resultado.data;
}

// Deletar evento no Google Calendar
async function deletarEvento(tokens, googleEventId) {
  const auth     = criarClienteAutenticado(tokens);
  const calendar = google.calendar({ version: 'v3', auth });
  await calendar.events.delete({ calendarId: 'primary', eventId: googleEventId });
}

// Listar próximos eventos
async function listarEventos(tokens) {
  const auth     = criarClienteAutenticado(tokens);
  const calendar = google.calendar({ version: 'v3', auth });

  const resultado = await calendar.events.list({
    calendarId:   'primary',
    timeMin:      new Date().toISOString(),
    maxResults:   50,
    singleEvents: true,
    orderBy:      'startTime',
  });

  return resultado.data.items || [];
}

module.exports = {
  gerarUrlAutorizacao,
  trocarCodigoPorTokens,
  criarEvento,
  atualizarEvento,
  deletarEvento,
  listarEventos,
};
