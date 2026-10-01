/* (주)엘림글로벌 테마 스크립트 (의존성 없음) */
(function () {
	'use strict';

	var $ = function (sel, root) { return (root || document).querySelector(sel); };
	var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

	/* 모바일 메뉴 */
	var menuBtn = $('[data-menu-btn]');
	var gnb = $('[data-gnb]');
	if (menuBtn && gnb) {
		var menuLabel = $('[data-menu-label]', menuBtn);
		var setMenu = function (open) {
			gnb.classList.toggle('is-open', open);
			document.body.classList.toggle('menu-open', open);
			menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
			if (menuLabel) menuLabel.textContent = open ? '메뉴 닫기' : '메뉴 열기';
			if (open) {
				var first = $('a, button, input', gnb);
				if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 50);
			}
		};
		menuBtn.addEventListener('click', function () {
			setMenu(!gnb.classList.contains('is-open'));
		});
		// 전체 화면 메뉴: Esc 로 닫고, 메뉴 안 링크를 누르면 닫는다
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && gnb.classList.contains('is-open')) {
				setMenu(false);
				menuBtn.focus();
			}
		});
		gnb.addEventListener('click', function (e) {
			if (e.target.closest('a')) setMenu(false);
		});
		$$('.gnb__toggle', gnb).forEach(function (btn) {
			btn.addEventListener('click', function () {
				var li = btn.parentElement;
				var open = !li.classList.contains('is-open');
				li.classList.toggle('is-open', open);
				btn.setAttribute('aria-expanded', open ? 'true' : 'false');
			});
		});
	}

	/* 밝게/어둡게 전환: 기본은 기기 설정, 버튼을 누르면 선택을 저장해 고정 */
	var themeBtn = $('[data-theme-toggle]');
	if (themeBtn) {
		var root = document.documentElement;
		var mq = window.matchMedia('(prefers-color-scheme: dark)');
		var current = function () {
			return root.getAttribute('data-theme') || (mq.matches ? 'dark' : 'light');
		};
		var sync = function () {
			var dark = current() === 'dark';
			themeBtn.setAttribute('aria-pressed', dark ? 'true' : 'false');
			themeBtn.setAttribute('aria-label', dark ? '밝은 화면으로 전환' : '어두운 화면으로 전환');
			themeBtn.title = themeBtn.getAttribute('aria-label');
		};
		themeBtn.addEventListener('click', function () {
			var next = current() === 'dark' ? 'light' : 'dark';
			root.setAttribute('data-theme', next);
			try { localStorage.setItem('elim-theme', next); } catch (e) {}
			sync();
		});
		if (mq.addEventListener) mq.addEventListener('change', sync);
		sync();
	}

	/* 캡슐 헤더: 페이지 맨 위를 벗어나면 배경을 더 불투명하게
	   (스크롤 이벤트 대신 맨 위 40px 감시 요소가 화면에서 사라지는지를 본다) */
	var hd = $('[data-hd]');
	if (hd && (hd.classList.contains('hd--capsule') || hd.classList.contains('hd--g')) && 'IntersectionObserver' in window) {
		var sentinel = document.createElement('div');
		sentinel.setAttribute('aria-hidden', 'true');
		sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:40px;pointer-events:none;';
		document.body.prepend(sentinel);
		new IntersectionObserver(function (entries) {
			hd.classList.toggle('is-scrolled', !entries[0].isIntersecting);
		}).observe(sentinel);
	}

	/* 스크롤 나타나기: 화면에 들어오는 블록마다 아래에서 위로 떠오른다.
	   본문(main)과 푸터를 훑어, 화면 높이의 60%보다 큰 묶음은 안으로 들어가 더 작은 블록에 붙인다. */
	var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var SKIP = /^(SCRIPT|STYLE|TEMPLATE|LINK|META|BR|INPUT|SELECT|TEXTAREA|OPTION|SOURCE|TRACK)$/;
	// 붙인 블록 수를 돌려준다. 안으로 들어갔는데 붙일 것이 없으면(자식이 모두 절대 위치 등) 그 상자 자체에 붙인다.
	var tagBlocks = function (box) {
		var count = 0;
		var descend = function (el) {
			var n = tagBlocks(el);
			if (!n && el.getBoundingClientRect().height >= 1) { el.setAttribute('data-reveal', ''); n = 1; }
			count += n;
		};
		Array.prototype.forEach.call(box.children, function (el) {
			if (SKIP.test(el.tagName) || el.hasAttribute('data-no-reveal')) return;
			if (el.hasAttribute('data-reveal')) { count++; return; }
			var cs = getComputedStyle(el);
			if (cs.display === 'none' || cs.position === 'absolute' || cs.position === 'fixed' || cs.position === 'sticky') return;
			if (cs.display === 'contents' || el.querySelector('[data-reveal]')) { count += tagBlocks(el); return; }
			// 가로로 넘기는 상자(슬라이드)·겹친 카드는 안쪽 항목 위치를 따로 잡으므로 상자째 떠오르게
			if (/auto|scroll/.test(cs.overflowX) || el.hasAttribute('data-flow')) { el.setAttribute('data-reveal', ''); count++; return; }
			// 목록·격자(항목 3개 이상)는 항목마다 따로 떠오르게
			var items = el.children.length >= 3 && (/^(UL|OL)$/.test(el.tagName) || /grid|flex/.test(cs.display)) && el.closest('main');
			if (items && !/^(P|H[1-6]|A|BUTTON|LABEL)$/.test(el.tagName)) { descend(el); return; }
			// 구역(section)·폭 맞춤 상자(.wrap)·자식이 하나뿐인 상자는 안으로 들어간다
			if (el.children.length && (/^(SECTION|ARTICLE|ASIDE)$/.test(el.tagName) || el.classList.contains('wrap') || el.classList.contains('h-wrap') || el.children.length === 1) && !/^(A|P|H[1-6]|FIGURE|PICTURE|LABEL|BUTTON|LI)$/.test(el.tagName)) { descend(el); return; }
			var big = el.getBoundingClientRect().height > window.innerHeight * 0.6;
			if (big && el.children.length && !/^(IMG|PICTURE|VIDEO|IFRAME|svg|TABLE|FORM|P|H[1-6])$/.test(el.tagName)) { descend(el); return; }
			if (el.getBoundingClientRect().height < 1) return;
			el.setAttribute('data-reveal', '');
			count++;
		});
		return count;
	};

	var revealStarted = false;
	var startReveal = function () {
		if (revealStarted) return;
		revealStarted = true;
		if (reduced || !('IntersectionObserver' in window)) return;
		$$('main > *, .ft').forEach(function (sec) {
			// 히어로 슬라이드는 자체 전환이 있으므로 제외
			if (sec.hasAttribute('data-reveal') || sec.hasAttribute('data-hero')) return;
			tagBlocks(sec);
		});
		// 모든 사진: 사진마다 따로, 화면에 들어올 때마다 아래에서 위로 떠오른다 (히어로·아주 작은 아이콘 제외)
		$$('main img, .ft img').forEach(function (img) {
			if (img.closest('[data-hero]') || img.closest('[data-flow]') || img.closest('.ft__logo')) return;
			var w = img.getAttribute('width');
			if (w && +w < 48) return;
			img.setAttribute('data-reveal-img', '');
		});
		var reveals = $$('[data-reveal], [data-reveal-img]');
		if (!reveals.length) return;
		document.documentElement.classList.add('js-reveal');
		var show = function (el, i) {
			el.style.transitionDelay = Math.min(i * 0.1, 0.5) + 's';
			el.classList.remove('is-above');
			el.classList.add('is-in');
			// 나타난 뒤에는 늦춤을 지워 hover 등 다른 전환에 영향이 없게
			clearTimeout(el._revealT);
			el._revealT = setTimeout(function () { el.style.transitionDelay = ''; }, 2000);
		};
		// 화면을 벗어나면 다시 숨겨, 스크롤을 내릴 때는 아래에서·올릴 때는 위에서 다시 떠오른다
		var hide = function (el, above) {
			clearTimeout(el._revealT);
			el.style.transitionDelay = '';
			el.classList.remove('is-in');
			el.classList.toggle('is-above', above);
		};
		var rio = new IntersectionObserver(function (entries) {
			// 한꺼번에 들어온 블록은 스크롤 방향 순서대로 차례로 (최대 0.5초까지 늦춤)
			var shown = entries.filter(function (e) { return e.isIntersecting; });
			var up = shown.some(function (e) { return e.target.classList.contains('is-above'); });
			shown.sort(function (a, b) { return (a.boundingClientRect.top - b.boundingClientRect.top) * (up ? -1 : 1) || a.boundingClientRect.left - b.boundingClientRect.left; });
			shown.forEach(function (e, i) { show(e.target, i); });
			entries.forEach(function (e) {
				if (!e.isIntersecting && e.target.classList.contains('is-in')) hide(e.target, e.boundingClientRect.top < 0);
			});
		}, { rootMargin: '0px 0px -15% 0px' }); // 화면 아래 15% 선을 넘어야 시작 (보이는 자리에서 움직이게)
		// 페이지 맨 아래에 닿으면, 아래 여백 때문에 감시선에 못 미친 마지막 블록도 띄운다
		var atBottom = function () {
			if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 4) return;
			$$('[data-reveal]:not(.is-in), [data-reveal-img]:not(.is-in)').filter(function (el) {
				return el.getBoundingClientRect().top < window.innerHeight;
			}).forEach(show);
		};
		window.addEventListener('scroll', atBottom, { passive: true });
		// 클래스가 붙어 숨김 상태가 먼저 그려진 뒤 감시를 시작해야 전환이 보인다
		requestAnimationFrame(function () { requestAnimationFrame(function () {
			reveals.forEach(function (el) { rio.observe(el); });
		}); });
	};

	/* 스크롤에 맞춰 움직이는 효과 (스크롤 위치에 바로 따라붙는다)
	   - 히어로: 사진은 천천히 내려가고 문구는 위로 빠지며 흐려진다
	   - data-scrub 블록(영상·문의 카드 등): 화면 아래에서 올라오는 동안 살짝 작은 크기에서 제 크기로 */
	if (!reduced) {
		var heroBox = $('[data-hero]');
		var scrubs = [];
		['.h-video', '.h-cta__card'].forEach(function (sel) {
			$$(sel).forEach(function (el) { el.setAttribute('data-scrub', ''); scrubs.push(el); });
		});
		var ticking = false;
		var paint = function () {
			ticking = false;
			var vh = window.innerHeight;
			if (heroBox) {
				var hh = heroBox.offsetHeight || 1;
				var hp = Math.min(Math.max(window.scrollY / hh, 0), 1);
				heroBox.style.setProperty('--hp', hp.toFixed(4));
			}
			scrubs.forEach(function (el) {
				var r = el.getBoundingClientRect();
				if (r.bottom < 0 || r.top > vh) return;
				// 블록 윗변이 화면 맨 아래 → 화면 60% 높이까지 올라오는 동안 0 → 1
				var sp = Math.min(Math.max((vh - r.top) / (vh * 0.4), 0), 1);
				el.style.setProperty('--sp', sp.toFixed(4));
			});
		};
		var onScroll = function () {
			if (!ticking) { ticking = true; requestAnimationFrame(paint); }
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		paint();
	}

	/* 메인 히어로 슬라이드: 6초마다 자동으로 넘기고, 아래 막대로 고른다.
	   마우스를 올리거나 키보드 초점이 있으면 멈춘다. 움직임 줄이기 설정이면 자동 넘김 없음. */
	var hero = $('[data-hero]');
	var heroStart = function () {};
	if (hero) {
		var slideEls = $$('[data-slide-item]', hero);
		var bars = $$('[data-bar]', hero);
		var SLIDE_MS = 6000;
		var cur = 0, timer = null, paused = false;
		hero.style.setProperty('--h-slide-ms', SLIDE_MS + 'ms');
		document.documentElement.classList.add('js-hero');
		var goTo = function (n) {
			n = (n + slideEls.length) % slideEls.length;
			slideEls.forEach(function (el, i) {
				var on = i === n;
				el.classList.toggle('is-on', on);
				if (on) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', 'true');
				// 보이지 않는 슬라이드의 링크로 초점이 가지 않게
				$$('a, button', el).forEach(function (a) { if (on) a.removeAttribute('tabindex'); else a.setAttribute('tabindex', '-1'); });
			});
			bars.forEach(function (b, i) {
				b.classList.toggle('is-on', i === n);
				if (i === n) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
			});
			// 막대 채우기 애니메이션을 처음부터 다시
			var span = bars[n] && bars[n].firstElementChild;
			if (span) { span.style.animation = 'none'; void span.offsetWidth; span.style.animation = ''; }
			cur = n;
		};
		var schedule = function () {
			clearTimeout(timer);
			if (reduced || paused || slideEls.length < 2) return;
			timer = setTimeout(function () { goTo(cur + 1); schedule(); }, SLIDE_MS);
		};
		var pause = function (p) {
			paused = p;
			hero.classList.toggle('is-paused', p);
			if (p) clearTimeout(timer); else schedule();
		};
		bars.forEach(function (b) {
			b.addEventListener('click', function () { goTo(+b.getAttribute('data-bar')); schedule(); });
		});
		var prevBtn = $('[data-hero-prev]', hero);
		var nextBtn = $('[data-hero-next]', hero);
		if (prevBtn) prevBtn.addEventListener('click', function () { goTo(cur - 1); schedule(); });
		if (nextBtn) nextBtn.addEventListener('click', function () { goTo(cur + 1); schedule(); });
		// 키보드: 히어로 안에 초점이 있을 때 ← →
		hero.addEventListener('keydown', function (e) {
			if (e.key === 'ArrowLeft') { goTo(cur - 1); e.preventDefault(); }
			else if (e.key === 'ArrowRight') { goTo(cur + 1); e.preventDefault(); }
		});
		// 끌어서(마우스) 또는 밀어서(터치) 넘기기: 끄는 동안 지금 장이 손을 따라 살짝 움직이고,
		// 화면 폭의 8% 이상 끌었다 놓으면 다음/이전 장으로 넘어간다
		if (slideEls.length > 1) {
			var startX = 0, startY = 0, dx = 0, dragging = false, moved = false, axis = '';
			var active = function () { return slideEls[cur]; };
			hero.addEventListener('pointerdown', function (e) {
				if (e.button !== 0 || e.target.closest('.h-bars')) return;
				dragging = true; moved = false; axis = ''; dx = 0;
				startX = e.clientX; startY = e.clientY;
			});
			hero.addEventListener('pointermove', function (e) {
				if (!dragging) return;
				var mx = e.clientX - startX, my = e.clientY - startY;
				if (!axis && (Math.abs(mx) > 6 || Math.abs(my) > 6)) {
					axis = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
					if (axis === 'x') {
						try { hero.setPointerCapture(e.pointerId); } catch (err) {}
						hero.classList.add('is-dragging');
						clearTimeout(timer);
					}
				}
				if (axis !== 'x') return;
				moved = true;
				dx = mx;
				active().style.transform = 'translateX(' + (dx * 0.25) + 'px)';
				e.preventDefault();
			});
			var end = function () {
				if (!dragging) return;
				dragging = false;
				hero.classList.remove('is-dragging');
				active().style.transform = '';
				if (axis === 'x' && Math.abs(dx) > hero.clientWidth * 0.08) goTo(dx < 0 ? cur + 1 : cur - 1);
				if (axis === 'x') schedule();
			};
			hero.addEventListener('pointerup', end);
			hero.addEventListener('pointercancel', end);
			// 끌고 난 뒤 손을 떼며 링크·버튼이 눌리지 않게
			hero.addEventListener('click', function (e) {
				if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
			}, true);
			// 링크·이미지를 끌 때 브라우저 기본 끌기(드래그 앤 드롭) 막기
			hero.addEventListener('dragstart', function (e) { e.preventDefault(); });
		}
		hero.addEventListener('mouseenter', function () { pause(true); });
		hero.addEventListener('mouseleave', function () { pause(false); });
		hero.addEventListener('focusin', function () { pause(true); });
		hero.addEventListener('focusout', function (e) { if (!hero.contains(e.relatedTarget)) pause(false); });
		goTo(0);
		var heroStarted = false;
		heroStart = function () {
			if (heroStarted) return;
			heroStarted = true;
			hero.classList.add('is-ready');
			schedule();
		};
	}

	/* 인트로 (메인 첫 접속): 가운데 로고가 작아지며 헤더 로고 자리로 옮겨 붙는다 */
	var intro = $('[data-intro]');
	var docEl = document.documentElement;
	if (intro && docEl.classList.contains('intro-on')) {
		var introLogo = $('[data-intro-logo]', intro);
		var hdLogo = $('[data-hd-logo]');
		var finish = function () {
			if (!docEl.classList.contains('intro-on')) return;
			docEl.classList.remove('intro-on');
			intro.remove();
			try { sessionStorage.setItem('elim-intro', '1'); } catch (e) {}
			heroStart();
			startReveal();
		};
		var leave = function () {
			if (!introLogo || !hdLogo) { finish(); return; }
			var from = introLogo.getBoundingClientRect();
			var to = hdLogo.getBoundingClientRect();
			intro.classList.add('is-leaving');
			void introLogo.offsetWidth; // 전환 시작점을 확정한 뒤 목표 위치를 준다
			introLogo.style.transform = 'translate(' + (to.left - from.left) + 'px,' + (to.top - from.top) + 'px) scale(' + (to.width / from.width) + ')';
			// 히어로가 드러나기 시작할 때 사진 줌아웃·문구 떠오르기를 함께 시작
			setTimeout(function () {
				heroStart();
				startReveal();
			}, 350);
			var done = false;
			var land = function () {
				if (done) return;
				done = true;
				finish();
			};
			introLogo.addEventListener('transitionend', function (e) { if (e.propertyName === 'transform') land(); });
			setTimeout(land, 1400);
		};
		var go = function () { setTimeout(leave, 1500); };
		// 로고 이미지를 불러온 뒤 시작 (이미 캐시돼 있으면 바로)
		if (introLogo && !introLogo.complete) {
			introLogo.addEventListener('load', go);
			introLogo.addEventListener('error', finish);
		} else {
			go();
		}
	} else {
		if (intro) intro.remove();
		// 첫 화면이 그려진 뒤 히어로 문구를 띄운다
		requestAnimationFrame(function () { requestAnimationFrame(heroStart); });
		startReveal();
	}

	/* 주요 제품 카드: 가운데 카드가 앞에 크게, 양옆으로 갈수록 작고 흐리게 뒤로.
	   4초마다 자동으로 넘기고(마우스·초점이 있으면 멈춤), 화살표·끌기·밀기·옆 카드 누르기로 직접 넘긴다. */
	$$('[data-flow]').forEach(function (flow) {
		var items = $$('[data-flow-item]', flow);
		var stage = $('[data-flow-stage]', flow);
		var nowEl = $('[data-flow-now]', flow);
		var count = items.length;
		if (!count) return;
		var idx = 0, timer = null, hover = false, dragX = 0;
		var FLOW_MS = 4000;
		var layout = function () {
			var w = items[0].offsetWidth;
			items.forEach(function (el, i) {
				// 가운데로부터의 거리 (양쪽으로 돌아가게)
				var d = i - idx;
				if (d > count / 2) d -= count;
				if (d < -count / 2) d += count;
				var ad = Math.abs(d);
				var x = d * w * 0.62 + dragX;
				var sc = ad === 0 ? 1 : Math.max(1 - ad * 0.14, 0.6);
				el.style.transform = 'translateX(' + x + 'px) translateY(' + (ad * 22) + 'px) scale(' + sc + ')';
				el.style.zIndex = String(100 - ad);
				el.style.filter = ad === 0 ? 'none' : 'blur(' + Math.min(ad * 2.5, 6) + 'px) brightness(' + (1 - ad * 0.06) + ')';
				el.style.opacity = ad > 2 ? '0' : '1';
				el.style.pointerEvents = ad > 2 ? 'none' : '';
				el.classList.toggle('is-active', ad === 0);
				el.setAttribute('aria-hidden', ad === 0 ? 'false' : 'true');
				$$('a', el).forEach(function (a) { if (ad === 0) a.removeAttribute('tabindex'); else a.setAttribute('tabindex', '-1'); });
			});
			if (nowEl) nowEl.textContent = String(idx + 1);
		};
		var go = function (n) { idx = (n + count) % count; layout(); };
		var schedule = function () {
			clearTimeout(timer);
			if (reduced || hover || count < 2) return;
			timer = setTimeout(function () { go(idx + 1); schedule(); }, FLOW_MS);
		};
		var prev = $('[data-flow-prev]', flow), next = $('[data-flow-next]', flow);
		if (prev) prev.addEventListener('click', function () { go(idx - 1); schedule(); });
		if (next) next.addEventListener('click', function () { go(idx + 1); schedule(); });
		flow.addEventListener('mouseenter', function () { hover = true; clearTimeout(timer); });
		flow.addEventListener('mouseleave', function () { hover = false; schedule(); });
		flow.addEventListener('focusin', function () { hover = true; clearTimeout(timer); });
		flow.addEventListener('focusout', function (e) { if (!flow.contains(e.relatedTarget)) { hover = false; schedule(); } });
		flow.addEventListener('keydown', function (e) {
			if (e.key === 'ArrowLeft') { go(idx - 1); e.preventDefault(); }
			else if (e.key === 'ArrowRight') { go(idx + 1); e.preventDefault(); }
		});
		// 옆 카드를 누르면 링크로 가지 않고 가운데로 데려온다
		items.forEach(function (el, i) {
			el.addEventListener('click', function (e) {
				if (!el.classList.contains('is-active')) { e.preventDefault(); go(i); schedule(); }
			});
		});
		// 끌기·밀기
		var sx = 0, sy = 0, down = false, axis = '', moved = false;
		stage.addEventListener('pointerdown', function (e) {
			if (e.button !== 0) return;
			down = true; axis = ''; moved = false; sx = e.clientX; sy = e.clientY; dragX = 0;
		});
		stage.addEventListener('pointermove', function (e) {
			if (!down) return;
			var mx = e.clientX - sx, my = e.clientY - sy;
			if (!axis && (Math.abs(mx) > 6 || Math.abs(my) > 6)) {
				axis = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
				if (axis === 'x') { try { stage.setPointerCapture(e.pointerId); } catch (err) {} flow.classList.add('is-dragging'); clearTimeout(timer); }
			}
			if (axis !== 'x') return;
			moved = true; dragX = mx * 0.6; layout(); e.preventDefault();
		});
		var end = function () {
			if (!down) return;
			down = false;
			flow.classList.remove('is-dragging');
			var w = items[0].offsetWidth;
			var steps = axis === 'x' ? Math.round(-dragX / (w * 0.45)) : 0;
			dragX = 0;
			if (steps) go(idx + steps); else layout();
			if (axis === 'x') schedule();
		};
		stage.addEventListener('pointerup', end);
		stage.addEventListener('pointercancel', end);
		stage.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
		stage.addEventListener('dragstart', function (e) { e.preventDefault(); });
		window.addEventListener('resize', layout);
		layout();
		schedule();
	});

	/* 제품 슬라이드 */
	$$('[data-slider]').forEach(function (slider) {
		var track = $('[data-track]', slider);
		var sec = slider.closest('section') || document;
		var prev = $('[data-slide=prev]', sec);
		var next = $('[data-slide=next]', sec);
		if (!track || !prev || !next) return;
		function step() {
			var item = track.firstElementChild;
			return item ? item.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : track.clientWidth;
		}
		function update() {
			var max = track.scrollWidth - track.clientWidth - 2;
			prev.disabled = track.scrollLeft <= 2;
			next.disabled = track.scrollLeft >= max;
			var hide = track.scrollWidth <= track.clientWidth + 2;
			prev.hidden = next.hidden = hide;
		}
		prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
		next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
		track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
		window.addEventListener('resize', update);
		update();
	});

	/* 유튜브: 누를 때 영상 불러오기 */
	$$('[data-yt]').forEach(function (box) {
		var btn = $('.yt__btn', box);
		if (!btn) return;
		btn.addEventListener('click', function () {
			var iframe = document.createElement('iframe');
			iframe.src = 'https://www.youtube-nocookie.com/embed/' + box.getAttribute('data-yt') + '?autoplay=1&rel=0';
			iframe.title = btn.getAttribute('aria-label') || 'YouTube';
			iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
			iframe.allowFullscreen = true;
			box.replaceChild(iframe, btn);
		});
	});

	/* 제품 이미지 썸네일 */
	$$('[data-gallery]').forEach(function (g) {
		var main = $('[data-gallery-main]', g);
		if (!main) return;
		$$('.pd__thumbs button', g).forEach(function (btn) {
			btn.addEventListener('click', function () {
				main.removeAttribute('srcset');
				main.src = btn.getAttribute('data-full');
				$$('.pd__thumbs button', g).forEach(function (b) { b.removeAttribute('aria-current'); });
				btn.setAttribute('aria-current', 'true');
			});
		});
	});

	/* 모바일: 제품 상세에서 견적 버튼이 화면 밖으로 나가면 하단 고정 버튼 표시 */
	var sticky = $('[data-sticky-cta]');
	var actions = $('.pd__actions');
	if (sticky && actions && 'IntersectionObserver' in window) {
		new IntersectionObserver(function (entries) {
			var e = entries[0];
			sticky.classList.toggle('is-on', !e.isIntersecting && e.boundingClientRect.top < 0);
		}).observe(actions);
	}

	/* 견적문의: 제품을 고르면 제목에 제품명 자동 입력 */
	var select = $('[data-product-select]');
	var subject = $('[data-subject]');
	if (select && subject) {
		var auto = function (name) { return '[견적문의] ' + name; };
		select.addEventListener('change', function () {
			var opt = select.options[select.selectedIndex];
			var isAuto = subject.value === '' || /^\[견적문의\] /.test(subject.value);
			if (isAuto) subject.value = select.value ? auto(opt.text) : '';
		});
	}

	/* 견적문의: 제출 전 필수값 확인 */
	$$('form[data-validate]').forEach(function (form) {
		form.addEventListener('submit', function (ev) {
			var first = null;
			$$('.field__err', form).forEach(function (el) { el.remove(); });
			$$('.is-invalid', form).forEach(function (el) { el.classList.remove('is-invalid'); });
			$$('[required]', form).forEach(function (input) {
				var ok = input.type === 'checkbox' ? input.checked : input.value.trim() !== '' && input.checkValidity();
				if (ok) return;
				var field = input.closest('.field') || input.parentElement;
				field.classList.add('is-invalid');
				var msg = document.createElement('p');
				msg.className = 'field__err';
				msg.textContent = input.type === 'checkbox' ? '동의가 필요합니다.' : (input.value.trim() === '' ? '필수 입력 항목입니다.' : '형식을 확인해 주십시오.');
				field.appendChild(msg);
				if (!first) first = input;
			});
			if (first) {
				ev.preventDefault();
				first.focus();
			} else {
				var btn = form.querySelector('[type=submit]');
				if (btn) { btn.disabled = true; btn.textContent = '전송 중…'; }
			}
		});
	});

	/* 자료실 목차: 현재 읽는 위치 표시 */
	var tocLinks = $$('.toc a');
	if (tocLinks.length && 'IntersectionObserver' in window) {
		var map = {};
		tocLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (e) {
				if (!e.isIntersecting) return;
				tocLinks.forEach(function (a) { a.classList.remove('is-active'); });
				if (map[e.target.id]) map[e.target.id].classList.add('is-active');
			});
		}, { rootMargin: '-20% 0px -70% 0px' });
		Object.keys(map).forEach(function (id) {
			var el = document.getElementById(id);
			if (el) io.observe(el);
		});
	}
})();
