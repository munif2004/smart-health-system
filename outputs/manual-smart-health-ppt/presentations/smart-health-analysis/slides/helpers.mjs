const W = 1280;
const H = 720;
const C = {
  bg: '#07111f', panel: '#0f1d33', panel2: '#142542', white: '#f8fafc', muted: '#9fb3c8',
  cyan: '#17bebb', green: '#20c997', amber: '#f5a623', red: '#ef4444', blue: '#3b82f6', line: '#2f4564'
};

function rect(slide, ctx, x, y, w, h, fill=C.panel, line=C.line, name) {
  return ctx.addShape(slide, { x, y, w, h, fill, line: { fill: line, width: 1 }, name });
}
function text(slide, ctx, value, x, y, w, h, opts={}) {
  return ctx.addText(slide, { text: value, x, y, w, h, fontSize: opts.size || 24, color: opts.color || C.white, bold: opts.bold || false, typeface: opts.face || (opts.title ? ctx.fonts.title : ctx.fonts.body), align: opts.align || 'left', valign: opts.valign || 'top', insets: opts.insets || { left: 0, right: 0, top: 0, bottom: 0 }, fill: opts.fill || 'transparent', line: { fill: 'transparent', width: 0 }, name: opts.name });
}
function bg(slide, ctx, n) {
  rect(slide, ctx, 0, 0, W, H, C.bg, C.bg);
  rect(slide, ctx, 0, 0, 12, H, C.cyan, C.cyan);
  text(slide, ctx, 'MCA Project | Smart Health Analysis System', 44, 676, 520, 20, { size: 11, color: C.muted });
  text(slide, ctx, String(n).padStart(2, '0'), 1192, 670, 44, 24, { size: 13, color: C.muted, align: 'right' });
}
function title(slide, ctx, kicker, claim) {
  text(slide, ctx, kicker.toUpperCase(), 62, 42, 280, 22, { size: 13, color: C.cyan, bold: true, name: 'kicker-label' });
  text(slide, ctx, claim, 62, 72, 880, 82, { size: 38, color: C.white, bold: true, title: true });
}
function bulletList(slide, ctx, items, x, y, w, gap=46, color=C.white) {
  items.forEach((item, i) => {
    const yy = y + i * gap;
    rect(slide, ctx, x, yy + 8, 8, 8, i % 2 ? C.green : C.cyan, i % 2 ? C.green : C.cyan);
    text(slide, ctx, item, x + 24, yy, w - 24, 36, { size: 20, color });
  });
}
function card(slide, ctx, label, body, x, y, w, h, accent=C.cyan) {
  rect(slide, ctx, x, y, w, h, C.panel, C.line);
  rect(slide, ctx, x, y, 6, h, accent, accent);
  text(slide, ctx, label, x + 22, y + 18, w - 38, 28, { size: 20, color: C.white, bold: true });
  text(slide, ctx, body, x + 22, y + 54, w - 38, h - 70, { size: 15, color: C.muted });
}
function pill(slide, ctx, label, x, y, w, accent=C.cyan) {
  rect(slide, ctx, x, y, w, 42, '#0b1628', accent);
  text(slide, ctx, label, x + 12, y + 10, w - 24, 20, { size: 15, color: C.white, align: 'center', bold: true });
}
function band(slide, ctx, label, detail, x, y, w, h, accent=C.cyan) {
  rect(slide, ctx, x, y, w, h, '#0b1628', C.line);
  rect(slide, ctx, x, y, w, 6, accent, accent);
  text(slide, ctx, label, x + 18, y + 18, w - 36, 28, { size: 22, bold: true });
  text(slide, ctx, detail, x + 18, y + 52, w - 36, h - 62, { size: 15, color: C.muted });
}
function arrow(slide, ctx, x, y, w, color=C.line) {
  rect(slide, ctx, x, y, w, 3, color, color);
  rect(slide, ctx, x + w - 8, y - 5, 8, 13, color, color);
}

export { W, H, C, rect, text, bg, title, bulletList, card, pill, band, arrow };
