import { C, bg, title, rect, text, bulletList } from './helpers.mjs';
export async function slide12(presentation, ctx) {
 const slide = presentation.slides.add(); bg(slide, ctx, 12); title(slide, ctx, 'Doctor Module', 'The doctor workspace centralizes appointment and consultation management.');
 rect(slide,ctx,72,190,470,330,'#0b1628',C.green); text(slide,ctx,'Doctor Dashboard',112,225,390,34,{size:28,bold:true});
 bulletList(slide,ctx,['View accepted and pending appointments','Start or join video consultation rooms','Review patient details and consultation chat','Create reports and medical notes','Track availability and consultation fee'],112,292,370,44);
 rect(slide,ctx,690,190,420,330,'#10243f',C.cyan); text(slide,ctx,'Operational result',730,236,340,30,{size:25,bold:true,align:'center'}); text(slide,ctx,'Doctor actions are connected to the same appointment, patient, payment, message, and report records, reducing context switching during consultation.',735,306,330,120,{size:21,color:C.muted,align:'center'});
 return slide;
}
