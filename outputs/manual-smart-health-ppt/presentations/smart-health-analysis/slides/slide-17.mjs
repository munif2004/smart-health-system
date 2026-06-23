import { C, bg, title, rect, text } from './helpers.mjs';
export async function slide17(presentation, ctx) {
 const slide = presentation.slides.add(); bg(slide, ctx, 17); title(slide, ctx, 'Screenshots', 'Insert real application screens to demonstrate implemented workflows.');
 const shots=[['Patient Dashboard',80,175],['Doctor Dashboard',480,175],['Video Consultation + Chat',880,175],['Appointment Booking',280,420],['AI Symptom Checker',680,420]];
 shots.forEach((s,i)=>{rect(slide,ctx,s[1],s[2],300,170,'#0b1628',i%2?C.green:C.cyan); rect(slide,ctx,s[1]+18,s[2]+18,264,100,'#07111f',C.line); text(slide,ctx,'Paste screenshot here',s[1]+50,s[2]+57,200,22,{size:16,color:C.muted,align:'center'}); text(slide,ctx,s[0],s[1]+18,s[2]+132,264,22,{size:18,bold:true,align:'center'});});
 return slide;
}
