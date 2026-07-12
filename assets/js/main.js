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

  /* ---------- rotating earth globe (Our Presence, Home) ---------- */
  var EARTH_CITIES = [
    { name: 'Delhi',     region: 'North',   lng: 77.21, lat: 28.61 },
    { name: 'Jaipur',    region: 'North',   lng: 75.79, lat: 26.91 },
    { name: 'Ahmedabad', region: 'West',    lng: 72.57, lat: 23.02 },
    { name: 'Mumbai',    region: 'West',    lng: 72.88, lat: 19.08 },
    { name: 'Hyderabad', region: 'South',   lng: 78.49, lat: 17.39 },
    { name: 'Bengaluru', region: 'South',   lng: 77.59, lat: 12.97 },
    { name: 'Chennai',   region: 'South',   lng: 80.27, lat: 13.08 },
    { name: 'Kolkata',   region: 'East',    lng: 88.36, lat: 22.57 },
    { name: 'Raipur',    region: 'East',    lng: 81.63, lat: 21.25 },
    { name: 'Kashipur',  region: 'Special', lng: 78.96, lat: 29.21 }
  ];
  var EARTH_REGIONS = {
    all:     { lng: 80,   lat: 22,   zoom: 1.15 },
    North:   { lng: 76.5, lat: 28,   zoom: 2.1 },
    West:    { lng: 73,   lat: 20.5, zoom: 2.1 },
    South:   { lng: 78.5, lat: 14,   zoom: 2.1 },
    East:    { lng: 85,   lat: 22.5, zoom: 2.1 },
    Special: { lng: 79,   lat: 29,   zoom: 2.3 }
  };

  var earthApi = null;
  var earthCanvas = document.getElementById('earthCanvas');
  if (earthCanvas && earthCanvas.getContext){
    earthApi = (function(canvas){
      var ctx = canvas.getContext('2d');
      var DEG = Math.PI / 180;
      var view = { lng: 80, lat: 22, zoom: 1.15 };
      var activeRegion = 'all';
      var autoRotate = !reduceMotion;
      var anim = null;
      var dragging = false;
      var landRings = [];
      var landDots = [];
      var W = 0, H = 0, R = 0;

      function resize(){
        var box = canvas.parentElement.getBoundingClientRect();
        W = Math.min(640, Math.max(300, box.width));
        H = Math.min(500, Math.max(340, W * 0.82));
        var dpr = window.devicePixelRatio || 1;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        R = Math.min(W, H) / 2.5;
      }

      /* orthographic projection centered on view.lng / view.lat.
         returns [x, y, cosc] — cosc > 0 means the point faces the viewer */
      function project(lng, lat){
        var l = (lng - view.lng) * DEG;
        var p = lat * DEG;
        var pc = view.lat * DEG;
        var cosc = Math.sin(pc) * Math.sin(p) + Math.cos(pc) * Math.cos(p) * Math.cos(l);
        var r = R * view.zoom;
        var x = r * Math.cos(p) * Math.sin(l);
        var y = r * (Math.cos(pc) * Math.sin(p) - Math.sin(pc) * Math.cos(p) * Math.cos(l));
        return [W / 2 + x, H / 2 - y, cosc];
      }

      /* stroke a lat/lng polyline, skipping segments on the far side */
      function strokeLine(points, closed){
        ctx.beginPath();
        var prevVisible = false;
        var n = points.length + (closed ? 1 : 0);
        for (var i = 0; i < n; i++){
          var pt = points[i % points.length];
          var pr = project(pt[0], pt[1]);
          if (pr[2] > 0){
            if (prevVisible) ctx.lineTo(pr[0], pr[1]);
            else ctx.moveTo(pr[0], pr[1]);
            prevVisible = true;
          } else {
            prevVisible = false;
          }
        }
        ctx.stroke();
      }

      var graticule = [];
      (function(){
        var lng, lat, line;
        for (lng = -180; lng < 180; lng += 20){
          line = [];
          for (lat = -80; lat <= 80; lat += 4) line.push([lng, lat]);
          graticule.push(line);
        }
        for (lat = -80; lat <= 80; lat += 20){
          line = [];
          for (lng = -180; lng <= 180; lng += 4) line.push([lng, lat]);
          graticule.push(line);
        }
      })();

      function pointInRing(x, y, ring){
        var inside = false;
        for (var i = 0, j = ring.length - 1; i < ring.length; j = i++){
          var xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
          if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
        }
        return inside;
      }

      function buildDots(poly){
        var outer = poly[0];
        var minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
        for (var k = 0; k < outer.length; k++){
          if (outer[k][0] < minLng) minLng = outer[k][0];
          if (outer[k][0] > maxLng) maxLng = outer[k][0];
          if (outer[k][1] < minLat) minLat = outer[k][1];
          if (outer[k][1] > maxLat) maxLat = outer[k][1];
        }
        var step = 1.4;
        for (var lng = Math.ceil(minLng / step) * step; lng <= maxLng; lng += step){
          for (var lat = Math.ceil(minLat / step) * step; lat <= maxLat; lat += step){
            if (!pointInRing(lng, lat, outer)) continue;
            var inHole = false;
            for (var h = 1; h < poly.length; h++){
              if (pointInRing(lng, lat, poly[h])){ inHole = true; break; }
            }
            if (!inHole) landDots.push([lng, lat]);
          }
        }
      }

      fetch('https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json')
        .then(function(r){ if (!r.ok) throw new Error('land data'); return r.json(); })
        .then(function(geo){
          geo.features.forEach(function(f){
            var polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
            polys.forEach(function(poly){
              poly.forEach(function(ring){ landRings.push(ring); });
              buildDots(poly);
            });
          });
        })
        .catch(function(){ /* sphere, graticule, and city markers still render */ });

      function render(now){
        ctx.clearRect(0, 0, W, H);
        var r = R * view.zoom;

        ctx.beginPath();
        ctx.arc(W / 2, H / 2, r, 0, 2 * Math.PI);
        ctx.fillStyle = '#132539';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(143,216,255,.45)';
        ctx.stroke();

        ctx.save();
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, r, 0, 2 * Math.PI);
        ctx.clip();

        ctx.strokeStyle = 'rgba(255,255,255,.14)';
        ctx.lineWidth = 1;
        for (var g = 0; g < graticule.length; g++) strokeLine(graticule[g], false);

        ctx.strokeStyle = 'rgba(255,255,255,.65)';
        ctx.lineWidth = 1;
        for (var lr = 0; lr < landRings.length; lr++) strokeLine(landRings[lr], true);

        ctx.fillStyle = 'rgba(143,216,255,.48)';
        for (var d = 0; d < landDots.length; d++){
          var pd = project(landDots[d][0], landDots[d][1]);
          if (pd[2] > 0.02){
            ctx.beginPath();
            ctx.arc(pd[0], pd[1], Math.min(2.4, 1.1 * view.zoom), 0, 2 * Math.PI);
            ctx.fill();
          }
        }

        for (var c = 0; c < EARTH_CITIES.length; c++){
          var city = EARTH_CITIES[c];
          var pc = project(city.lng, city.lat);
          if (pc[2] <= 0) continue;
          var active = activeRegion === 'all' || city.region === activeRegion;
          var pulse = reduceMotion ? 0 : Math.sin(now / 420 + c) * 1.1;
          ctx.beginPath();
          ctx.arc(pc[0], pc[1], (active ? 7 : 4) + pulse, 0, 2 * Math.PI);
          ctx.fillStyle = active ? 'rgba(143,216,255,.25)' : 'rgba(143,216,255,.1)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(pc[0], pc[1], active ? 3 : 2, 0, 2 * Math.PI);
          ctx.fillStyle = active ? '#8FD8FF' : 'rgba(143,216,255,.5)';
          ctx.fill();
          if (active && view.zoom >= 1.5){
            ctx.font = '600 11px Inter, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,.92)';
            ctx.fillText(city.name, pc[0] + 9, pc[1] + 4);
          }
        }
        ctx.restore();
      }

      function frame(now){
        if (anim){
          var k = Math.min(1, (now - anim.t0) / anim.dur);
          var e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
          view.lng = anim.from.lng + anim.dLng * e;
          view.lat = anim.from.lat + (anim.to.lat - anim.from.lat) * e;
          view.zoom = anim.from.zoom + (anim.to.zoom - anim.from.zoom) * e;
          if (k >= 1){
            if (anim.thenAutoRotate) autoRotate = true;
            anim = null;
          }
        } else if (autoRotate && !dragging){
          view.lng += 0.12;
        }
        render(now);
        requestAnimationFrame(frame);
      }

      function focusRegion(region){
        var target = EARTH_REGIONS[region] || EARTH_REGIONS.all;
        activeRegion = region;
        autoRotate = false;
        anim = {
          t0: performance.now(),
          dur: reduceMotion ? 1 : 950,
          from: { lng: view.lng, lat: view.lat, zoom: view.zoom },
          to: target,
          dLng: ((target.lng - view.lng) % 360 + 540) % 360 - 180,
          thenAutoRotate: region === 'all' && !reduceMotion
        };
      }

      canvas.addEventListener('pointerdown', function(e){
        dragging = true;
        anim = null;
        autoRotate = false;
        canvas.setPointerCapture(e.pointerId);
        var sx = e.clientX, sy = e.clientY;
        var start = { lng: view.lng, lat: view.lat };
        function move(ev){
          var sens = 0.35 / view.zoom;
          view.lng = start.lng - (ev.clientX - sx) * sens;
          view.lat = Math.max(-85, Math.min(85, start.lat + (ev.clientY - sy) * sens));
        }
        function up(){
          canvas.removeEventListener('pointermove', move);
          canvas.removeEventListener('pointerup', up);
          canvas.removeEventListener('pointercancel', up);
          dragging = false;
          if (activeRegion === 'all' && !reduceMotion) autoRotate = true;
        }
        canvas.addEventListener('pointermove', move);
        canvas.addEventListener('pointerup', up);
        canvas.addEventListener('pointercancel', up);
      });

      canvas.addEventListener('wheel', function(e){
        e.preventDefault();
        view.zoom = Math.max(.7, Math.min(3, view.zoom * (e.deltaY > 0 ? .9 : 1.1)));
      }, { passive: false });

      resize();
      window.addEventListener('resize', resize);
      requestAnimationFrame(frame);

      return { focusRegion: focusRegion };
    })(earthCanvas);
  }

  var presenceTabs = document.querySelectorAll('.presence-tab');
  if (presenceTabs.length){
    var pins = document.querySelectorAll('.network-pin');
    var cityList = document.getElementById('presenceCityList');
    var allCities = {};
    if (pins.length){
      pins.forEach(function(pin){
        var region = pin.getAttribute('data-region');
        var city = pin.querySelector('span') ? pin.querySelector('span').textContent : '';
        if (!allCities[region]) allCities[region] = [];
        allCities[region].push(city);
      });
    } else {
      EARTH_CITIES.forEach(function(c){
        if (!allCities[c.region]) allCities[c.region] = [];
        allCities[c.region].push(c.name);
      });
    }
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
        if (earthApi) earthApi.focusRegion(region);
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

  var masonry = document.getElementById('industriesMasonry');
  if (masonry){
    var mItems = Array.prototype.slice.call(masonry.querySelectorAll('.m-item'));

    function masonryColumns(){
      if (window.matchMedia('(min-width:1400px)').matches) return 4;
      if (window.matchMedia('(min-width:1000px)').matches) return 3;
      if (window.matchMedia('(min-width:600px)').matches) return 2;
      return 1;
    }

    function layoutMasonry(){
      var width = masonry.clientWidth;
      if (!width) return;
      var cols = masonryColumns();
      var colHeights = [];
      for (var c = 0; c < cols; c++) colHeights.push(0);
      var colWidth = width / cols;
      mItems.forEach(function(item){
        var col = colHeights.indexOf(Math.min.apply(null, colHeights));
        var h = parseInt(item.getAttribute('data-h'), 10) || 320;
        item.style.width = colWidth + 'px';
        item.style.height = h + 'px';
        item.style.transform = 'translate(' + (colWidth * col) + 'px,' + colHeights[col] + 'px)';
        colHeights[col] += h;
      });
      masonry.style.height = Math.max.apply(null, colHeights) + 'px';
    }

    mItems.forEach(function(item, i){
      item.querySelector('.m-entrance').style.transitionDelay = (i * 0.06) + 's';
    });

    layoutMasonry();
    requestAnimationFrame(function(){ masonry.classList.add('layout-ready'); });

    var mRaf;
    window.addEventListener('resize', function(){
      cancelAnimationFrame(mRaf);
      mRaf = requestAnimationFrame(layoutMasonry);
    });

    if (reduceMotion || !('IntersectionObserver' in window)){
      masonry.classList.add('in-view');
    } else {
      var mObserver = new IntersectionObserver(function(entries){
        if (entries[0].isIntersecting){
          masonry.classList.add('in-view');
          mObserver.disconnect();
        }
      }, { threshold: 0.12 });
      mObserver.observe(masonry);
    }
  }
})();
