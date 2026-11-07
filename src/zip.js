/* ============================================================
   BlockForge Studio — zero-dependency ZIP writer (store method)
   ============================================================ */
(function (root) {
'use strict';
var BF = root.BF = root.BF || {};

var CRC_TABLE = (function () {
  var t = new Uint32Array(256);
  for (var n=0;n<256;n++) {
    var c = n;
    for (var k=0;k<8;k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  var c = 0xFFFFFFFF;
  for (var i=0;i<buf.length;i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function strBytes(s) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s);
  return new Uint8Array(Buffer.from(s, 'utf8'));
}
function b64Bytes(b64) {
  if (typeof atob === 'function') {
    var s = atob(b64), u = new Uint8Array(s.length);
    for (var i=0;i<s.length;i++) u[i] = s.charCodeAt(i);
    return u;
  }
  return new Uint8Array(Buffer.from(b64, 'base64'));
}
function dosStamp() {
  var d = new Date();
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
  };
}
BF.zipFiles = function (files) {
  var stamp = dosStamp(), chunks = [], central = [], offset = 0;
  files.forEach(function (f) {
    var name = strBytes(f.path);
    var data = f.binary ? b64Bytes(f.content) : strBytes(f.content);
    var crc = crc32(data);
    var lh = new Uint8Array(30 + name.length), lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true);  /* bit 11: UTF-8 encoded file name (Chinese tutorial etc.) */
    lv.setUint16(8, 0, true);
    lv.setUint16(10, stamp.time, true); lv.setUint16(12, stamp.date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true);
    lv.setUint16(26, name.length, true); lv.setUint16(28, 0, true);
    lh.set(name, 30);
    chunks.push(lh, data);

    var ch = new Uint8Array(46 + name.length), cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true); cv.setUint16(10, 0, true);
    cv.setUint16(12, stamp.time, true); cv.setUint16(14, stamp.date, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint16(30, 0, true); cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true); cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    ch.set(name, 46);
    central.push(ch);
    offset += lh.length + data.length;
  });
  var cdSize = 0; central.forEach(function (c) { cdSize += c.length; });
  var end = new Uint8Array(22), ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);
  var all = chunks.concat(central, [end]);
  if (typeof Blob !== 'undefined' && typeof window !== 'undefined') {
    return new Blob(all, { type:'application/zip' });
  }
  return Buffer.concat(all.map(function (u) { return Buffer.from(u); }));
};
BF.crc32 = crc32;
BF.strBytes = strBytes;
})(typeof window !== 'undefined' ? window : globalThis);
