/**
 * GitHub Pages 미리보기용 보정 스크립트 (정적 사이트에는 PHP가 없음)
 * - 견적문의: ?product_id= 로 들어오면 제품 선택·제목 자동 입력
 * - FAQ: 분류 탭(?cat=)과 검색(?q=)을 브라우저에서 처리
 * - 커뮤니티 게시판: 검색(?q=)과 세미나 예정/지난(?when=)을 브라우저에서 처리
 * - 문의 전송·사이트 검색: 미리보기에서는 동작하지 않는다는 안내 표시
 */
(function () {
	'use strict';
	var params = new URLSearchParams(location.search);

	function notice(target, text) {
		var old = target.querySelector('.preview-notice');
		if (old) old.remove();
		var p = document.createElement('div');
		p.className = 'alert alert--err preview-notice';
		p.setAttribute('role', 'status');
		p.textContent = text;
		target.insertBefore(p, target.firstChild);
		p.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}

	/* 견적문의 제품명 자동 입력 */
	var pid = params.get('product_id');
	var select = document.querySelector('[data-product-select]');
	if (pid && select) {
		var opt = select.querySelector('option[value="' + CSS.escape(pid) + '"]');
		if (opt) {
			select.value = pid;
			var subject = document.querySelector('[data-subject]');
			if (subject && !subject.value) subject.value = '[견적문의] ' + opt.text;
			var form = select.closest('form');
			if (form && !document.querySelector('.picked')) {
				var box = document.createElement('div');
				box.className = 'picked';
				box.innerHTML = '<div><p class="picked__label">문의 제품</p><p class="picked__name"></p></div>';
				box.querySelector('.picked__name').textContent = opt.text;
				form.parentNode.insertBefore(box, form);
			}
		}
	}

	/* 문의 폼: 전송 대신 안내 */
	document.querySelectorAll('form[action*="admin-post.php"]').forEach(function (form) {
		var btn = form.querySelector('[type=submit]');
		var label = btn ? btn.innerHTML : '';
		form.addEventListener('submit', function (e) {
			if (e.defaultPrevented) return; // 필수값 검사에서 이미 막힌 경우
			e.preventDefault();
			// 사이트 스크립트가 바꿔 둔 "전송 중…" 버튼을 원래대로
			setTimeout(function () { if (btn) { btn.disabled = false; btn.innerHTML = label; } }, 0);
			notice(form, '미리보기 사이트라 문의가 전송되지 않습니다. 실제 사이트에서는 담당자 이메일로 바로 접수됩니다.');
		});
	});

	/* 사이트 검색: 안내 */
	document.querySelectorAll('form[role="search"]').forEach(function (form) {
		form.addEventListener('submit', function (e) {
			e.preventDefault();
			notice(form.parentNode, '미리보기 사이트에서는 검색이 동작하지 않습니다. 실제 사이트에서는 제품·자료·공지를 검색합니다.');
		});
	});

	/* FAQ 분류·검색 */
	var faqItems = document.querySelectorAll('.faq__item[data-cats]');
	if (faqItems.length) {
		var cat = params.get('cat') || '';
		var q = (params.get('q') || '').trim().toLowerCase();
		var shown = 0;
		faqItems.forEach(function (it) {
			var okCat = !cat || (' ' + it.getAttribute('data-cats') + ' ').indexOf(' ' + cat + ' ') !== -1;
			var okQ = !q || it.textContent.toLowerCase().indexOf(q) !== -1;
			it.hidden = !(okCat && okQ);
			if (!it.hidden) shown++;
		});
		document.querySelectorAll('.seg a').forEach(function (a) {
			var aCat = new URL(a.href).searchParams.get('cat') || '';
			if (aCat === cat) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
		});
		var input = document.querySelector('input[name="q"]');
		if (input) input.value = params.get('q') || '';
		if (!shown) {
			var faq = document.querySelector('.faq');
			var p = document.createElement('p');
			p.className = 'empty';
			p.textContent = '등록된 질문이 없습니다.';
			faq.appendChild(p);
		}
	}

	/* 커뮤니티 게시판 목록: 검색(?q=)과 세미나 예정/지난(?when=)을 브라우저에서 거른다 */
	var boardRows = document.querySelectorAll('.sec--board .board tbody tr');
	if (boardRows.length && !faqItems.length) {
		var bq = (params.get('q') || '').trim().toLowerCase();
		var when = params.get('when') || '';
		var titles = { upcoming: '예정 세미나', past: '지난 세미나' };
		var visible = 0;
		boardRows.forEach(function (tr) {
			if (tr.querySelector('.empty')) return;
			var okQ = !bq || tr.textContent.toLowerCase().indexOf(bq) !== -1;
			var state = tr.querySelector('.state');
			var okW = !when || !state || (when === 'past') === state.classList.contains('state--done');
			tr.hidden = !(okQ && okW);
			if (!tr.hidden) visible++;
		});
		if (titles[when]) {
			var h = document.querySelector('.board-title');
			if (h) h.textContent = titles[when];
			document.querySelectorAll('.side__group a').forEach(function (a) {
				var aw = new URL(a.href).searchParams.get('when') || '';
				if (a.closest('.side__group').querySelector('summary.is-active')) {
					if (aw === when) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
				}
			});
		}
		var bInput = document.querySelector('.sec--board input[name="q"]');
		if (bInput) bInput.value = params.get('q') || '';
		if (!visible) {
			var tbody = document.querySelector('.sec--board .board tbody');
			if (tbody && !tbody.querySelector('.empty')) {
				var tr = document.createElement('tr');
				var cols = document.querySelectorAll('.sec--board .board thead th').length || 1;
				tr.innerHTML = '<td colspan="' + cols + '" class="empty">검색 결과가 없습니다.</td>';
				tbody.appendChild(tr);
			}
		}
	}
})();
