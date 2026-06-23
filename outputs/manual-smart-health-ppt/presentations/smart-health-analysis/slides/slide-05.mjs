import { C, bg, title, card } from './helpers.mjs';
export async function slide05(presentation, ctx) {
 const slide = presentation.slides.add(); bg(slide, ctx, 5); title(slide, ctx, 'System Gap', 'Manual and disconnected systems slow down care delivery.');
 card(slide, ctx, 'Delayed response', 'Patients wait for availability confirmation and consultation updates.', 86, 190, 330, 148, C.red);
 card(slide, ctx, 'No early triage', 'Symptoms are not analyzed before doctor interaction, increasing uncertainty.', 474, 190, 330, 148, C.amber);
 card(slide, ctx, 'Weak continuity', 'Chat history, appointments, reports, and payments are not connected.', 862, 190, 330, 148, C.cyan);
 card(slide, ctx, 'Limited remote care', 'Video consultation may rely on external tools without hospital context.', 278, 415, 330, 148, C.blue);
 card(slide, ctx, 'Security risk', 'Unstructured communication can expose private health information.', 670, 415, 330, 148, C.green);
 return slide;
}
