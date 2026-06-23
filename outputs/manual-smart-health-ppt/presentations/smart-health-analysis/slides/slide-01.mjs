import { C, rect, text, bg } from './helpers.mjs';
export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx, 1);
  rect(slide, ctx, 740, 0, 540, 720, '#0b1628', '#0b1628');
  rect(slide, ctx, 790, 92, 360, 360, '#10243f', '#17bebb');
  rect(slide, ctx, 860, 162, 220, 220, '#07111f', '#20c997');
  text(slide, ctx, 'AI', 918, 222, 110, 70, { size: 58, color: C.cyan, bold: true, align: 'center', title: true });
  text(slide, ctx, 'Smart Health\nAnalysis System', 72, 116, 620, 178, { size: 58, color: C.white, bold: true, title: true });
  text(slide, ctx, 'MCA Project Presentation', 78, 318, 480, 34, { size: 24, color: C.green, bold: true });
  text(slide, ctx, 'Your Name', 80, 458, 360, 32, { size: 22, color: C.white, bold: true });
  text(slide, ctx, 'College Name', 80, 494, 420, 28, { size: 19, color: C.muted });
  text(slide, ctx, 'A MERN based healthcare platform with AI symptom analysis, appointment booking, secure payments, chat, and WebRTC video consultation.', 80, 560, 620, 58, { size: 18, color: C.muted });
  return slide;
}
