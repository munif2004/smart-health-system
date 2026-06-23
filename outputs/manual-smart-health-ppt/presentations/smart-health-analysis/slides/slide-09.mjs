import { C, bg, title, band } from './helpers.mjs';
export async function slide09(presentation, ctx) {
 const slide = presentation.slides.add(); bg(slide, ctx, 9); title(slide, ctx, 'Technology Stack', 'Each technology maps to a specific platform responsibility.');
 band(slide,ctx,'React.js','Component based frontend for patient dashboard, doctor dashboard, booking, chat, and consultation screens.',76,176,360,122,C.cyan);
 band(slide,ctx,'Node.js + Express.js','Backend runtime and REST APIs for authentication, appointments, doctors, reports, payments, and consultation history.',460,176,360,122,C.green);
 band(slide,ctx,'MongoDB','Document database for users, appointments, messages, consultations, reports, payments, and doctor profiles.',844,176,360,122,C.amber);
 band(slide,ctx,'Socket.io','Realtime events for chat, typing, read receipts, consultation join/leave, and WebRTC signaling.',76,360,360,122,C.blue);
 band(slide,ctx,'WebRTC','Browser media connection for remote video, local preview, ICE exchange, and peer audio/video streams.',460,360,360,122,C.cyan);
 band(slide,ctx,'JWT + Razorpay','JWT secures role-based API access; Razorpay supports appointment fee payment workflow.',844,360,360,122,C.red);
 return slide;
}
