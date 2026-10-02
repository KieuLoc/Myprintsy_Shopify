/**
 * Force Judge.me stars orange + compact review spacing.
 * Targets REVAMP widget (.jm-review-item / .jdgm-review-list) and legacy .jdgm-rev.
 */
(function () {
  var ORANGE = '#E95D2C';
  var STYLE_ID = 'myprintsy-jdgm-star-override';
  var CSS =
    ':root,.jdgm-widget,.jdgm-rev-widg,#judgeme_product_reviews{' +
    '--jdgm-star-color:' +
    ORANGE +
    ' !important;}' +
    '.jdgm-star.jdgm--on,.jdgm-star.jdgm--half,' +
    '.jdgm-star.jdgm--on:before,.jdgm-star.jdgm--half:before,' +
    '.jdgm-star.jdgm--on::before,.jdgm-star.jdgm--half::before,' +
    '#judgeme_product_reviews .jdgm-star.jdgm--on,' +
    '#judgeme_product_reviews .jdgm-star.jdgm--half,' +
    '.jdgm-rev-widg .jdgm-star.jdgm--on,' +
    '.jdgm-widget .jdgm-star.jdgm--on{' +
    'color:' +
    ORANGE +
    ' !important;-webkit-text-fill-color:' +
    ORANGE +
    ' !important;}' +
    '.jdgm-star,.jdgm-star:before,.jdgm-star::before,' +
    '#judgeme_product_reviews .jdgm-star,.jdgm-rev-widg .jdgm-star,' +
    '.jdgm-widget .jdgm-star,.jdgm-prev-badge .jdgm-star,' +
    '.jm-star-rating__font-icon{' +
    'font-size:16px!important;line-height:18px!important;padding-right:2px!important;}' +
    '#judgeme_product_reviews .jm-review-content__body,' +
    '#judgeme_product_reviews .jm-review-body-wrapper,' +
    '#judgeme_product_reviews .jm-review-content,' +
    '#judgeme_product_reviews .jm-reviewer-info__name,' +
    '#judgeme_product_reviews .jm-reviewer-info__details,' +
    '#judgeme_product_reviews .jm-reviewer-info,' +
    '#judgeme_product_reviews .jdgm-rev__body,' +
    '#judgeme_product_reviews .jdgm-rev__content,' +
    '#judgeme_product_reviews .jdgm-rev__author,' +
    '.jdgm-rev__body,.jdgm-rev__content,.jdgm-rev__author{' +
    'font-size:14px!important;line-height:1.45!important;}' +
    '#judgeme_product_reviews .jm-reviewer-info__timestamp,' +
    '#judgeme_product_reviews .jdgm-rev__timestamp,.jdgm-rev__timestamp{' +
    'font-size:12px!important;}' +
    '.shopify-section:has(#judgeme_product_reviews),' +
    '.shopify-section:has(.jdgm-widget-revamp){' +
    'margin-top:2.4rem!important;padding-top:0!important;}' +
    '#judgeme_product_reviews.jdgm-widget-revamp,' +
    '#judgeme_product_reviews.jdgm-review-widget{' +
    'max-width:100%!important;width:100%!important;' +
    'margin-top:2.4rem!important;margin-right:0!important;' +
    'margin-bottom:0!important;margin-left:0!important;padding:0!important;}' +
    '#judgeme_product_reviews .jm-stack.jm-review-widget,' +
    '#judgeme_product_reviews .jm-stack--space-300,' +
    '#judgeme_product_reviews .jm-review-widget--minimal{' +
    'padding-bottom:10px!important;padding-block-end:10px!important;}' +
    '#judgeme_product_reviews .jdgm-review-list{' +
    'padding-block-start:8px!important;padding-top:8px!important;margin:0!important;}' +
    '#judgeme_product_reviews .jm-review-item,' +
    '#judgeme_product_reviews .jm-align-review-item,' +
    '#judgeme_product_reviews .jdgm-review-list .jm-review-item{' +
    'margin-top:0!important;margin-block-start:0!important;margin-bottom:0!important;' +
    'padding-block-end:8px!important;padding-bottom:8px!important;' +
    'padding-top:0!important;min-height:0!important;}' +
    '#judgeme_product_reviews .jm-review-item+.jm-review-item,' +
    '#judgeme_product_reviews .jdgm-review-list>.jm-review-item+.jm-review-item{' +
    'margin-top:8px!important;margin-block-start:8px!important;padding-top:8px!important;}' +
    '#judgeme_product_reviews .jm-stack--space-600>*+*,' +
    '#judgeme_product_reviews .jm-stack--space-400>*+*,' +
    '#judgeme_product_reviews .jm-review-item__content>*+*,' +
    '#judgeme_product_reviews .jm-reviewer-info,' +
    '#judgeme_product_reviews .jm-review-content{' +
    'margin-top:6px!important;margin-block-start:6px!important;}' +
    '#judgeme_product_reviews .jm-stack--space-200>*+*,' +
    '#judgeme_product_reviews .jm-review-content__body,' +
    '#judgeme_product_reviews .jm-review-body-wrapper{' +
    'margin-top:4px!important;margin-block-start:4px!important;}' +
    /* legacy */
    '.jdgm-quest,.jdgm-rev,.jdgm-rev.jdgm-divider-top,' +
    '.jdgm-rev-widg .jdgm-rev,#judgeme_product_reviews .jdgm-rev,' +
    '#judgeme_product_reviews .jm-review-item,#judgeme_product_reviews .jm-align-review-item{' +
    'margin-top:0!important;margin-bottom:0!important;margin-left:0!important;margin-right:0!important;' +
    'padding-top:8px!important;padding-bottom:8px!important;padding-left:0!important;padding-right:0!important;' +
    'min-height:0!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important;' +
    'overflow-x:clip!important;float:none!important;clear:both!important;}' +
    '#judgeme_product_reviews .jdgm-rev__header{overflow:hidden!important;width:100%!important;box-sizing:border-box!important;}' +
    '#judgeme_product_reviews .jdgm-rev__header::after{content:""!important;display:table!important;clear:both!important;}' +
    '#judgeme_product_reviews .jdgm-rev__content,#judgeme_product_reviews .jdgm-rev__body{' +
    'margin-left:0!important;padding-left:0!important;float:none!important;clear:both!important;max-width:100%!important;}' +
    /* Keep clearfix — do NOT display:none (was shifting reviews with photos left) */
    '.jdgm-rev__br,.jdgm-rev__br:empty,#judgeme_product_reviews .jdgm-rev__br{' +
    'display:block!important;clear:both!important;height:0!important;width:100%!important;' +
    'margin:0!important;padding:0!important;border:0!important;overflow:hidden!important;visibility:hidden!important;}' +
    '#judgeme_product_reviews .jdgm-rev__pics,#judgeme_product_reviews .jdgm-rev__pic-link,' +
    '#judgeme_product_reviews .jdgm-rev__pic-img,#judgeme_product_reviews .jdgm-rev__pics img{' +
    'max-width:100%!important;box-sizing:border-box!important;}' +
    '#judgeme_product_reviews .jdgm-review-list,#judgeme_product_reviews .jdgm-rev-widg__body{' +
    'overflow-x:clip!important;max-width:100%!important;}' +
    '#judgeme_product_reviews .jm-average-rating-display--minimal-header [data-myprintsy-based-on],' +
    '#judgeme_product_reviews .jdgm-rev-widg__summary-text[data-myprintsy-based-on]{' +
    'color:#666!important;font-size:14px!important;font-weight:400!important;margin:0!important;' +
    'margin-left:0!important;padding-left:0!important;text-indent:0!important;text-align:left!important;}' +
    /* WP-like header */
    '#judgeme_product_reviews .jm-review-widget-minimal-header__title{' +
    'font-size:15px!important;font-weight:600!important;color:#444!important;line-height:1.5!important;margin:0 0 6px!important;}' +
    '#judgeme_product_reviews .jm-review-widget-minimal-header>.jm-cluster{' +
    'align-items:flex-start!important;--cluster-align:flex-start!important;--cluster-space:8px!important;}' +
    '#judgeme_product_reviews .jm-review-widget-minimal-header__filter-container{' +
    'margin-top:0!important;align-self:flex-start!important;}' +
    '#judgeme_product_reviews .jm-average-rating-display--minimal-header>.jm-cluster{' +
    'flex-direction:column!important;align-items:flex-start!important;gap:4px!important;}' +
    '.myprintsy-jdgm-header-rating-row{display:inline-flex!important;align-items:center!important;gap:8px!important;}' +
    '.myprintsy-jdgm-header-stars{display:inline-flex!important;align-items:center!important;gap:1px!important;}' +
    '.myprintsy-jdgm-header-stars .jdgm-star{font-size:16px!important;line-height:18px!important;' +
    'color:#E95D2C!important;-webkit-text-fill-color:#E95D2C!important;}' +
    '.myprintsy-jdgm-header-stars .jdgm-star.jdgm--off{color:#dadada!important;-webkit-text-fill-color:#dadada!important;}' +
    '#judgeme_product_reviews .jm-average-rating-display--minimal-header [data-myprintsy-avg-score]{' +
    'color:#1c4c78!important;font-size:20px!important;font-weight:600!important;margin:0!important;}' +
    '#judgeme_product_reviews .jm-action-buttons__button[data-testid="write-review-button"],' +
    '#judgeme_product_reviews .jm-button--primary.jm-action-buttons__button{' +
    'background:#fff!important;background-color:#fff!important;color:#000!important;' +
    'border:1px solid #000!important;border-radius:999px!important;font-size:14px!important;' +
    'font-weight:500!important;padding:7px 20px!important;box-shadow:none!important;}' +
    '#judgeme_product_reviews .jm-review-widget-minimal-header__action-buttons{margin-top:0!important;}' +
    '.jdgm-rev-widg__summary{align-items:flex-start!important;text-align:left!important;padding-left:0!important;}' +
    '.jdgm-rev-widg__summary-stars{display:inline-flex!important;align-items:center!important;margin:0!important;padding:0!important;}' +
    '.jdgm-rev-widg__summary-average{color:#1c4c78!important;font-size:20px!important;font-weight:600!important;margin-left:6px!important;}' +
    '.jdgm-write-rev-link{display:inline-block!important;background:#fff!important;color:#000!important;' +
    'border:1px solid #000!important;border-radius:999px!important;font-size:14px!important;' +
    'font-weight:500!important;padding:7px 20px!important;width:auto!important;}' +
    /* Write form: ATC/Preview radius 0.8rem + 16px font (no iOS zoom) + ATC red submit */
    '#judgeme_product_reviews .jdgm-form input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]):not([type=file]),' +
    '#judgeme_product_reviews .jdgm-form textarea,#judgeme_product_reviews textarea,' +
    '#judgeme_product_reviews input[type=text],#judgeme_product_reviews input[type=email],' +
    '.jdgm-form input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]):not([type=file]),' +
    '.jdgm-form textarea,.jm-mfp-content input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]):not([type=file]),' +
    '.jm-mfp-content textarea,.jm-mfp-content input[type=text],.jm-mfp-content input[type=email],' +
    '[class*=jdgm-form] input[type=text],[class*=jdgm-form] input[type=email],[class*=jdgm-form] textarea,' +
    '[class*=jm-review] textarea,[class*=jm-review] input[type=text],[class*=jm-review] input[type=email],' +
    '[data-testid*=review] textarea,[data-testid*=review] input[type=text],[data-testid*=review] input[type=email]{' +
    'border-radius:0.8rem!important;font-size:16px!important;line-height:1.45!important;-webkit-text-size-adjust:100%!important;}' +
    '#judgeme_product_reviews .jdgm-submit-rev,#judgeme_product_reviews .jdgm-btn--solid,' +
    '#judgeme_product_reviews .jdgm-form input[type=submit],#judgeme_product_reviews .jdgm-form button[type=submit],' +
    '.jdgm-form .jdgm-submit-rev,.jdgm-form .jdgm-btn--solid,.jdgm-form input[type=submit],.jdgm-form button[type=submit],' +
    '.jm-mfp-content .jdgm-submit-rev,.jm-mfp-content .jdgm-btn--solid,.jm-mfp-content input[type=submit],' +
    '.jm-mfp-content button[type=submit]{' +
    'background:#be2926!important;background-color:#be2926!important;border:1px solid #be2926!important;' +
    'color:#fff!important;border-radius:0.8rem!important;box-shadow:none!important;}' +
    '#judgeme_product_reviews .jdgm-submit-rev:hover,.jdgm-form .jdgm-submit-rev:hover,' +
    '.jdgm-form input[type=submit]:hover,.jm-mfp-content .jdgm-submit-rev:hover{' +
    'background:#a82422!important;border-color:#a82422!important;color:#fff!important;}' +
    '#judgeme_product_reviews .jdgm-cancel-rev,#judgeme_product_reviews .jdgm-btn--hollow,' +
    '.jdgm-form .jdgm-cancel-rev,.jdgm-form .jdgm-btn--hollow,.jm-mfp-content .jdgm-cancel-rev,' +
    '.jm-mfp-content .jdgm-btn--hollow{' +
    'background:#fff!important;color:#221f1f!important;border:1px solid #221f1f!important;' +
    'border-radius:0.8rem!important;box-shadow:none!important;}' +
    '.jdgm-row-stars{display:flex!important;justify-content:space-between!important;align-items:center!important;width:100%!important;}' +
    /* Hide histogram all viewports (desktop leaked "5 star: 2…") */
    '#judgeme_product_reviews .jdgm-histogram,#judgeme_product_reviews .jdgm-histogram__row,' +
    '#judgeme_product_reviews [class*=jdgm-histogram],#judgeme_product_reviews .jm-rating-distribution,' +
    '#judgeme_product_reviews .jm-bar-chart,#judgeme_product_reviews [class*=rating-distribution],' +
    '#judgeme_product_reviews [data-testid*=histogram],.jdgm-histogram,.jdgm-rev-widg .jdgm-histogram{' +
    'display:none!important;width:0!important;height:0!important;overflow:hidden!important;' +
    'margin:0!important;padding:0!important;visibility:hidden!important;position:absolute!important;}' +
    /* Mobile: WP-like summary + write button */
    '@media screen and (max-width:749px){' +
    '.jdgm-row-stars,#judgeme_product_reviews .jdgm-row-stars{' +
    'display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;' +
    'justify-content:space-between!important;align-items:flex-start!important;gap:10px!important;width:100%!important;}' +
    '#judgeme_product_reviews .jdgm-rev-widg__summary,.jdgm-rev-widg__summary{' +
    'display:flex!important;flex-direction:column!important;align-items:flex-start!important;' +
    'flex:1 1 auto!important;min-width:0!important;max-width:calc(100% - 8.5rem)!important;gap:4px!important;}' +
    '#judgeme_product_reviews .jdgm-widget-actions-wrapper,.jdgm-widget-actions-wrapper{' +
    'display:block!important;float:none!important;width:auto!important;margin:0!important;flex:0 0 auto!important;text-align:right!important;}' +
    '.jdgm-write-rev-link,#judgeme_product_reviews .jdgm-write-rev-link{' +
    'display:inline-block!important;width:auto!important;max-width:none!important;white-space:nowrap!important;' +
    'padding:7px 14px!important;font-size:13px!important;}' +
    '#judgeme_product_reviews .jm-action-buttons__button[data-testid=write-review-button]{' +
    'flex:0 0 auto!important;max-width:none!important;width:auto!important;white-space:nowrap!important;' +
    'padding:7px 14px!important;font-size:13px!important;}' +
    '}';

  function ensureStyle() {
    var el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
    }
    el.textContent = CSS;
    (document.body || document.documentElement).appendChild(el);
  }

  function buildHeaderStars(rating) {
    var wrap = document.createElement('span');
    wrap.setAttribute('data-myprintsy-header-stars', '1');
    wrap.className = 'myprintsy-jdgm-header-stars';
    wrap.setAttribute('aria-hidden', 'true');
    var full = Math.floor(rating + 0.001);
    var frac = rating - full;
    for (var i = 0; i < 5; i++) {
      var s = document.createElement('span');
      var cls = 'jdgm-star ';
      if (i < full) cls += 'jdgm--on';
      else if (i === full && frac >= 0.25) cls += 'jdgm--half';
      else cls += 'jdgm--off';
      s.className = cls;
      wrap.appendChild(s);
    }
    return wrap;
  }

  /** "5.00 out of 5" → "5.00" (giữ 2 chữ số thập phân nếu có). */
  function cleanAverageScoreText(el) {
    if (!el) return NaN;
    var raw = String(el.textContent || '').replace(/\s+/g, ' ').trim();
    var m = raw.match(/(\d+(?:\.\d+)?)/);
    var rating = m ? parseFloat(m[1]) : NaN;
    if (isNaN(rating)) return NaN;
    var cleaned =
      /\.\d/.test(m[1]) ? rating.toFixed(Math.min(2, (m[1].split('.')[1] || '').length || 2)) : String(rating);
    if (/\bout\s*of\b/i.test(raw) || raw !== cleaned) {
      if (el.textContent.trim() !== cleaned) el.textContent = cleaned;
    }
    return rating;
  }

  function alignBasedOnLeft(el) {
    if (!el) return;
    el.style.setProperty('margin', '0', 'important');
    el.style.setProperty('margin-left', '0', 'important');
    el.style.setProperty('padding-left', '0', 'important');
    el.style.setProperty('text-indent', '0', 'important');
    el.style.setProperty('display', 'block', 'important');
    el.style.setProperty('text-align', 'left', 'important');
    el.style.setProperty('width', '100%', 'important');
  }

  /**
   * Some review rows (often with photos / mixed classic+revamp) sit further left.
   * Normalize every item to the first visible row's left edge.
   */
  function alignReviewItemsLeft() {
    var root = document.querySelector('#judgeme_product_reviews');
    if (!root) return;

    var revampItems = root.querySelectorAll('.jm-review-item, .jm-align-review-item');
    var classicItems = root.querySelectorAll('.jdgm-rev');

    /* Revamp mounted: hide leftover classic SSR rows (duplicate / different padding). */
    if (revampItems.length > 0 && classicItems.length > 0) {
      for (var c = 0; c < classicItems.length; c++) {
        classicItems[c].style.setProperty('display', 'none', 'important');
      }
    }

    var items = revampItems.length > 0 ? revampItems : classicItems;
    if (!items.length) return;

    var list =
      root.querySelector('.jdgm-review-list, .jdgm-rev-widg__reviews, .jm-review-widget__body') || root;
    list.style.setProperty('overflow-x', 'hidden', 'important');
    list.style.setProperty('max-width', '100%', 'important');
    list.style.setProperty('box-sizing', 'border-box', 'important');

    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      el.style.setProperty('display', 'block', 'important');
      el.style.setProperty('margin-left', '0', 'important');
      el.style.setProperty('margin-right', '0', 'important');
      el.style.setProperty('padding-left', '0', 'important');
      el.style.setProperty('padding-right', '0', 'important');
      el.style.setProperty('left', 'auto', 'important');
      el.style.setProperty('right', 'auto', 'important');
      el.style.setProperty('transform', 'none', 'important');
      el.style.setProperty('position', 'relative', 'important');
      el.style.setProperty('width', '100%', 'important');
      el.style.setProperty('max-width', '100%', 'important');
      el.style.setProperty('box-sizing', 'border-box', 'important');
      el.style.setProperty('float', 'none', 'important');
      el.style.setProperty('clear', 'both', 'important');
      el.style.setProperty('overflow-x', 'hidden', 'important');

      var media = el.querySelectorAll(
        '.jdgm-rev__pics, .jdgm-rev__pic-link, .jdgm-rev__pic-img, .jdgm-rev__vids, img'
      );
      for (var m = 0; m < media.length; m++) {
        media[m].style.setProperty('margin-left', '0', 'important');
        media[m].style.setProperty('margin-right', '0', 'important');
        media[m].style.setProperty('max-width', '100%', 'important');
        media[m].style.setProperty('float', 'none', 'important');
        media[m].style.setProperty('box-sizing', 'border-box', 'important');
      }
    }

    /* Dedupe same review-id if Judge.me renders twice */
    var seen = {};
    for (var d = 0; d < items.length; d++) {
      var id =
        items[d].getAttribute('data-review-id') ||
        items[d].getAttribute('data-review-uuid') ||
        '';
      if (!id) continue;
      if (seen[id]) {
        items[d].style.setProperty('display', 'none', 'important');
      } else {
        seen[id] = true;
      }
    }

    void root.offsetWidth;

    var visible = [];
    for (var v = 0; v < items.length; v++) {
      if (items[v].style.display === 'none') continue;
      if (window.getComputedStyle(items[v]).display === 'none') continue;
      visible.push(items[v]);
    }
    if (visible.length < 2) return;

    var targetLeft = visible[0].getBoundingClientRect().left;
    for (var j = 1; j < visible.length; j++) {
      var left = visible[j].getBoundingClientRect().left;
      var delta = targetLeft - left;
      if (Math.abs(delta) > 1) {
        visible[j].style.setProperty('margin-left', delta + 'px', 'important');
      }
    }
  }

  /** Classic widget: sao → điểm (bỏ out of 5), Based on căn trái với sao */
  function styleClassicSummaryHeader(root) {
    var avg =
      root.querySelector('.jdgm-rev-widg__summary-average') ||
      document.querySelector('.jdgm-rev-widg__summary-average');
    if (avg) {
      cleanAverageScoreText(avg);
      avg.style.setProperty('color', '#1c4c78', 'important');
      avg.style.setProperty('font-size', '20px', 'important');
      avg.style.setProperty('font-weight', '600', 'important');
      avg.style.setProperty('margin-left', '6px', 'important');
    }

    var starsWrap =
      root.querySelector('.jdgm-rev-widg__summary-stars') ||
      document.querySelector('.jdgm-rev-widg__summary-stars');
    if (starsWrap && avg) {
      starsWrap.style.setProperty('display', 'inline-flex', 'important');
      starsWrap.style.setProperty('align-items', 'center', 'important');
      starsWrap.style.setProperty('flex-wrap', 'wrap', 'important');
      starsWrap.style.setProperty('margin', '0', 'important');
      starsWrap.style.setProperty('padding', '0', 'important');
      /* Sao trước → điểm sau (cùng hàng) */
      starsWrap.appendChild(avg);
    }

    var based =
      root.querySelector('.jdgm-rev-widg__summary-text') ||
      document.querySelector('.jdgm-rev-widg__summary-text');
    if (based) {
      var n = (based.textContent || '').replace(/[^\d]/g, '');
      if (n) {
        var desired = 'Based on ' + n + ' reviews';
        if (based.textContent.trim() !== desired) based.textContent = desired;
      }
      based.setAttribute('data-myprintsy-based-on', '1');
      based.style.setProperty('color', '#666', 'important');
      based.style.setProperty('font-size', '14px', 'important');
      based.style.setProperty('font-weight', '400', 'important');
      alignBasedOnLeft(based);
    }

    var summary =
      root.querySelector('.jdgm-rev-widg__summary') ||
      document.querySelector('.jdgm-rev-widg__summary');
    if (summary) {
      summary.style.setProperty('align-items', 'flex-start', 'important');
      summary.style.setProperty('text-align', 'left', 'important');
      summary.style.setProperty('padding-left', '0', 'important');
      summary.style.setProperty('margin-left', '0', 'important');
    }
  }

  /** Header kiểu WP: sao + điểm navy, Based on…, Write outline pill */
  function styleHeaderLikeWP() {
    var root = document.querySelector('#judgeme_product_reviews') || document;
    if (!root.querySelector) root = document;

    var btn = root.querySelector('[data-testid="write-review-button"]');
    if (btn) {
      btn.style.setProperty('background', '#fff', 'important');
      btn.style.setProperty('background-color', '#fff', 'important');
      btn.style.setProperty('color', '#000', 'important');
      btn.style.setProperty('border', '1px solid #000', 'important');
      btn.style.setProperty('border-radius', '999px', 'important');
      btn.style.setProperty('font-size', '14px', 'important');
      btn.style.setProperty('font-weight', '500', 'important');
      btn.style.setProperty('padding', '7px 20px', 'important');
      btn.style.setProperty('box-shadow', 'none', 'important');
    }

    styleClassicSummaryHeader(root);

    var avgDisplay = root.querySelector('.jm-average-rating-display--minimal-header');
    if (!avgDisplay) {
      var legacyWriteOnly = root.querySelector('.jdgm-write-rev-link');
      if (legacyWriteOnly) {
        legacyWriteOnly.style.setProperty('display', 'inline-block', 'important');
      }
      return;
    }

    var cluster = avgDisplay.querySelector('.jm-cluster');
    if (!cluster) return;

    cluster.style.setProperty('flex-direction', 'column', 'important');
    cluster.style.setProperty('align-items', 'flex-start', 'important');
    cluster.style.setProperty('gap', '4px', 'important');
    cluster.style.setProperty('padding-left', '0', 'important');
    cluster.style.setProperty('margin-left', '0', 'important');

    var ratingEl =
      cluster.querySelector('[data-myprintsy-avg-score]') ||
      cluster.querySelector(':scope > .jm-text') ||
      cluster.querySelector('.myprintsy-jdgm-header-rating-row .jm-text');
    if (!ratingEl) return;

    var rating = cleanAverageScoreText(ratingEl);
    if (isNaN(rating)) rating = 0;

    var row = cluster.querySelector('[data-myprintsy-rating-row]');
    if (!row) {
      row = document.createElement('div');
      row.setAttribute('data-myprintsy-rating-row', '1');
      row.className = 'myprintsy-jdgm-header-rating-row';
      cluster.insertBefore(row, ratingEl);
      row.appendChild(ratingEl);
    } else if (ratingEl.parentElement !== row) {
      row.appendChild(ratingEl);
    }

    ratingEl.setAttribute('data-myprintsy-avg-score', '1');
    ratingEl.style.setProperty('color', '#1c4c78', 'important');
    ratingEl.style.setProperty('font-size', '20px', 'important');
    ratingEl.style.setProperty('font-weight', '600', 'important');
    ratingEl.style.setProperty('margin', '0', 'important');

    var stars = row.querySelector('[data-myprintsy-header-stars]');
    if (!stars) {
      row.insertBefore(buildHeaderStars(rating), ratingEl);
    } else if (stars.nextSibling !== ratingEl) {
      /* Sao trước → điểm sau */
      row.insertBefore(stars, ratingEl);
    }

    var countEl =
      cluster.querySelector('[data-myprintsy-based-on]') ||
      Array.prototype.find.call(cluster.querySelectorAll('.jm-text'), function (el) {
        return el !== ratingEl && /review/i.test(el.textContent || '');
      });

    if (countEl) {
      var n = (countEl.textContent || '').replace(/[^\d]/g, '');
      if (n) {
        var desired = 'Based on ' + n + ' reviews';
        if (countEl.textContent.trim() !== desired) countEl.textContent = desired;
      }
      countEl.setAttribute('data-myprintsy-based-on', '1');
      countEl.style.setProperty('color', '#666', 'important');
      countEl.style.setProperty('font-size', '14px', 'important');
      countEl.style.setProperty('font-weight', '400', 'important');
      alignBasedOnLeft(countEl);
      if (countEl.parentElement === row) cluster.appendChild(countEl);
      else if (row.nextSibling !== countEl) {
        if (row.nextSibling) cluster.insertBefore(countEl, row.nextSibling);
        else cluster.appendChild(countEl);
      }
    }

    /* Legacy write link — bỏ display:none nếu có */
    var legacyWrite = root.querySelector('.jdgm-write-rev-link');
    if (legacyWrite) {
      legacyWrite.style.setProperty('display', 'inline-block', 'important');
    }
  }

  /**
   * Judge.me sometimes parks pagination between review rows (float / DOM inject).
   * Move the pager *container* to the end of the review list (or after the list).
   * Do not match inner .jdgm-paginate__page buttons — that un-parents 1/2/> into a column.
   */
  function rehomeOrphanPagerButtons(root, list, host) {
    var orphans = root.querySelectorAll(
      'a.jdgm-paginate__page, a.jdgm-paginate__next-page, a.jdgm-paginate__last-page, a.jdgm-paginate__prev-page, a.jdgm-paginate__first-page'
    );
    if (!orphans.length) return;

    var wrap = root.querySelector('.jdgm-paginate');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'jdgm-paginate';
    }

    for (var o = 0; o < orphans.length; o++) {
      var node = orphans[o];
      if (!node || node.parentElement === wrap) continue;
      wrap.appendChild(node);
    }

    if (!wrap.parentElement) {
      var dest = list || host || root;
      dest.appendChild(wrap);
    }
  }

  function ensureReviewPaginationAtBottom() {
    var root = document.querySelector('#judgeme_product_reviews');
    if (!root) return;

    var list = root.querySelector(
      '.jdgm-review-list, .jdgm-rev-widg__reviews, .jm-review-widget__body .jm-stack'
    );
    var host =
      (list && list.parentElement) ||
      root.querySelector(
        '.jm-review-widget__body, .jm-review-widget-minimal-body, .jdgm-rev-widg__body, .jm-review-widget'
      ) ||
      root;

    rehomeOrphanPagerButtons(root, list, host);

    var pagers = root.querySelectorAll('.jdgm-paginate, .jm-pagination, nav[aria-label*="agination" i]');
    if (!pagers.length) return;

    for (var i = 0; i < pagers.length; i++) {
      var p = pagers[i];
      if (!p || !p.parentElement) continue;
      /* Skip tiny in-header controls */
      if (p.closest('.jm-review-widget-minimal-header, .jdgm-rev-widg__header, .jdgm-row-stars')) {
        continue;
      }
      /* Nested nav inside another pager — leave it */
      var nestedParent = p.parentElement.closest('.jdgm-paginate, .jm-pagination');
      if (nestedParent && nestedParent !== p) continue;
      try {
        if (list && list.contains(p)) {
          if (list.lastElementChild !== p) list.appendChild(p);
        } else if (list && list.parentElement === host) {
          if (host.lastElementChild !== p) host.appendChild(p);
        } else if (host.lastElementChild !== p) {
          host.appendChild(p);
        }
        p.style.setProperty('order', '9999', 'important');
        p.style.setProperty('width', '100%', 'important');
        p.style.setProperty('clear', 'both', 'important');
        p.style.setProperty('float', 'none', 'important');
        p.style.setProperty('display', 'flex', 'important');
        p.style.setProperty('flex-direction', 'row', 'important');
        p.style.setProperty('flex-wrap', 'wrap', 'important');
        p.style.setProperty('justify-content', 'center', 'important');
      } catch (_) {}
    }
  }

  function paintInline() {
    document.documentElement.style.setProperty('--jdgm-star-color', ORANGE, 'important');

    var root = document.querySelector('#judgeme_product_reviews');
    if (root) {
      root.style.setProperty('--jdgm-star-color', ORANGE, 'important');
      root.style.setProperty('max-width', '100%', 'important');
      root.style.setProperty('width', '100%', 'important');
      root.style.setProperty('margin-top', '2.4rem', 'important');
      root.style.setProperty('margin-right', '0', 'important');
      root.style.setProperty('margin-bottom', '0', 'important');
      root.style.setProperty('margin-left', '0', 'important');
      root.style.setProperty('padding', '0', 'important');
    }

    var widgets = document.querySelectorAll(
      '#judgeme_product_reviews .jm-review-widget, #judgeme_product_reviews .jm-stack--space-300'
    );
    for (var w = 0; w < widgets.length; w++) {
      widgets[w].style.setProperty('padding-bottom', '10px', 'important');
      widgets[w].style.setProperty('padding-block-end', '10px', 'important');
    }

    ensureReviewPaginationAtBottom();

    var stars = document.querySelectorAll('.jdgm-star, .jm-star-rating__font-icon');
    for (var j = 0; j < stars.length; j++) {
      if (stars[j].classList.contains('jdgm--on') || stars[j].classList.contains('jdgm--half')) {
        stars[j].style.setProperty('color', ORANGE, 'important');
        stars[j].style.setProperty('-webkit-text-fill-color', ORANGE, 'important');
      }
      stars[j].style.setProperty('font-size', '16px', 'important');
      stars[j].style.setProperty('line-height', '18px', 'important');
    }

    var hist = document.querySelectorAll(
      '#judgeme_product_reviews .jdgm-histogram, #judgeme_product_reviews .jm-rating-distribution,' +
        '#judgeme_product_reviews .jm-bar-chart, .jdgm-histogram, .jdgm-rev-widg .jdgm-histogram'
    );
    for (var hi = 0; hi < hist.length; hi++) {
      hist[hi].style.setProperty('display', 'none', 'important');
      hist[hi].style.setProperty('visibility', 'hidden', 'important');
    }

    styleHeaderLikeWP();

    /* iOS: no zoom on focus — font-size must be >= 16px */
    var formFields = document.querySelectorAll(
      '#judgeme_product_reviews textarea, #judgeme_product_reviews input[type="text"],' +
        '#judgeme_product_reviews input[type="email"], #judgeme_product_reviews .jdgm-form textarea,' +
        '#judgeme_product_reviews .jdgm-form input[type="text"], #judgeme_product_reviews .jdgm-form input[type="email"],' +
        '.jm-mfp-content textarea, .jm-mfp-content input[type="text"], .jm-mfp-content input[type="email"],' +
        '.jdgm-form textarea, .jdgm-form input[type="text"], .jdgm-form input[type="email"]'
    );
    for (var f = 0; f < formFields.length; f++) {
      formFields[f].style.setProperty('font-size', '16px', 'important');
      formFields[f].style.setProperty('line-height', '1.45', 'important');
    }

    var lists = document.querySelectorAll('#judgeme_product_reviews .jdgm-review-list');
    for (var l = 0; l < lists.length; l++) {
      lists[l].style.setProperty('padding-top', '8px', 'important');
      lists[l].style.setProperty('padding-block-start', '8px', 'important');
    }

    var items = document.querySelectorAll(
      '#judgeme_product_reviews .jm-review-item, #judgeme_product_reviews .jm-align-review-item'
    );
    for (var r = 0; r < items.length; r++) {
      items[r].style.setProperty('margin-top', r === 0 ? '0' : '8px', 'important');
      items[r].style.setProperty('margin-block-start', r === 0 ? '0' : '8px', 'important');
      items[r].style.setProperty('margin-bottom', '0', 'important');
      items[r].style.setProperty('padding-top', r === 0 ? '0' : '8px', 'important');
      items[r].style.setProperty('padding-bottom', '8px', 'important');
      items[r].style.setProperty('padding-block-end', '8px', 'important');
    }

    var spaced = document.querySelectorAll(
      '#judgeme_product_reviews .jm-reviewer-info, #judgeme_product_reviews .jm-review-content'
    );
    for (var s = 0; s < spaced.length; s++) {
      spaced[s].style.setProperty('margin-top', '6px', 'important');
      spaced[s].style.setProperty('margin-block-start', '6px', 'important');
    }

    /* legacy */
    var legacy = document.querySelectorAll('.jdgm-rev, .jdgm-quest');
    for (var i = 0; i < legacy.length; i++) {
      legacy[i].style.setProperty('margin-top', '0', 'important');
      legacy[i].style.setProperty('margin-left', '0', 'important');
      legacy[i].style.setProperty('margin-right', '0', 'important');
      legacy[i].style.setProperty('padding-top', '8px', 'important');
      legacy[i].style.setProperty('padding-bottom', '8px', 'important');
      legacy[i].style.setProperty('padding-left', '0', 'important');
      legacy[i].style.setProperty('padding-right', '0', 'important');
      legacy[i].style.setProperty('width', '100%', 'important');
      legacy[i].style.setProperty('max-width', '100%', 'important');
      legacy[i].style.setProperty('box-sizing', 'border-box', 'important');
      legacy[i].style.setProperty('overflow-x', 'clip', 'important');
      legacy[i].style.setProperty('float', 'none', 'important');
      legacy[i].style.setProperty('clear', 'both', 'important');
    }
    var brs = document.querySelectorAll('.jdgm-rev__br');
    for (var b = 0; b < brs.length; b++) {
      /* Keep clearfix — only collapse visually */
      brs[b].style.setProperty('display', 'block', 'important');
      brs[b].style.setProperty('clear', 'both', 'important');
      brs[b].style.setProperty('height', '0', 'important');
      brs[b].style.setProperty('margin', '0', 'important');
      brs[b].style.setProperty('padding', '0', 'important');
      brs[b].style.setProperty('border', '0', 'important');
      brs[b].style.setProperty('overflow', 'hidden', 'important');
      brs[b].style.setProperty('visibility', 'hidden', 'important');
    }
    var headers = document.querySelectorAll('#judgeme_product_reviews .jdgm-rev__header, .jdgm-rev__header');
    for (var h = 0; h < headers.length; h++) {
      headers[h].style.setProperty('overflow', 'hidden', 'important');
      headers[h].style.setProperty('width', '100%', 'important');
    }
    var pics = document.querySelectorAll(
      '#judgeme_product_reviews .jdgm-rev__pic-img, #judgeme_product_reviews .jdgm-rev__pics img, #judgeme_product_reviews .jm-review-item img'
    );
    for (var p = 0; p < pics.length; p++) {
      pics[p].style.setProperty('max-width', '100%', 'important');
      pics[p].style.setProperty('height', 'auto', 'important');
      pics[p].style.setProperty('box-sizing', 'border-box', 'important');
      if (!pics[p].__myprintsyAlignBound) {
        pics[p].__myprintsyAlignBound = true;
        pics[p].addEventListener('load', function () {
          alignReviewItemsLeft();
          ensureReviewPaginationAtBottom();
        });
      }
    }

    /* Last: measure + align left edges (after all margin resets above). */
    alignReviewItemsLeft();
    ensureReviewPaginationAtBottom();
  }

  function run() {
    ensureStyle();
    paintInline();
  }

  run();
  document.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);

  var n = 0;
  var timer = window.setInterval(function () {
    run();
    n += 1;
    if (n >= 60) window.clearInterval(timer);
  }, 400);

  if (typeof MutationObserver === 'function' && document.documentElement) {
    var pending = false;
    var obs = new MutationObserver(function () {
      if (pending || window.__myprintsyPdpUpdating) return;
      pending = true;
      window.setTimeout(function () {
        pending = false;
        if (window.__myprintsyPdpUpdating) return;
        run();
      }, 200);
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(function () {
      obs.disconnect();
    }, 45000);
  }
})();
