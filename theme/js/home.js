// Two-team Game of Life behind the hero: B3/S23, a newborn cell takes its parents' majority color.
(function () {
  var canvas = document.getElementById('life');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var CELL = 10, TICK_MS = 110, RESEED_GENS = 600;
  var COLORS = [null, 'rgba(230, 230, 230, 0.55)', 'rgba(118, 214, 255, 0.6)'];
  var cols, rows, grid, next, gen, timer;
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function seed() {
    gen = 0;
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
