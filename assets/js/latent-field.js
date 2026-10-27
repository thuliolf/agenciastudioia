/* Campo latente: camada WebGL sobre o vídeo do hero.
   Na abertura, cobre a tela com ruído em mapa de calor (inferno) que vai de blocos grossos
   a grão fino e se dissolve, revelando o vídeo, como um modelo de difusão removendo ruído.
   Depois disso, o cursor (ou o dedo) deixa um rastro de calor que esfria sozinho. */
(function () {
  'use strict';

  var TRAIL = 16;

  var VERT = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';

  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec2 uRes;',
    'uniform float uTime;',
    'uniform float uProg;',
    'uniform float uDpr;',
    'uniform vec3 uTrail[' + TRAIL + '];',

    'float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }',
    'float vnoise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }',
    'float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++){ v += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return v; }',

    // Aproximação polinomial do mapa "inferno" (Matt Zucker, CC0).
    'vec3 inferno(float t){',
    '  t = clamp(t, 0.0, 1.0);',
    '  const vec3 c0 = vec3(0.0002189403691192265, 0.001651004631001012, -0.01948089843709184);',
    '  const vec3 c1 = vec3(0.1065134194856116, 0.5639564367884091, 3.932712388889277);',
    '  const vec3 c2 = vec3(11.60249308247187, -3.972853965665698, -15.9423941062914);',
    '  const vec3 c3 = vec3(-41.70399613139459, 17.43639888205313, 44.35414519872813);',
    '  const vec3 c4 = vec3(77.162935699427, -33.40235894210092, -81.80730925738993);',
    '  const vec3 c5 = vec3(-71.31942824499214, 32.62606426397723, 73.20951985803202);',
    '  const vec3 c6 = vec3(25.13112622477341, -12.24266895238567, -23.07032500287172);',
    '  return c0 + t * (c1 + t * (c2 + t * (c3 + t * (c4 + t * (c5 + t * c6)))));',
    '}',

    'void main(){',
    '  vec2 px = gl_FragCoord.xy;',
    '  float s = uRes.y;',

    // Abertura: blocos grossos (espaço latente) que afinam e depois se dissolvem.
    '  float pe = pow(clamp(uProg, 0.0, 1.0), 0.7);',
    '  float bs = mix(56.0, 1.5, pe) * uDpr;',
    '  vec2 cell = floor(px / bs);',
    '  vec2 q = (cell + 0.5) * bs / s;',
    '  float stat = hash(cell + floor(uTime * 12.0));',
    '  float field = fbm(q * 3.0 + vec2(0.0, uTime * 0.12));',
    '  float n = mix(stat, field, smoothstep(0.0, 0.55, uProg));',
    '  float reveal = fbm(q * 2.2 + 7.3);',
    '  float th = uProg * 1.3 - 0.15;',
    '  float aIntro = smoothstep(th - 0.07, th + 0.03, reveal);',
    '  vec3 cIntro = inferno(0.12 + 0.85 * n * (0.75 + 0.25 * uProg));',

    // Rastro de calor do cursor, em blocos de 10px.
    '  float bs2 = 10.0 * uDpr;',
    '  vec2 c2 = (floor(px / bs2) + 0.5) * bs2;',
    '  float heat = 0.0;',
    '  float rr = 140.0 * uDpr; rr *= rr;',
    '  for (int i = 0; i < ' + TRAIL + '; i++){ vec3 t = uTrail[i]; vec2 d = c2 - t.xy; heat += t.z * exp(-dot(d, d) / rr); }',
    '  float n2 = fbm(c2 / s * 5.0 + vec2(uTime * 0.25, 0.0));',
    '  float h = heat * (0.45 + 0.75 * n2);',
    '  float aTrail = smoothstep(0.18, 0.75, h);',
    '  vec3 cTrail = inferno(0.25 + h * 0.6);',

    '  float a = max(aIntro, aTrail);',
    '  vec3 col = aIntro >= aTrail ? cIntro : cTrail;',
    '  gl_FragColor = vec4(col * a, a);',
    '}'
  ].join('\n');

  function shader(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('Latente: shader não compilou', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {HTMLElement} area elemento que recebe o movimento do ponteiro
   * @param {{interactive?: boolean}} opts
   */
  function create(canvas, area, opts) {
    opts = opts || {};
    var gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance' });
    if (!gl) return null;

    var vs = shader(gl, gl.VERTEX_SHADER, VERT);
    var fs = shader(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(prog, 'uRes');
    var uTime = gl.getUniformLocation(prog, 'uTime');
    var uProg = gl.getUniformLocation(prog, 'uProg');
    var uDpr = gl.getUniformLocation(prog, 'uDpr');
    var uTrail = gl.getUniformLocation(prog, 'uTrail');

    var trail = new Float32Array(TRAIL * 3);
    var head = 0;
    var progress = 0;
    var visible = true;
    var raf = 0;
    var lost = false;
    var t0 = performance.now();
    var last = t0;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    function resize() {
      var r = canvas.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width * dpr));
      var h = Math.max(1, Math.round(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    function frame(now) {
      raf = 0;
      if (lost) return;
      var dt = Math.min(64, now - last);
      last = now;

      var k = Math.pow(0.9, dt / 16.7);
      var alive = false;
      for (var i = 0; i < TRAIL; i++) {
        var z = trail[i * 3 + 2] * k;
        trail[i * 3 + 2] = z < 0.01 ? 0 : z;
        if (z >= 0.01) alive = true;
      }

      resize();
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (now - t0) / 1000);
      gl.uniform1f(uProg, progress);
      gl.uniform1f(uDpr, dpr);
      gl.uniform3fv(uTrail, trail);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Para de desenhar quando não há nada acontecendo: economiza bateria.
      if (visible && (progress < 1 || alive)) raf = requestAnimationFrame(frame);
    }

    function wake() {
      if (!raf && visible && !lost) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    }

    function addPoint(clientX, clientY) {
      var r = canvas.getBoundingClientRect();
      if (clientY < r.top || clientY > r.bottom) return;
      var x = (clientX - r.left) * dpr;
      var y = (r.bottom - clientY) * dpr;
      var prev = (head - 1 + TRAIL) % TRAIL;
      var dx = x - trail[prev * 3];
      var dy = y - trail[prev * 3 + 1];
      if (dx * dx + dy * dy < Math.pow(14 * dpr, 2) && trail[prev * 3 + 2] > 0.5) return;
      trail[head * 3] = x;
      trail[head * 3 + 1] = y;
      trail[head * 3 + 2] = 1;
      head = (head + 1) % TRAIL;
      wake();
    }

    if (opts.interactive !== false) {
      area.addEventListener('pointermove', function (e) { addPoint(e.clientX, e.clientY); }, { passive: true });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) wake();
      }).observe(canvas);
    }

    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); lost = true; });
    window.addEventListener('resize', wake, { passive: true });

    wake();

    return {
      setProgress: function (p) { progress = Math.max(0, Math.min(1, p)); wake(); }
    };
  }

  window.LatentField = { create: create };
})();
