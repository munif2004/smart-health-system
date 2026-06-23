import { C, bg, title, rect, text, arrow } from './helpers.mjs';
export async function slide08(presentation, ctx) {
 const slide = presentation.slides.add(); bg(slide, ctx, 8); title(slide, ctx, 'System Architecture', 'A layered MERN architecture connects UI, APIs, realtime services, and data.');
 rect(slide,ctx,74,198,230,100,'#0b1628',C.cyan); text(slide,ctx,'React.js Frontend\nPatient and Doctor UI',94,226,190,48,{size:18,align:'center'});
 arrow(slide,ctx,316,246,90,C.line);
 rect(slide,ctx,430,160,260,78,'#10243f',C.green); text(slide,ctx,'Express REST APIs\nAuth, booking, reports',452,184,216,36,{size:17,align:'center'});
 rect(slide,ctx,430,282,260,78,'#10243f',C.blue); text(slide,ctx,'Socket.io Server\nChat and signaling',452,306,216,36,{size:17,align:'center'});
 arrow(slide,ctx,704,198,90,C.line); arrow(slide,ctx,704,320,90,C.line);
 rect(slide,ctx,815,130,250,90,'#0b1628',C.amber); text(slide,ctx,'MongoDB\nUsers, doctors, appointments, messages',837,154,206,50,{size:16,align:'center'});
 rect(slide,ctx,815,260,250,90,'#0b1628',C.red); text(slide,ctx,'Razorpay\nPayment order and verification',837,286,206,38,{size:16,align:'center'});
 rect(slide,ctx,815,390,250,90,'#0b1628',C.cyan); text(slide,ctx,'WebRTC Media\nPeer-to-peer audio/video streams',837,416,206,38,{size:16,align:'center'});
 text(slide,ctx,'JWT protects API access. Socket.io exchanges offers, answers, ICE candidates, chat messages, and consultation events.',150,565,960,46,{size:20,color:C.muted,align:'center'});
 return slide;
}
