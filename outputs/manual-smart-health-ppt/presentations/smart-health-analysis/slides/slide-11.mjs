import { C, bg, title, rect, text, arrow } from './helpers.mjs';
export async function slide11(presentation, ctx) {
 const slide = presentation.slides.add(); bg(slide, ctx, 11); title(slide, ctx, 'Patient Module', 'Patients can move from symptoms to consultation without leaving the platform.');
 const steps=['Register / Login','Enter symptoms','Book doctor','Pay fee','Chat or video consult','View reports'];
 steps.forEach((s,i)=>{const x=72+i*190; rect(slide,ctx,x,285,150,90,'#0b1628',i%2?C.green:C.cyan); text(slide,ctx,s,x+12,312,126,34,{size:16,align:'center',bold:true}); if(i<5) arrow(slide,ctx,x+154,330,32,C.line);});
 text(slide,ctx,'Patient features include profile access, appointment tracking, consultation room entry, message sending, symptom checker use, and payment status follow-up.',128,480,1020,58,{size:22,color:C.muted,align:'center'});
 return slide;
}
