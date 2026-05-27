const PDFDocument = require('pdfkit');

// Gerar recibo em PDF
function gerarReciboPDF(res, dados) {
  const { nomePaciente, nomePsicologo, valor, formaPagamento, data, sessaoId } = dados;

  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="recibo_${sessaoId || 'sessao'}.pdf"`);
  doc.pipe(res);

  // Cabeçalho
  doc.rect(0, 0, 595, 120).fill('#0D1B2A');
  doc.fillColor('#00B87C').fontSize(28).font('Helvetica-Bold').text('PsicoManager', 50, 35);
  doc.fillColor('#ffffff').fontSize(12).font('Helvetica').text('Sistema de Gestão Psicológica', 50, 68);
  doc.fillColor('rgba(255,255,255,0.5)').fontSize(10).text('SENAI CIMATEC · 2026', 50, 88);

  // Título do documento
  doc.fillColor('#0D1B2A').fontSize(20).font('Helvetica-Bold').text('RECIBO DE SESSÃO', 50, 145);
  doc.moveTo(50, 172).lineTo(545, 172).strokeColor('#00B87C').lineWidth(2).stroke();

  // Número e data
  doc.fillColor('#718096').fontSize(10).font('Helvetica')
     .text(`Nº ${String(sessaoId || '001').padStart(4,'0')}`, 50, 182)
     .text(`Data de emissão: ${new Date().toLocaleDateString('pt-BR')}`, 380, 182);

  // Dados principais
  const y = 220;
  const campos = [
    { label: 'Paciente',         valor: nomePaciente },
    { label: 'Psicólogo(a)',     valor: nomePsicologo },
    { label: 'Data da sessão',   valor: data },
    { label: 'Forma de pagamento', valor: formaPagamento },
  ];

  campos.forEach((c, i) => {
    const yPos = y + (i * 44);
    doc.rect(50, yPos, 495, 36).fill(i % 2 === 0 ? '#F7FAFC' : '#ffffff').stroke('#E2E8F0');
    doc.fillColor('#718096').fontSize(9).font('Helvetica').text(c.label.toUpperCase(), 62, yPos + 8);
    doc.fillColor('#0D1B2A').fontSize(13).font('Helvetica-Bold').text(c.valor || '—', 62, yPos + 20);
  });

  // Valor em destaque
  const yValor = y + (campos.length * 44) + 16;
  doc.rect(50, yValor, 495, 60).fill('#0D1B2A');
  doc.fillColor('#00B87C').fontSize(11).font('Helvetica').text('VALOR PAGO', 62, yValor + 12);
  doc.fillColor('#ffffff').fontSize(26).font('Helvetica-Bold')
     .text(`R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 62, yValor + 26);

  // Linha de assinatura
  const yAssin = yValor + 100;
  doc.moveTo(50, yAssin).lineTo(250, yAssin).strokeColor('#CBD5E0').lineWidth(1).stroke();
  doc.fillColor('#718096').fontSize(10).font('Helvetica')
     .text('Assinatura do Psicólogo(a)', 50, yAssin + 6);
  doc.moveTo(310, yAssin).lineTo(545, yAssin).stroke();
  doc.text('Assinatura do Paciente', 310, yAssin + 6);

  // Rodapé
  doc.rect(0, 750, 595, 92).fill('#F7FAFC');
  doc.moveTo(0, 750).lineTo(595, 750).strokeColor('#E2E8F0').lineWidth(1).stroke();
  doc.fillColor('#A0AEC0').fontSize(9).font('Helvetica')
     .text('Este recibo é um documento válido de pagamento emitido pelo sistema PsicoManager.', 50, 765, { align: 'center', width: 495 })
     .text('PsicoManager · SENAI CIMATEC · IHC 2026', 50, 790, { align: 'center', width: 495 });

  doc.end();
}

// Gerar laudo em PDF
function gerarLaudoPDF(res, dados) {
  const { nomePaciente, nomePsicologo, crp, hipotese, observacoes, data } = dados;

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="laudo_${nomePaciente?.replace(/\s/g,'_')}.pdf"`);
  doc.pipe(res);

  // Cabeçalho
  doc.rect(0, 0, 595, 110).fill('#0D1B2A');
  doc.fillColor('#00B87C').fontSize(26).font('Helvetica-Bold').text('PsicoManager', 50, 30);
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica').text('Clínica de Psicologia', 50, 62);
  doc.fillColor('rgba(255,255,255,0.5)').fontSize(10).text('SENAI CIMATEC · Salvador, BA', 50, 80);

  doc.fillColor('#0D1B2A').fontSize(18).font('Helvetica-Bold').text('LAUDO PSICOLÓGICO', 50, 130);
  doc.moveTo(50, 155).lineTo(545, 155).strokeColor('#00B87C').lineWidth(2).stroke();

  // Info
  doc.fillColor('#4A5568').fontSize(11).font('Helvetica')
     .text(`Paciente: `, 50, 170).font('Helvetica-Bold').text(nomePaciente || '—', 110, 170)
     .font('Helvetica').text(`Data: `, 380, 170).font('Helvetica-Bold').text(data || new Date().toLocaleDateString('pt-BR'), 408, 170);

  doc.font('Helvetica').text(`Psicólogo(a): `, 50, 190).font('Helvetica-Bold').text(nomePsicologo || '—', 132, 190);
  if (crp) doc.font('Helvetica').text(` · CRP: `, 132 + (nomePsicologo?.length * 6.5 || 80), 190).font('Helvetica-Bold').text(crp, 0, 0);

  doc.moveTo(50, 215).lineTo(545, 215).strokeColor('#E2E8F0').lineWidth(1).stroke();

  // Hipótese diagnóstica
  doc.fillColor('#0D1B2A').fontSize(12).font('Helvetica-Bold').text('HIPÓTESE DIAGNÓSTICA', 50, 230);
  doc.rect(50, 248, 495, 36).fill('#F0F4F8');
  doc.fillColor('#2D3748').fontSize(12).font('Helvetica').text(hipotese || 'Não informado', 62, 260);

  // Observações
  doc.fillColor('#0D1B2A').fontSize(12).font('Helvetica-Bold').text('OBSERVAÇÕES CLÍNICAS', 50, 305);
  doc.rect(50, 323, 495, 200).fill('#FAFAFA').stroke('#E2E8F0');
  doc.fillColor('#4A5568').fontSize(11).font('Helvetica')
     .text(observacoes || 'Sem observações registradas.', 62, 335, { width: 471, lineGap: 4 });

  // Assinatura
  doc.moveTo(180, 590).lineTo(415, 590).strokeColor('#CBD5E0').lineWidth(1).stroke();
  doc.fillColor('#4A5568').fontSize(10).font('Helvetica').text(nomePsicologo || 'Psicólogo(a)', 180, 598, { width: 235, align: 'center' });
  if (crp) doc.text(`CRP ${crp}`, 180, 612, { width: 235, align: 'center' });

  // Rodapé
  doc.rect(0, 750, 595, 92).fill('#F7FAFC');
  doc.moveTo(0, 750).lineTo(595, 750).strokeColor('#E2E8F0').stroke();
  doc.fillColor('#A0AEC0').fontSize(9).font('Helvetica')
     .text('Documento emitido pelo sistema PsicoManager · SENAI CIMATEC · IHC 2026', 50, 768, { align: 'center', width: 495 });

  doc.end();
}

module.exports = { gerarReciboPDF, gerarLaudoPDF };
