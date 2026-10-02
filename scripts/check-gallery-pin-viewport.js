/**
 * The "pin Shopify photo, demote Customily layers" behaviour has two halves:
 * the DESKTOP_GALLERY_MQ gate in customily-preview-atc.js and the pin block in
 * customily-preview-atc.css. If only one half covers a viewport, the gallery ends
 * up half-pinned (imgs reclassified but fallback unstyled, or vice versa).
 *
 * Run: node scripts/check-gallery-pin-viewport.js
 */
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ASSETS = path.join(__dirname, '..', 'assets');
const MOBILE_WIDTH = 390;
const DESKTOP_WIDTH = 1440;

/** true when a CSS media condition matches this viewport width */
function coversWidth(condition, width) {
  const min = /min-width:\s*(\d+)px/i.exec(condition);
  const max = /max-width:\s*(\d+)px/i.exec(condition);
  if (min && width < Number(min[1])) return false;
  if (max && width > Number(max[1])) return false;
  return true;
}

function jsGate(source) {
  const m = /DESKTOP_GALLERY_MQ\s*=\s*'([^']+)'/.exec(source);
  assert.ok(m, 'DESKTOP_GALLERY_MQ not found in customily-preview-atc.js');
  return m[1];
}

/** condition of the @media block that styles the injected Shopify fallback img */
function cssPinCondition(source) {
  const anchor = source.indexOf('img.myprintsy-shopify-fallback {');
  assert.ok(anchor > -1, 'pin block (img.myprintsy-shopify-fallback) not found in CSS');
  const before = source.slice(0, anchor);
  const open = before.lastIndexOf('@media');
  assert.ok(open > -1, 'pin block is not inside an @media query');
  return before.slice(open, before.indexOf('{', open));
}

// --- failure case: drifted halves must be detected -------------------------
const drifted = coversWidth('(min-width: 0px)', MOBILE_WIDTH) === coversWidth('@media screen and (min-width: 750px)', MOBILE_WIDTH);
assert.equal(drifted, false, 'coversWidth is broken: 0px and 750px gates must differ on mobile');
assert.equal(coversWidth('@media screen and (max-width: 749px)', DESKTOP_WIDTH), false, 'coversWidth ignores max-width');

// --- real files: both halves agree on both viewports ----------------------
const gate = jsGate(fs.readFileSync(path.join(ASSETS, 'customily-preview-atc.js'), 'utf8'));
const css = cssPinCondition(fs.readFileSync(path.join(ASSETS, 'customily-preview-atc.css'), 'utf8'));

for (const width of [MOBILE_WIDTH, DESKTOP_WIDTH]) {
  const inJs = coversWidth(gate, width);
  const inCss = coversWidth(css, width);
  assert.equal(
    inJs,
    inCss,
    `half-pinned gallery at ${width}px — JS gate '${gate}' says ${inJs}, CSS '${css.trim()}' says ${inCss}`
  );
  assert.ok(inJs, `gallery pin disabled at ${width}px (JS gate '${gate}')`);
}

console.log(`OK — Shopify photo pinned at ${MOBILE_WIDTH}px and ${DESKTOP_WIDTH}px (JS '${gate}', CSS '${css.trim()}')`);
