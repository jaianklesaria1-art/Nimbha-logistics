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

  document.querySelectorAll('.nav-dropdown').forEach(function(dd){
    var btn = dd.querySelector('button');
    if (!btn) return;
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var willOpen = !dd.classList.contains('open');
      document.querySelectorAll('.nav-dropdown.open').forEach(function(o){ o.classList.remove('open'); });
      if (willOpen) dd.classList.add('open');
    });
  });
  document.addEventListener('click', function(){
    document.querySelectorAll('.nav-dropdown.open').forEach(function(o){ o.classList.remove('open'); });
  });

  var presenceTabs = document.querySelectorAll('.presence-tab');
  if (presenceTabs.length){
    var pins = document.querySelectorAll('.network-pin');
    var cityList = document.getElementById('presenceCityList');
    var allCities = {};
    pins.forEach(function(pin){
      var region = pin.getAttribute('data-region');
      var city = pin.querySelector('span') ? pin.querySelector('span').textContent : '';
      if (!allCities[region]) allCities[region] = [];
      allCities[region].push(city);
    });
    function renderCities(region){
      if (!cityList) return;
      var cities = region === 'all' ? Object.keys(allCities).reduce(function(acc,k){ return acc.concat(allCities[k]); }, []) : (allCities[region] || []);
      cityList.innerHTML = cities.map(function(c){ return '<span class="city-chip">' + c + '</span>'; }).join('');
    }
    presenceTabs.forEach(function(tab){
      tab.addEventListener('click', function(){
        presenceTabs.forEach(function(t){ t.classList.remove('is-active'); });
        tab.classList.add('is-active');
        var region = tab.getAttribute('data-region');
        pins.forEach(function(pin){
          var pinRegion = pin.getAttribute('data-region');
          var match = region === 'all' || pinRegion === region;
          pin.classList.toggle('is-dim', !match);
          pin.classList.toggle('is-live', match && region !== 'all');
        });
        renderCities(region);
      });
    });
    renderCities('all');
  }

  var fleetModal = document.getElementById('fleetModal');
  if (fleetModal){
    var fmBody = document.getElementById('fleetModalBody');
    var fmClose = fleetModal.querySelector('.fm-close');
    var fmBackdrop = fleetModal.querySelector('.fm-backdrop');
    function openFleetModal(tplId){
      var tpl = document.getElementById(tplId);
      if (!tpl) return;
      fmBody.innerHTML = '';
      fmBody.appendChild(tpl.content.cloneNode(true));
      fleetModal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function closeFleetModal(){
      fleetModal.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    document.querySelectorAll('.fleet-vcard').forEach(function(card){
      card.addEventListener('click', function(){
        openFleetModal(card.getAttribute('data-target'));
      });
    });
    fmClose.addEventListener('click', closeFleetModal);
    fmBackdrop.addEventListener('click', closeFleetModal);
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') closeFleetModal();
    });
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
