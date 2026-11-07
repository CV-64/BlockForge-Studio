/* ============================================================
   BlockForge Studio — advanced pixel art editor
   ============================================================ */
(function (root) {
'use strict';
var BF = root.BF;

BF.textureCanvas = function (tex, px) {
  px = px || 32;
  var c = document.createElement('canvas');
  c.width = tex.w; c.height = tex.h;
  var ctx = c.getContext('2d');
  var img = ctx.createImageData(tex.w, tex.h);
  for (var i=0;i<tex.w*tex.h;i++) {
    var h = tex.data[i];
    if (h) { var rgb = BF.hex2rgb(h);
      img.data[i*4]=rgb[0]; img.data[i*4+1]=rgb[1]; img.data[i*4+2]=rgb[2]; img.data[i*4+3]=255; }
  }
  ctx.putImageData(img,0,0);
  c.style.width = px + 'px'; c.style.height = px + 'px';
  return c;
};
BF.textureBase64 = function (tex) {
  var c = BF.textureCanvas(tex, tex.w);
  c.style.width = ''; c.style.height = '';
  return c.toDataURL('image/png').split(',')[1];
};

function PixelEditor(canvas, onChange) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.onChange = onChange || function(){};
  this.onHistory = null;
  this.onPickColor = null;
  this.tex = null;
  this.tool = 'pencil';
  this.color = '#7ac74f';
  this.secondary = '#ffffff';
  this.grid = true;
  this.zoom = 20;
  this.brush = 1;
  this.symmetry = 'none';
  this.rectFill = false;
  this.history = [];
  this.undoStack = [];
  this.redoStack = [];
  this.drag = null;
  this.snapshot = null;
  this._bind();
}
PixelEditor.prototype.load = function (tex, keepHistory) {
  this.tex = tex;
  if (!keepHistory) { this.undoStack = []; this.redoStack = []; }
  this.fit(); this.render(); this._hist();
};
PixelEditor.prototype.fit = function () {
  var target = 336;
  this.zoom = Math.max(4, Math.floor(target / this.tex.w));
  this.canvas.width = this.tex.w * this.zoom;
  this.canvas.height = this.tex.h * this.zoom;
  this.canvas.style.width = this.canvas.width + 'px';
  this.canvas.style.height = this.canvas.height + 'px';
};
PixelEditor.prototype.setZoom = function (z) {
  this.zoom = Math.max(2, Math.min(40, z));
  this.canvas.width = this.tex.w * this.zoom;
  this.canvas.height = this.tex.h * this.zoom;
  this.canvas.style.width = this.canvas.width + 'px';
  this.canvas.style.height = this.canvas.height + 'px';
  this.render();
};
PixelEditor.prototype.render = function () {
  if (!this.tex) return;
  var t=this.tex, z=this.zoom, ctx=this.ctx, W=this.canvas.width, H=this.canvas.height;
  ctx.clearRect(0,0,W,H);
  var cell = Math.max(4, Math.floor(z/2));
  for (var y=0;y<t.h;y++) for (var x=0;x<t.w;x++) {
    ctx.fillStyle = ((Math.floor(x/2)+Math.floor(y/2))%2) ? '#2b3038' : '#353b45';
    ctx.fillRect(x*z,y*z,z,z);
  }
  for (var yy=0;yy<t.h;yy++) for (var xx=0;xx<t.w;xx++) {
    var col=t.data[yy*t.w+xx];
    if (col) { ctx.fillStyle=col; ctx.fillRect(xx*z,yy*z,z,z); }
  }
  if (this.grid && z>=5) {
    ctx.lineWidth=1;
    for (var i=0;i<=t.w;i++) {
      ctx.strokeStyle=(i%8===0)?'rgba(255,255,255,.22)':'rgba(255,255,255,.07)';
      ctx.beginPath(); ctx.moveTo(i*z+.5,0); ctx.lineTo(i*z+.5,H); ctx.stroke();
    }
    for (var j=0;j<=t.h;j++) {
      ctx.strokeStyle=(j%8===0)?'rgba(255,255,255,.22)':'rgba(255,255,255,.07)';
      ctx.beginPath(); ctx.moveTo(0,j*z+.5); ctx.lineTo(W,j*z+.5); ctx.stroke();
    }
  }
};
PixelEditor.prototype._hist = function () { if (this.onHistory) this.onHistory(this.undoStack.length,this.redoStack.length); };
PixelEditor.prototype.snapshotNow = function () { this.snapshot = this.tex.data.slice(); };
PixelEditor.prototype.restoreSnapshot = function () { if (this.snapshot) { this.tex.data=this.snapshot.slice(); this.render(); } };
PixelEditor.prototype.pushHistory = function () {
  this.undoStack.push(this.tex.data.slice());
  if (this.undoStack.length>60) this.undoStack.shift();
  this.redoStack=[]; this._hist();
};
PixelEditor.prototype.undo = function () {
  if (!this.undoStack.length) return;
  this.redoStack.push(this.tex.data.slice());
  this.tex.data=this.undoStack.pop();
  this.render(); this.onChange(); this._hist();
};
PixelEditor.prototype.redo = function () {
  if (!this.redoStack.length) return;
  this.undoStack.push(this.tex.data.slice());
  this.tex.data=this.redoStack.pop();
  this.render(); this.onChange(); this._hist();
};
PixelEditor.prototype.px = function (ev) {
  var r=this.canvas.getBoundingClientRect();
  var sx=this.canvas.width/r.width, sy=this.canvas.height/r.height;
  var x=Math.floor((ev.clientX-r.left)*sx/this.zoom), y=Math.floor((ev.clientY-r.top)*sy/this.zoom);
  return { x:Math.max(0,Math.min(this.tex.w-1,x)), y:Math.max(0,Math.min(this.tex.h-1,y)) };
};
PixelEditor.prototype.set = function (x,y,col) {
  if (x<0||y<0||x>=this.tex.w||y>=this.tex.h) return;
  this.tex.data[y*this.tex.w+x]=col;
};
PixelEditor.prototype.at = function (x,y) {
  if (x<0||y<0||x>=this.tex.w||y>=this.tex.h) return null;
  return this.tex.data[y*this.tex.w+x];
};
/* symmetric, brush-sized stamp with optional shading/spray */
PixelEditor.prototype.plot = function (x,y,col,mode) {
  var w=this.tex.w,h=this.tex.h, sym=this.symmetry, b=this.brush, half=Math.floor(b/2);
  var pts=[[x,y]];
  if (sym==='h'||sym==='both') pts.push([w-1-x,y]);
  if (sym==='v'||sym==='both') {
    pts.push([x,h-1-y]);
    if (sym==='both') pts.push([w-1-x,h-1-y]);
  }
  for (var n=0;n<pts.length;n++) {
    for (var dy=0;dy<b;dy++) for (var dx=0;dx<b;dx++) {
      var xx=pts[n][0]+dx-half, yy=pts[n][1]+dy-half;
      if (mode==='spray' && Math.random()>0.42) continue;
      var final=col;
      if (mode==='darken'||mode==='lighten') {
        var cur=this.at(xx,yy); if (!cur) continue;
        final=BF.shade(cur, mode==='darken' ? 0.86 : 1.16);
      }
      this.set(xx,yy,final);
    }
  }
};
PixelEditor.prototype.line = function (x0,y0,x1,y1,col,mode) {
  var dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx-dy;
  while (true) {
    this.plot(x0,y0,col,mode);
    if (x0===x1&&y0===y1) break;
    var e2=2*err;
    if (e2>-dy) { err-=dy; x0+=sx; }
    if (e2<dx) { err+=dx; y0+=sy; }
  }
};
PixelEditor.prototype.rect = function (x0,y0,x1,y1,col,mode,fill) {
  var a=Math.min(x0,x1),b=Math.max(x0,x1),c=Math.min(y0,y1),d=Math.max(y0,y1);
  if (fill) { for (var y=c;y<=d;y++) for (var x=a;x<=b;x++) this.plot(x,y,col,mode); }
  else {
    for (var x2=a;x2<=b;x2++) { this.plot(x2,c,col,mode); this.plot(x2,d,col,mode); }
    for (var y2=c;y2<=d;y2++) { this.plot(a,y2,col,mode); this.plot(b,y2,col,mode); }
  }
};
PixelEditor.prototype.ellipse = function (x0,y0,x1,y1,col,mode) {
  var a=Math.min(x0,x1),b=Math.max(x0,x1),c=Math.min(y0,y1),d=Math.max(y0,y1);
  var rx=(b-a)/2, ry=(d-c)/2, cx=(a+b)/2, cy=(c+d)/2;
  if (rx<0.5) rx=0.5; if (ry<0.5) ry=0.5;
  for (var y=c;y<=d;y++) for (var x=a;x<=b;x++) {
    var nx=(x-cx)/rx, ny=(y-cy)/ry;
    if (nx*nx+ny*ny<=1.02) this.plot(x,y,col,mode);
  }
};
PixelEditor.prototype.fill = function (x,y,col) {
  var t=this.tex,target=t.data[y*t.w+x];
  if (target===col) return;
  var stack=[[x,y]],seen={};
  while (stack.length) {
    var p=stack.pop(),px=p[0],py=p[1],k=py*t.w+px;
    if (px<0||py<0||px>=t.w||py>=t.h||seen[k]||t.data[k]!==target) continue;
    seen[k]=1; t.data[k]=col;
    stack.push([px+1,py],[px-1,py],[px,py+1],[px,py-1]);
  }
};
PixelEditor.prototype.gradient = function (x0,y0,x1,y1) {
  var a=Math.min(x0,x1),b=Math.max(x0,x1),c=Math.min(y0,y1),d=Math.max(y0,y1);
  var span=Math.max(1,(b-a)+(d-c));
  for (var y=c;y<=d;y++) for (var x=a;x<=b;x++) {
    var t=((x-a)+(y-c))/span;
    this.set(x,y,BF.mix(this.color,this.secondary,t));
  }
};
PixelEditor.prototype.replace = function (x,y,col) {
  var from=this.at(x,y), t=this.tex;
  for (var i=0;i<t.data.length;i++) if (t.data[i]===from) t.data[i]=col;
};
PixelEditor.prototype.shift = function (dx,dy) {
  var t=this.tex, out=new Array(t.w*t.h).fill(null);
  for (var y=0;y<t.h;y++) for (var x=0;x<t.w;x++) {
    var nx=x+dx,ny=y+dy;
    if (nx>=0&&ny>=0&&nx<t.w&&ny<t.h) out[ny*t.w+nx]=t.data[y*t.w+x];
  }
  t.data=out;
};
PixelEditor.prototype.adjust = function (light, sat, hue) {
  var t=this.tex;
  for (var i=0;i<t.data.length;i++) {
    var c=t.data[i]; if (!c) continue;
    var hsl=BF.rgb2hsl(c);
    hsl[0]=((hsl[0]+hue)%1+1)%1;
    hsl[1]=Math.max(0,Math.min(1,hsl[1]*sat));
    hsl[2]=Math.max(0,Math.min(1,hsl[2]+light));
    t.data[i]=BF.hsl2rgb(hsl[0],hsl[1],hsl[2]);
  }
};
PixelEditor.prototype.noise = function (amount) {
  var t=this.tex;
  for (var i=0;i<t.data.length;i++) {
    var c=t.data[i]; if (!c) continue;
    t.data[i]=BF.shade(c, 1+(Math.random()-0.5)*amount);
  }
};
PixelEditor.prototype.checker = function () {
  var t=this.tex;
  for (var y=0;y<t.h;y++) for (var x=0;x<t.w;x++) {
    this.set(x,y,(Math.floor(x/2)+Math.floor(y/2))%2 ? this.secondary : this.color);
  }
};
PixelEditor.prototype.invert = function () {
  var t=this.tex;
  for (var i=0;i<t.data.length;i++) {
    var c=t.data[i]; if (!c) continue;
    var r=BF.hex2rgb(c);
    t.data[i]='#'+r.map(function(v){ return ('0'+(255-v).toString(16)).slice(-2); }).join('');
  }
};
PixelEditor.prototype.mirror = function (vertical) {
  this.pushHistory();
  var t=this.tex;
  if (!vertical) {
    for (var y=0;y<t.h;y++) for (var x=0;x<Math.floor(t.w/2);x++) {
      var a=y*t.w+x,b=y*t.w+(t.w-1-x),tmp=t.data[a]; t.data[a]=t.data[b]; t.data[b]=tmp;
    }
  } else {
    for (var x2=0;x2<t.w;x2++) for (var y2=0;y2<Math.floor(t.h/2);y2++) {
      var a2=y2*t.w+x2,b2=(t.h-1-y2)*t.w+x2,tmp2=t.data[a2]; t.data[a2]=t.data[b2]; t.data[b2]=tmp2;
    }
  }
  this.render(); this.onChange();
};
PixelEditor.prototype.rotate = function () {
  this.pushHistory();
  var t=this.tex,out=new Array(t.w*t.h).fill(null);
  for (var y=0;y<t.h;y++) for (var x=0;x<t.w;x++) out[x*t.w+(t.h-1-y)]=t.data[y*t.w+x];
  t.data=out; this.render(); this.onChange();
};
PixelEditor.prototype.clear = function () {
  this.pushHistory();
  this.tex.data=new Array(this.tex.w*this.tex.h).fill(null);
  this.render(); this.onChange();
};
PixelEditor.prototype.resize = function (size) {
  this.pushHistory();
  var nt=BF.resizeTex(this.tex,size);
  this.tex.w=nt.w; this.tex.h=nt.h; this.tex.data=nt.data;
  this.fit(); this.render(); this.onChange();
};
PixelEditor.prototype.pick = function (p, secondary) {
  var c=this.at(p.x,p.y); if (!c) return;
  if (secondary) { this.secondary=c; if (this.onPickSecondary) this.onPickSecondary(c); }
  else { this.color=c; if (this.onPickColor) this.onPickColor(c); }
};
PixelEditor.prototype.action = function (name, arg) {
  switch (name) {
    case 'mirror': this.mirror(false); return;
    case 'flipV': this.mirror(true); return;
    case 'clear': this.clear(); return;
    case 'rotate': this.rotate(); return;
  }
  this.pushHistory();
  if (name==='shift') this.shift(arg[0],arg[1]);
  else if (name==='adjust') this.adjust(arg[0],arg[1],arg[2]||0);
  else if (name==='noise') this.noise(arg||0.2);
  else if (name==='checker') this.checker();
  else if (name==='invert') this.invert();
  this.render(); this.onChange();
};
PixelEditor.prototype._bind = function () {
  var self=this;
  this.canvas.addEventListener('pointerdown', function (ev) {
    if (!self.tex) return;
    ev.preventDefault();
    try { self.canvas.setPointerCapture(ev.pointerId); } catch (e) {}
    var p=self.px(ev);
    if (self.tool==='picker') { self.pick(p, ev.button===2); return; }
    var col=(ev.button===2) ? self.secondary : self.color;
    if (self.tool==='eraser') col=null;
    if (['fill','replace'].indexOf(self.tool)>=0) {
      self.pushHistory();
      if (self.tool==='fill') self.fill(p.x,p.y,col); else self.replace(p.x,p.y,col);
      self.render(); self.onChange(); return;
    }
    self.pushHistory(); self.snapshotNow();
    var mode=self.tool;
    if (['pencil','eraser','spray','darken','lighten'].indexOf(mode)>=0) {
      self.drag={ type:'free', mode:mode, last:p, col:col };
      self.plot(p.x,p.y,col,mode); self.render();
    } else {
      self.drag={ type:'shape', mode:mode, start:p, col:col };
    }
  });
  this.canvas.addEventListener('pointermove', function (ev) {
    if (!self.drag||!self.tex) return;
    var p=self.px(ev),d=self.drag;
    if (d.type==='free') {
      self.line(d.last.x,d.last.y,p.x,p.y,d.col,d.mode);
      d.last=p; self.render();
    } else {
      self.restoreSnapshot();
      if (d.mode==='line') self.line(d.start.x,d.start.y,p.x,p.y,d.col,d.mode);
      else if (d.mode==='rect'||d.mode==='fillrect') self.rect(d.start.x,d.start.y,p.x,p.y,d.col,d.mode,d.mode==='fillrect');
      else if (d.mode==='ellipse') self.ellipse(d.start.x,d.start.y,p.x,p.y,d.col,d.mode);
      else if (d.mode==='gradient') self.gradient(d.start.x,d.start.y,p.x,p.y);
      self.render();
    }
  });
  var finish=function () {
    if (self.drag) { self.drag=null; self.snapshot=null; self.onChange(); }
  };
  this.canvas.addEventListener('pointerup',finish);
  this.canvas.addEventListener('pointercancel',finish);
  this.canvas.addEventListener('pointerleave',finish);
  this.canvas.addEventListener('contextmenu',function (ev) {
    ev.preventDefault();
    if (self.tex) self.pick(self.px(ev),true);
  });
};
PixelEditor.prototype.importImage = function (file, cb) {
  var self=this;
  var reader=new FileReader();
  reader.onload=function () {
    var img=new Image();
    img.onload=function () {
      var c=document.createElement('canvas');
      c.width=self.tex.w; c.height=self.tex.h;
      var cx=c.getContext('2d');
      cx.imageSmoothingEnabled=false;
      cx.drawImage(img,0,0,c.width,c.height);
      var d=cx.getImageData(0,0,c.width,c.height).data;
      self.pushHistory();
      for (var i=0;i<c.width*c.height;i++) {
        self.tex.data[i]=d[i*4+3]<128 ? null :
          '#'+[d[i*4],d[i*4+1],d[i*4+2]].map(function(v){ return ('0'+v.toString(16)).slice(-2); }).join('');
      }
      self.render(); self.onChange(); if (cb) cb();
    };
    img.src=reader.result;
  };
  reader.readAsDataURL(file);
};
PixelEditor.prototype.exportPNG = function (filename) {
  var c=document.createElement('canvas');
  c.width=this.tex.w; c.height=this.tex.h;
  var ctx=c.getContext('2d'),img=ctx.createImageData(c.width,c.height);
  for (var i=0;i<c.width*c.height;i++) {
    var h=this.tex.data[i];
    if (h) { var rgb=BF.hex2rgb(h);
      img.data[i*4]=rgb[0]; img.data[i*4+1]=rgb[1]; img.data[i*4+2]=rgb[2]; img.data[i*4+3]=255; }
  }
  ctx.putImageData(img,0,0);
  c.toBlob(function (blob) { BF.saveFile(blob,filename||'texture.png'); },'image/png');
};
BF.PixelEditor = PixelEditor;
})(typeof window !== 'undefined' ? window : globalThis);
