const test = require('node:test');
const assert = require('node:assert');
const guidesData = require('../spelformer/guides/guides.11tydata.js');

// Låser kontraktet: en översatt guide sätter `key` explicit i sin egen
// frontmatter till den SVENSKA sluggen (se kommentaren i
// guides.11tydata.js), och eleventyComputed får inte skriva över det.
// Fyndet som motiverar testet: innan fixen skrev `key: (data) =>
// \`guide:${data.slug}\`` alltid över frontmatter-värdet ovillkorligt, så en
// norsk guide med slug "slagspill" fick key "guide:slagspill" i stället för
// "guide:slaggolf" och grupperades aldrig ihop med originalet.
test('key i frontmatter vinner över den härledda defaulten', () => {
  const data = { slug: 'slagspill', key: 'guide:slaggolf' };
  assert.strictEqual(guidesData.eleventyComputed.key(data), 'guide:slaggolf');
});

test('utan explicit key i frontmatter härleds den från sluggen (svenska guider)', () => {
  const data = { slug: 'slaggolf' };
  assert.strictEqual(guidesData.eleventyComputed.key(data), 'guide:slaggolf');
});
