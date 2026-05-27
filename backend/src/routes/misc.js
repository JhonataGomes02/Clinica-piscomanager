const express  = require('express');
const router   = express.Router();
const { Op }   = require('sequelize');
const { autenticar, apenasPsicologo } = require('../middlewares/auth');
const rel = require('../controllers/relatorioController');
const tar = require('../controllers/tarefaController');
const con = require('../controllers/convenioController');
const Pagamento  = require('../models/Pagamento');
const Sessao     = require('../models/Sessao');
const Paciente   = require('../models/Paciente');
const Usuario    = require('../models/Usuario');
const Prontuario = require('../models/Prontuario');

// Relatórios
router.get('/dashboard',                 autenticar, rel.dashboard);
router.get('/prontuarios-pendentes',     autenticar, apenasPsicologo, rel.prontuariosPendentes);
router.get('/atendimentos-profissional', autenticar, rel.atendimentosPorProfissional);

// Tarefas
router.get   ('/tarefas',     autenticar, tar.listar);
router.post  ('/tarefas',     autenticar, tar.criar);
router.patch ('/tarefas/:id', autenticar, tar.concluir);

// Convênios
router.get   ('/convenios',     autenticar, con.listar);
router.post  ('/convenios',     autenticar, con.criar);
router.put   ('/convenios/:id', autenticar, con.atualizar);
router.delete('/convenios/:id', autenticar, con.remover);

// PDF — Recibo (pdfkit carregado só quando a rota é chamada)
router.get('/documentos/recibo/:pagamentoId', autenticar, async (req, res) => {
  try {
    let PDFDocument;
    try { PDFDocument = require('pdfkit'); } catch(e) {
      return res.status(501).json({ erro: 'PDF não disponível neste ambiente.' });
    }
    const p = await Pagamento.findByPk(req.params.pagamentoId, {
      include: [
        { model: Paciente, as: 'paciente', include: [{ model: Usuario, as: 'usuario', attributes: ['nome'] }] },
        { model: Sessao,   as: 'sessao',   include: [{ model: Usuario, as: 'psicologo', attributes: ['nome'] }] },
      ]
    });
    if (!p) return res.status(404).json({ erro: 'Pagamento não encontrado.' });

    const nomePaciente  = p.paciente?.usuario?.nome || '—';
    const nomePsicologo = p.sessao?.psicologo?.nome || '—';
    const valor = Number(p.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const data  = new Date(p.data_pagamento || p.criado_em).toLocaleDateString('pt-BR');

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recibo_${p.id}.pdf"`);
    doc.pipe(res);

    doc.rect(0, 0, 595, 110).fill('#0D1B2A');
    doc.fillColor('#00B87C').fontSize(26).font('Helvetica-Bold').text('PsicoManager', 50, 30);
    doc.fillColor('#ffffff').fontSize(12).font('Helvetica').text('Sistema de Gestão Psicológica', 50, 62);
    doc.fillColor('rgba(255,255,255,0.4)').fontSize(10).text('SENAI CIMATEC · 2026', 50, 82);

    doc.fillColor('#0D1B2A').fontSize(20).font('Helvetica-Bold').text('RECIBO DE SESSÃO', 50, 130);
    doc.moveTo(50, 158).lineTo(545, 158).strokeColor('#00B87C').lineWidth(2).stroke();

    doc.fillColor('#718096').fontSize(10).font('Helvetica')
       .text(`Nº ${String(p.id).padStart(4,'0')}`, 50, 168)
       .text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, 380, 168);

    const campos = [
      ['Paciente',          nomePaciente],
      ['Psicólogo(a)',      nomePsicologo],
      ['Data da sessão',    data],
      ['Forma de pagamento', p.forma_pagamento],
    ];
    campos.forEach(([label, valor2], i) => {
      const y = 200 + i * 44;
      doc.rect(50, y, 495, 36).fill(i % 2 === 0 ? '#F7FAFC' : '#fff').stroke('#E2E8F0');
      doc.fillColor('#718096').fontSize(9).font('Helvetica').text(label.toUpperCase(), 62, y + 8);
      doc.fillColor('#0D1B2A').fontSize(13).font('Helvetica-Bold').text(valor2, 62, y + 20);
    });

    const yVal = 200 + campos.length * 44 + 16;
    doc.rect(50, yVal, 495, 56).fill('#0D1B2A');
    doc.fillColor('#00B87C').fontSize(11).font('Helvetica').text('VALOR PAGO', 62, yVal + 10);
    doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text(`R$ ${valor}`, 62, yVal + 26);

    doc.moveTo(50,  yVal + 100).lineTo(240, yVal + 100).strokeColor('#CBD5E0').lineWidth(1).stroke();
    doc.moveTo(305, yVal + 100).lineTo(545, yVal + 100).stroke();
    doc.fillColor('#718096').fontSize(10).font('Helvetica')
       .text('Psicólogo(a)', 50, yVal + 108)
       .text('Paciente', 305, yVal + 108);

    doc.rect(0, 750, 595, 92).fill('#F7FAFC');
    doc.fillColor('#A0AEC0').fontSize(9).font('Helvetica')
       .text('Documento emitido pelo PsicoManager · SENAI CIMATEC · IHC 2026', 50, 770, { align: 'center', width: 495 });

    doc.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.status(500).json({ erro: 'Erro ao gerar recibo.' });
  }
});

