// Two-team Game of Life behind the hero: B3/S23, a newborn cell takes its parents' majority color.
// Each seed pits two random team colors (data-colors on the canvas) against each other, faded toward gray.
(function () {
  var canvas = document.getElementById('life');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var CELL = 10, TICK_MS = 110, RESEED_GENS = 600;
  var PALETTE = (canvas.getAttribute('data-colors') || '').split(/\s+/).filter(function (c) {
    return /^#[0-9a-f]{6}$/i.test(c);
  });
  if (PALETTE.length < 2) PALETTE = ['#e6e6e6', '#76d6ff'];
  var FADE_TO = 230, FADE = 0.5, ALPHA = 0.55;
  var COLORS = [null, null, null];

  function faded(hex) {
    var rgb = [1, 3, 5].map(function (i) {
      return Math.round(parseInt(hex.substr(i, 2), 16) * (1 - FADE) + FADE_TO * FADE);
    });
    return 'rgba(' + rgb.join(', ') + ', ' + ALPHA + ')';
  }

  function pickTeams() {
    var a = Math.floor(Math.random() * PALETTE.length);
    var b = (a + 1 + Math.floor(Math.random() * (PALETTE.length - 1))) % PALETTE.length;
    COLORS[1] = faded(PALETTE[a]);
    COLORS[2] = faded(PALETTE[b]);
  }
  var cols, rows, grid, next, gen, timer;
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function seed() {
    gen = 0;
    pickTeams();
    for (var i = 0; i < grid.length; i++) {
      grid[i] = Math.random() < 0.28 ? (Math.random() < 0.5 ? 1 : 2) : 0;
    }
  }

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / CELL);
    rows = Math.ceil(h / CELL);
    grid = new Uint8Array(cols * rows);
    next = new Uint8Array(cols * rows);
    seed();
    draw();
  }

  function step() {
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var n = 0, ones = 0;
        for (var dy = -1; dy <= 1; dy++) {
          var yy = (y + dy + rows) % rows;
          for (var dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            var v = grid[yy * cols + (x + dx + cols) % cols];
            if (v) { n++; if (v === 1) ones++; }
          }
        }
        var i = y * cols + x, c = grid[i];
        if (c) next[i] = (n === 2 || n === 3) ? c : 0;
        else next[i] = n === 3 ? (ones >= 2 ? 1 : 2) : 0;
      }
    }
    var t = grid; grid = next; next = t;
    if (++gen > RESEED_GENS) seed();
  }

  function draw() {
    ctx.clearRect(0, 0, cols * CELL, rows * CELL);
    for (var team = 1; team <= 2; team++) {
      ctx.fillStyle = COLORS[team];
      for (var i = 0; i < grid.length; i++) {
        if (grid[i] === team) ctx.fillRect((i % cols) * CELL + 1, Math.floor(i / cols) * CELL + 1, CELL - 2, CELL - 2);
      }
    }
  }

  function run() {
    clearInterval(timer);
    if (still || document.hidden) return;
    timer = setInterval(function () { step(); draw(); }, TICK_MS);
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });
  document.addEventListener('visibilitychange', run);

  resize();
  if (still) { for (var k = 0; k < 40; k++) step(); draw(); }
  run();
}());
