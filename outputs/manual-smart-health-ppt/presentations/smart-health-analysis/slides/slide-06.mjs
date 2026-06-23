import { C, bg, title, rect, text, pill, arrow } from './helpers.mjs';
export async function slide06(presentation, ctx) {
 const slide = presentation.slides.add(); bg(slide, ctx, 6); title(slide, ctx, 'Proposed System', 'The proposed platform integrates the full digital consultation lifecycle.');
 pill(slide,ctx,'Patient portal',90,244,170,C.cyan); arrow(slide,ctx,270,263,70,C.line);
 pill(slide,ctx,'AI symptom analysis',350,244,210,C.amber); arrow(slide,ctx,570,263,70,C.line);
 pill(slide,ctx,'Appointment booking',650,244,220,C.green); arrow(slide,ctx,880,263,70,C.line);
 pill(slide,ctx,'Doctor dashboard',960,244,190,C.blue);
 rect(slide,ctx,205,390,870,86,'#0b1628',C.line); text(slide,ctx,'Realtime layer: Socket.io chat, WebRTC video consultation, consultation status updates',235,420,810,28,{size:22,color:C.white,align:'center'});
 rect(slide,ctx,305,515,670,72,'#10243f',C.cyan); text(slide,ctx,'Secure platform services: JWT authentication, MongoDB records, Razorpay payments',330,540,620,24,{size:19,color:C.muted,align:'center'});
 return slide;
}