// Lembretes — envio individual
router.post('/lembretes/enviar', autenticar, async (req, res) => {
  try {
    const nodemailer = require('nodemailer');
    const { paciente_id } = req.body;
    const paciente = await Paciente.findByPk(paciente_id, {
      include: [{ model: Usuario, as: 'usuario', attributes: ['nome','email'] }]
    });
    if (!paciente) return res.status(404).json({ erro: 'Paciente não encontrado.' });

    const sessao = await Sessao.findOne({
      where: {
        paciente_id,
        status: { [Op.in]: ['agendada','confirmada'] },
        data_hora_inicio: { [Op.gt]: new Date() },
      },
      include: [{ model: Usuario, as: 'psicologo', attributes: ['nome'] }],
      order: [['data_hora_inicio','ASC']],
    });
    if (!sessao) return res.status(404).json({ erro: 'Nenhuma sessão futura encontrada.' });

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(501).json({ erro: 'E-mail não configurado. Adicione EMAIL_USER e EMAIL_PASS nas variáveis de ambiente.' });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: 587, secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const hora = new Date(sessao.data_hora_inicio).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
    const data = new Date(sessao.data_hora_inicio).toLocaleDateString('pt-BR');

    await transporter.sendMail({
      from: `"PsicoManager" <${process.env.EMAIL_USER}>`,
      to:   paciente.usuario?.email,
      subject: `📅 Lembrete: sessão em ${data} às ${hora}`,
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <div style="background:#0D1B2A;padding:24px;border-radius:12px 12px 0 0">
          <h2 style="color:#00B87C;margin:0">PsicoManager</h2>
          <p style="color:rgba(255,255,255,.6);margin:4px 0 0;font-size:13px">Lembrete de sessão</p>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #E2E8F0">
          <p>Olá, <strong>${paciente.usuario?.nome}</strong>!</p>
          <p>Você tem uma sessão agendada:</p>
          <div style="background:#F0F4F8;border-radius:8px;padding:16px;margin:16px 0">
            <p style="margin:4px 0">📅 <strong>Data:</strong> ${data}</p>
            <p style="margin:4px 0">🕐 <strong>Horário:</strong> ${hora}</p>
            <p style="margin:4px 0">👨‍⚕️ <strong>Psicólogo(a):</strong> ${sessao.psicologo?.nome}</p>
            <p style="margin:4px 0">${sessao.modalidade === 'online' ? '💻' : '🏥'} <strong>Modalidade:</strong> ${sessao.modalidade === 'online' ? 'Online' : 'Presencial'}</p>
          </div>
        </div>
        <div style="background:#F7FAFC;padding:12px;border-radius:0 0 12px 12px;text-align:center">
          <p style="color:#A0AEC0;font-size:12px;margin:0">PsicoManager · SENAI CIMATEC · 2026</p>
        </div>
      </div>`,
    });

    return res.json({ mensagem: `Lembrete enviado para ${paciente.usuario?.email}` });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao enviar: ' + e.message });
  }
});

module.exports = router;
