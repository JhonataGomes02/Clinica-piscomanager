const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function enviarLembrete(para, nomesPaciente, dataHora, psicologo) {
  const opcoes = {
    from: process.env.EMAIL_FROM || 'PsicoManager <noreply@psicomanager.com>',
    to: para,
    subject: 'Lembrete de Sessão — PsicoManager',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="background: #0A2342; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #fff; margin: 0;">🧠 PsicoManager</h2>
        </div>
        <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #eee;">
          <p>Olá, <strong>${nomesPaciente}</strong>!</p>
          <p>Este é um lembrete da sua sessão agendada para <strong>amanhã</strong>:</p>
          <div style="background: #E1F5EE; border-left: 4px solid #1D9E75; padding: 12px 16px; border-radius: 4px; margin: 16px 0;">
            <p style="margin: 0;"><strong>📅 Data e hora:</strong> ${dataHora}</p>
            <p style="margin: 8px 0 0;"><strong>👩‍⚕️ Profissional:</strong> ${psicologo}</p>
          </div>
          <p style="color: #666; font-size: 14px;">Caso precise cancelar ou remarcar, entre em contato com a clínica com antecedência.</p>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">PsicoManager — Sistema de Gestão Psicológica</p>
        </div>
      </div>
    `
  };
  return transporter.sendMail(opcoes);
}

module.exports = { transporter, enviarLembrete };
