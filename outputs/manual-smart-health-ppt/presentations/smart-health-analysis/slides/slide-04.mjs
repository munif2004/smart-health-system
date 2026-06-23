import { C, bg, title, rect, text, arrow } from './helpers.mjs';
export async function slide04(presentation, ctx) {
 const slide = presentation.slides.add(); bg(slide, ctx, 4); title(slide, ctx, 'Existing System', 'Current consultation flow is fragmented across manual steps.');
 const labels=['Patient visits hospital','Reception records details','Doctor checks queue','Manual consultation','Payment/report follow-up'];
 labels.forEach((l,i)=>{ const x=80+i*230; rect(slide,ctx,x,270,170,110,'#0b1628',C.line); text(slide,ctx,l,x+14,300,142,48,{size:17,color:C.white,align:'center'}); if(i<4) arrow(slide,ctx,x+174,324,48,C.cyan); });
 text(slide, ctx, 'Information is scattered between phone calls, physical registers, manual payment confirmation, and separate messaging channels.', 130, 470, 980, 58, { size: 24, color: C.muted, align: 'center' });
 return slide;
}
