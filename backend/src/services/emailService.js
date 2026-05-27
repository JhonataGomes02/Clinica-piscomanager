const nodemailer = require('nodemailer');
require('dotenv').config();

// Criar transporter do Nodemailer
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST  || 'smtp.gmail.com',
  port:   process.env.EMAIL_PORT  || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Enviar lembrete de sessão
async function enviarLembretesessao({ nomePaciente, emailPaciente, nomePsicologo, dataHora, modalidade }) {
  const data = new Date(dataHora).toLocaleDateString('pt-BR');
  const hora = new Date(dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const html = `
    <div style="font-family:Segoe UI,sans-serif;max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)">
      <div style="background:linear-gradient(135deg,#0D1B2A,#1a3a5c);padding:28px 32px;text-align:center">
        <div style="background:#00B87C;width:52px;height:52px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
          <span style="font-size:24px">🧠</span>
        </div>
        <h1 style="color:#fff;margin:0;font-size:20px">PsicoManager</h1>
        <p style="color:rgba(255,255,255,.6);margin:4px 0 0;font-size:13px">Lembrete de sessão</p>
      </div>
      <div style="padding:28px 32px">
        <p style="font-size:15px;color:#2D3748">Olá, <strong>${nomePaciente}</strong>! 👋</p>
        <p style="font-size:14px;color:#4A5568;line-height:1.6">
          Este é um lembrete automático de que você tem uma sessão agendada <strong>amanhã</strong>:
        </p>
        <div style="background:#F0F4F8;border-radius:10px;padding:18px;margin:20px 0">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <span style="font-size:18px">📅</span>
            <div><div style="font-size:12px;color:#718096;text-transform:uppercase;letter-spacing:.5px">Data</div><div style="font-weight:700;color:#0D1B2A">${data}</div></div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <span style="font-size:18px">🕐</span>
            <div><div style="font-size:12px;color:#718096;text-transform:uppercase;letter-spacing:.5px">Horário</div><div style="font-weight:700;color:#0D1B2A">${hora}</div></div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <span style="font-size:18px">👨‍⚕️</span>
            <div><div style="font-size:12px;color:#718096;text-transform:uppercase;letter-spacing:.5px">Psicólogo(a)</div><div style="font-weight:700;color:#0D1B2A">${nomePsicologo}</div></div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:18px">${modalidade === 'online' ? '💻' : '🏥'}</span>
            <div><div style="font-size:12px;color:#718096;text-transform:uppercase;letter-spacing:.5px">Modalidade</div><div style="font-weight:700;color:#0D1B2A">${modalidade === 'online' ? 'Online (Google Meet)' : 'Presencial'}</div></div>
          </div>
        </div>
        <p style="font-size:13px;color:#718096;line-height:1.6">
          Caso precise cancelar ou reagendar, entre em contato com a clínica com antecedência.
        </p>
      </div>
      <div style="background:#F7FAFC;padding:16px 32px;text-align:center;border-top:1px solid #E2E8F0">
        <p style="font-size:12px;color:#A0AEC0;margin:0">PsicoManager · Sistema de Gestão Psicológica · SENAI CIMATEC 2026</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from:    `"PsicoManager" <${process.env.EMAIL_USER}>`,
    to:      emailPaciente,
    subject: `📅 Lembrete: sessão amanhã às ${hora}`,
    html,
  });

  console.log(`✅ Lembrete enviado para ${emailPaciente}`);
}

// Enviar e-mail genérico
async function enviarEmail({ para, assunto, html }) {
  await transporter.sendMail({
    from: `"PsicoManager" <${process.env.EMAIL_USER}>`,
    to:   para,
    subject: assunto,
    html,
  });
}

module.exports = { enviarLembretesessao, enviarEmail };
