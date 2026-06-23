import { C, bg, title, rect, text } from './helpers.mjs';
export async function slide10(presentation, ctx) {
 const slide = presentation.slides.add(); bg(slide, ctx, 10); title(slide, ctx, 'Modules', 'Five core modules compose the Smart Health Analysis System.');
 rect(slide,ctx,520,290,240,90,'#10243f',C.cyan); text(slide,ctx,'Smart Health\nAnalysis System',552,315,176,40,{size:21,bold:true,align:'center'});
 const mods=[['Patient Module',140,170,C.cyan],['Doctor Module',860,170,C.green],['AI Symptom Analysis',120,455,C.amber],['Video Consultation',520,500,C.blue],['Appointment Booking',870,455,C.red]];
 mods.forEach(m=>{rect(slide,ctx,m[1],m[2],270,86,'#0b1628',m[3]); text(slide,ctx,m[0],m[1]+20,m[2]+28,230,24,{size:20,bold:true,align:'center'});});
 text(slide,ctx,'Shared platform services: Authentication, database, payments, chat events, report storage, and role-based navigation.',220,615,840,32,{size:18,color:C.muted,align:'center'});
 return slide;
}
