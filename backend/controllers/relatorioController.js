const { Sessao, Pagamento, Paciente, Usuario, EvolucaoSessao } = require('../models');
const { Op } = require('sequelize');

async function dashboard(req, res) {
  try {
    const hoje = new Date();
    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

    const sessoesHoje = await Sessao.count({ where: { data_hora_inicio: { [Op.between]: [inicioDia, fimDia] } } });
    const pacientesAtivos = await Paciente.count({ where: { status: 'ativo' } });
    const receitaMes = await Pagamento.findAll({ where: { tipo: 'receita', status: 'pago', criado_em: { [Op.between]: [inicioMes, fimMes] } } });
    const totalReceita = receitaMes.reduce((s, p) => s + parseFloat(p.valor), 0);

    const totalSessoesMes = await Sessao.count({ where: { data_hora_inicio: { [Op.between]: [inicioMes, fimMes] } } });
    const canceladas = await Sessao.count({ where: { data_hora_inicio: { [Op.between]: [inicioMes, fimMes] }, status: 'cancelada' } });
    const taxaPresenca = totalSessoesMes > 0 ? Math.round(((totalSessoesMes - canceladas) / totalSessoesMes) * 100) : 0;

    const sessoesPorStatus = await Sessao.findAll({
      where: { data_hora_inicio: { [Op.between]: [inicioMes, fimMes] } },
      attributes: ['status']
    });
    const statusCount = { confirmada: 0, agendada: 0, cancelada: 0, realizada: 0 };
    sessoesPorStatus.forEach(s => { if (statusCount[s.status] !== undefined) statusCount[s.status]++; });

    res.json({ sessoesHoje, pacientesAtivos, receitaMes: totalReceita, taxaPresenca, statusCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao gerar dashboard.' });
  }
}

async function atendimentosPorProfissional(req, res) {
  try {
    const { mes, ano } = req.query;
    const agora = new Date();
    const m = mes || (agora.getMonth() + 1);
    const a = ano || agora.getFullYear();
    const inicio = new Date(a, m - 1, 1);
    const fim = new Date(a, m, 0, 23, 59, 59);
    const psicologos = await Usuario.findAll({ where: { perfil: 'psicologo', ativo: true } });
    const resultado = await Promise.all(psicologos.map(async p => {
      const total = await Sessao.count({ where: { psicologo_id: p.id, data_hora_inicio: { [Op.between]: [inicio, fim] } } });
      return { psicologo: p.nome, total };
    }));
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao gerar relatório.' });
  }
}

module.exports = { dashboard, atendimentosPorProfissional };
