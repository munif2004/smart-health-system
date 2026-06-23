import { C, bg, title, rect, text, arrow } from './helpers.mjs';
export async function slide15(presentation, ctx) {
 const slide = presentation.slides.add(); bg(slide, ctx, 15); title(slide, ctx, 'Appointment Booking Module', 'Booking connects doctor selection, scheduling, payment, and consultation room access.');
 const rows=[['1. Select doctor','Patient filters by specialization and availability'],['2. Create appointment','Backend stores appointment status and links patient/doctor'],['3. Process payment','Razorpay supports fee collection and payment status'],['4. Start consultation','Doctor accepts/starts room; patient joins video consultation']];
 rows.forEach((r,i)=>{const y=190+i*105; rect(slide,ctx,110,y,260,64,'#0b1628',i%2?C.green:C.cyan); text(slide,ctx,r[0],132,y+20,215,22,{size:18,bold:true}); arrow(slide,ctx,390,y+31,90,C.line); rect(slide,ctx,505,y,600,64,'#10243f',C.line); text(slide,ctx,r[1],530,y+20,550,22,{size:18,color:C.muted});});
 return slide;
}
