import { C, bg, title, rect, text, arrow } from './helpers.mjs';
export async function slide13(presentation, ctx) {
 const slide = presentation.slides.add(); bg(slide, ctx, 13); title(slide, ctx, 'AI Symptom Analysis Module', 'Symptom input becomes structured triage guidance for consultation preparation.');
 const steps=[['Symptom input','Patient enters fever, pain, duration, severity'],['Analysis engine','Rules/model evaluates symptom combinations'],['Health output','Likely condition, urgency, and suggested next action'],['Doctor context','Consultation starts with patient-reported details']];
 steps.forEach((s,i)=>{const x=100+i*280; rect(slide,ctx,x,260,220,130,'#0b1628',i===1?C.amber:C.cyan); text(slide,ctx,s[0],x+18,284,184,26,{size:21,bold:true,align:'center'}); text(slide,ctx,s[1],x+20,322,180,44,{size:15,color:C.muted,align:'center'}); if(i<3) arrow(slide,ctx,x+226,325,46,C.line);});
 text(slide,ctx,'The module does not replace doctors. It assists early guidance and helps patients choose appropriate consultation urgency.',185,500,910,52,{size:22,color:C.muted,align:'center'});
 return slide;
}
