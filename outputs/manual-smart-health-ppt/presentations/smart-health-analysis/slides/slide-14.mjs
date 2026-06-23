import { C, bg, title, rect, text, arrow } from './helpers.mjs';
export async function slide14(presentation, ctx) {
 const slide = presentation.slides.add(); bg(slide, ctx, 14); title(slide, ctx, 'Video Consultation Module', 'Socket.io handles signaling while WebRTC carries the media stream.');
 rect(slide,ctx,88,250,230,150,'#0b1628',C.cyan); text(slide,ctx,'Patient Browser\nLocal preview + remote video',118,300,170,48,{size:18,align:'center'});
 rect(slide,ctx,525,190,230,95,'#10243f',C.blue); text(slide,ctx,'Socket.io\nOffer / answer / ICE',555,220,170,38,{size:18,align:'center'});
 rect(slide,ctx,525,365,230,95,'#10243f',C.green); text(slide,ctx,'WebRTC PeerConnection\nAudio + video stream',550,392,180,38,{size:17,align:'center'});
 rect(slide,ctx,960,250,230,150,'#0b1628',C.amber); text(slide,ctx,'Doctor Browser\nRemote patient + self preview',990,300,170,48,{size:18,align:'center'});
 arrow(slide,ctx,330,235,180,C.blue); arrow(slide,ctx,770,235,175,C.blue); arrow(slide,ctx,330,412,180,C.green); arrow(slide,ctx,770,412,175,C.green);
 text(slide,ctx,'Correct layout: remoteVideoRef renders only the large remote stream; localVideoRef renders only the small top-right self preview.',150,535,980,46,{size:20,color:C.muted,align:'center'});
 return slide;
}
