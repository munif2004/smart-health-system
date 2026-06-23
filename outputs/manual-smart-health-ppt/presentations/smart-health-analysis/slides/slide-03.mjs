import { C, bg, title, rect, text, bulletList } from './helpers.mjs';
export async function slide03(presentation, ctx) {
 const slide = presentation.slides.add(); bg(slide, ctx, 3); title(slide, ctx, 'Abstract', 'The system combines health analysis and consultation into one web platform.');
 rect(slide, ctx, 72, 190, 560, 330, '#0b1628', C.line);
 text(slide, ctx, 'Project Summary', 104, 222, 300, 32, { size: 25, bold: true });
 text(slide, ctx, 'Smart Health Analysis System is a web application that connects patients and doctors through appointment booking, AI symptom analysis, realtime chat, secure authentication, online payment, and browser-based video consultation. The project reduces manual coordination and improves the speed of clinical communication.', 104, 276, 486, 160, { size: 20, color: C.muted });
 bulletList(slide, ctx, ['MERN full-stack implementation', 'JWT based secured API access', 'Socket.io chat and WebRTC signaling', 'MongoDB document database'], 720, 212, 430, 54);
 return slide;
}
