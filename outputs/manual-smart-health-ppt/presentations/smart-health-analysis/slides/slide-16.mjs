import { C, bg, title, rect, text } from './helpers.mjs';
export async function slide16(presentation, ctx) {
 const slide = presentation.slides.add(); bg(slide, ctx, 16); title(slide, ctx, 'Database Design', 'MongoDB collections are organized around users, care events, and communication.');
 const ents=[['Users','role, name, email, passwordHash, profile',80,175,C.cyan],['Doctors','specialization, fee, availability, rating',505,175,C.green],['Appointments','patientId, doctorId, date, status, paymentStatus',875,175,C.amber],['Consultations','roomId, appointmentId, participants, status',120,405,C.blue],['Messages','roomId, senderId, message, read/delivered flags',505,405,C.cyan],['Reports / Payments','appointmentId, diagnosis, notes, razorpayId, amount',875,405,C.red]];
 ents.forEach(e=>{rect(slide,ctx,e[2],e[3],300,120,'#0b1628',e[4]); text(slide,ctx,e[0],e[2]+18,e[3]+18,250,26,{size:22,bold:true}); text(slide,ctx,e[1],e[2]+18,e[3]+56,250,42,{size:15,color:C.muted});});
 text(slide,ctx,'Relationships are maintained through document IDs such as patientId, doctorId, appointmentId, roomId, and senderId.',180,620,920,28,{size:18,color:C.muted,align:'center'});
 return slide;
}
