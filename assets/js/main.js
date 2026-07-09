(function(){
  var burger = document.getElementById('hamburger');
  var mmenu = document.getElementById('mobileMenu');
  if (burger && mmenu){
    burger.addEventListener('click', function(){
      var open = mmenu.classList.toggle('open');
      burger.classList.toggle('active', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){ entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold:.12, rootMargin:'0px 0px -60px 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in'); });
  }

  var track = document.getElementById('testiTrack');
  if (track){
    var cards = track.children;
    var prev = document.getElementById('testiPrev');
    var next = document.getElementById('testiNext');
    var index = 0;
    function perView(){
      var w = window.innerWidth;
      if (w <= 620) return 1;
      if (w <= 900) return 2;
      return 3;
    }
    function update(){
      var pv = perView();
      var max = Math.max(0, cards.length - pv);
      if (index > max) index = max;
      var cardWidth = cards[0].getBoundingClientRect().width;
      var gap = 20;
      track.style.transform = 'translateX(-' + (index * (cardWidth + gap)) + 'px)';
    }
    if (next) next.addEventListener('click', function(){
      var pv = perView();
      var max = Math.max(0, cards.length - pv);
      index = Math.min(index + 1, max);
      update();
    });
    if (prev) prev.addEventListener('click', function(){
      index = Math.max(index - 1, 0);
      update();
    });
    window.addEventListener('resize', update);
    update();
  }

  var slider = document.getElementById('heroSlider');
  if (slider){
    var slides = slider.querySelectorAll('.hero-slide');
    var dots = slider.querySelectorAll('.hero-dot');
    var current = 0;
    var timer;
    function go(n){
      slides[current].classList.remove('is-active');
      dots[current] && dots[current].classList.remove('is-active');
      var vid = slides[current].querySelector('video');
      if (vid) vid.pause();
      current = (n + slides.length) % slides.length;
      slides[current].classList.add('is-active');
      dots[current] && dots[current].classList.add('is-active');
      var newVid = slides[current].querySelector('video');
      if (newVid){ newVid.currentTime = 0; newVid.play().catch(function(){}); }
    }
    function next(){ go(current + 1); }
    function restart(){
      clearInterval(timer);
      if (!reduceMotion) timer = setInterval(next, 6500);
    }
    dots.forEach(function(dot, i){
      dot.addEventListener('click', function(){ go(i); restart(); });
    });
    restart();
  }
})();
