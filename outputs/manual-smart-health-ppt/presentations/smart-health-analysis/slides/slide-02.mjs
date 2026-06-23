import { C, bg, title, card } from './helpers.mjs';
export async function slide02(presentation, ctx) {
 const slide = presentation.slides.add(); bg(slide, ctx, 2); title(slide, ctx, 'Objective', 'Build a single digital workflow for smarter healthcare access.');
 card(slide, ctx, 'Patient access', 'Allow patients to register, describe symptoms, book appointments, pay fees, chat, and join consultation rooms from one interface.', 72, 190, 340, 170, C.cyan);
 card(slide, ctx, 'Doctor operations', 'Give doctors a dashboard to manage appointments, patient details, reports, messages, and live video consultations.', 470, 190, 340, 170, C.green);
 card(slide, ctx, 'AI assisted triage', 'Use symptom inputs to provide likely conditions, urgency level, and next-step guidance before consultation.', 868, 190, 340, 170, C.amber);
 card(slide, ctx, 'Realtime consultation', 'Support low-latency communication using Socket.io signaling, chat delivery, and WebRTC media streams.', 270, 415, 340, 150, C.blue);
 card(slide, ctx, 'Secure transactions', 'Protect session APIs using JWT and connect appointment fees through Razorpay payment flow.', 670, 415, 340, 150, C.red);
 return slide;
}
