const cron    = require('node-cron');
const Sessao  = require('../models/Sessao');
const Paciente = require('../models/Paciente');
const Usuario = require('../models/Usuario');
const { enviarLembretesessao } = require('./emailService');
const { Op } = require('sequelize');

async function dispararLembretes() {
  console.log('🔔 Verificando sessões para lembrete...');
  try {
    // Buscar sessões de amanhã que ainda não receberam lembrete
    const amanha_ini = new Date();
    amanha_ini.setDate(amanha_ini.getDate() + 1);
    amanha_ini.setHours(0, 0, 0, 0);

    const amanha_fim = new Date(amanha_ini);
    amanha_fim.setHours(23, 59, 59, 999);

    const sessoes = await Sessao.findAll({
      where: {
        data_hora_inicio: { [Op.between]: [amanha_ini, amanha_fim] },
        status:           { [Op.in]: ['agendada', 'confirmada'] },
        lembrete_enviado: false,
      },
      include: [
        {
          model: Paciente, as: 'paciente',
          include: [{ model: Usuario, as: 'usuario', attributes: ['nome', 'email'] }]
        },
        { model: Usuario, as: 'psicologo', attributes: ['nome'] },
      ],
    });

    console.log(`   Encontradas ${sessoes.length} sessão(ões) para notificar.`);

    for (const sessao of sessoes) {
      const emailPaciente = sessao.paciente?.usuario?.email;
      const nomePaciente  = sessao.paciente?.usuario?.nome;
      const nomePsicologo = sessao.psicologo?.nome;

      if (!emailPaciente) {
        console.log(`   ⚠️ Sessão ${sessao.id}: paciente sem e-mail, pulando.`);
        continue;
      }

      try {
        await enviarLembretesessao({
          nomePaciente,
          emailPaciente,
          nomePsicologo,
          dataHora:   sessao.data_hora_inicio,
          modalidade: sessao.modalidade,
        });

        // Marcar lembrete como enviado
        await sessao.update({ lembrete_enviado: true });
      } catch (e) {
        console.error(`   ❌ Erro ao enviar para ${emailPaciente}:`, e.message);
      }
    }

    console.log('🔔 Verificação de lembretes concluída.');
  } catch (e) {
    console.error('❌ Erro no job de lembretes:', e.message);
  }
}

function iniciarJobLembretes() {
  // Roda todo dia às 8h da manhã
  cron.schedule('0 8 * * *', dispararLembretes, {
    timezone: 'America/Bahia',
  });
  console.log('⏰ Job de lembretes agendado (todo dia às 08h, horário de Salvador)');
}

module.exports = { iniciarJobLembretes, dispararLembretes };
