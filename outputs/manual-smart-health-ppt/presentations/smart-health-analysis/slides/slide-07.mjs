import { C, bg, title, card } from './helpers.mjs';
export async function slide07(presentation, ctx) {
 const slide = presentation.slides.add(); bg(slide, ctx, 7); title(slide, ctx, 'Advantages', 'The integrated platform improves access, speed, and continuity.');
 const items=[['Faster access','Patients can book and join consultation online.',C.cyan],['Better triage','AI symptom analysis guides urgency and preparation.',C.amber],['Connected records','Appointments, chats, reports, and payments stay linked.',C.green],['Remote care','WebRTC video avoids external call tools.',C.blue],['Secure workflow','JWT based access and role separation protect APIs.',C.red],['Scalable stack','React, Node.js, Express, and MongoDB support modular growth.',C.cyan]];
 items.forEach((it,i)=>card(slide,ctx,it[0],it[1],80+(i%3)*390,185+Math.floor(i/3)*190,330,135,it[2]));
 return slide;
}
