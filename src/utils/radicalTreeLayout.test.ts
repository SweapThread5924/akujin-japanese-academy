import test from 'node:test';
import assert from 'node:assert/strict';
import { KANJI_DECK } from '../data/curriculumData';
import {
  buildRadicalTreeForKanji,
  collectAncestryIds,
  layoutRadicalTree,
} from './radicalTreeLayout';

test('buildRadicalTreeForKanji generates recursive multi-level trees and respects expansion toggle', () => {
  const kataru = KANJI_DECK.find((k) => k.id === 'kanji-kataru');
  assert.ok(kataru, 'Expected kanji-kataru (語) in KANJI_DECK');

  const fullTree = buildRadicalTreeForKanji(kataru, true);
  assert.equal(fullTree.symbol, '語');
  assert.equal(fullTree.children.length, 2);
  assert.equal(fullTree.children[0].symbol, '言');
  assert.equal(fullTree.children[0].children.length, 2);
  assert.equal(fullTree.children[1].symbol, '吾');
  assert.equal(fullTree.children[1].children.length, 2);

  const primaryTree = buildRadicalTreeForKanji(kataru, false);
  assert.equal(primaryTree.children[0].children.length, 0);
  assert.equal(primaryTree.children[1].children.length, 0);
});

test('layoutRadicalTree lays out every KANJI_DECK entry with zero overlapping node boxes', () => {
  for (const kanji of KANJI_DECK) {
    const tree = buildRadicalTreeForKanji(kanji, true);
    const layout = layoutRadicalTree(tree);

    assert.ok(layout.nodes.length >= 3, `Expected >= 3 nodes for ${kanji.kanji}`);
    assert.equal(layout.edges.length, layout.nodes.length - 1);

    // Group nodes by depth and ensure horizontal intervals never collide
    const byDepth = new Map<number, typeof layout.nodes>();
    for (const item of layout.nodes) {
      assert.ok(item.x - item.width / 2 >= 0, `${kanji.kanji} node left edge >= 0`);
      assert.ok(item.x + item.width / 2 <= layout.width, `${kanji.kanji} node right edge <= width`);
      const bucket = byDepth.get(item.depth) ?? [];
      bucket.push(item);
      byDepth.set(item.depth, bucket);
    }

    for (const [depth, row] of byDepth.entries()) {
      const sorted = [...row].sort((a, b) => a.x - b.x);
      for (let i = 1; i < sorted.length; i++) {
        const prevRight = sorted[i - 1].x + sorted[i - 1].width / 2;
        const currLeft = sorted[i].x - sorted[i].width / 2;
        assert.ok(
          currLeft >= prevRight + 4,
          `${kanji.kanji} depth ${depth} nodes overlap: ${prevRight} vs ${currLeft}`
        );
      }
    }
  }
});

test('collectAncestryIds traces root-to-leaf path accurately', () => {
  const kibou = KANJI_DECK.find((k) => k.id === 'kanji-kibou');
  assert.ok(kibou, 'Expected kanji-kibou (望) with 3 radicals');
  const tree = buildRadicalTreeForKanji(kibou, true);
  const layout = layoutRadicalTree(tree);

  const middleRad = layout.nodes.find((n) => n.node.symbol === '月');
  assert.ok(middleRad);
  const ancestry = collectAncestryIds(layout.nodes, middleRad.node.id);
  assert.equal(ancestry.has(`root-${kibou.id}`), true);
  assert.equal(ancestry.has(middleRad.node.id), true);
  assert.equal(ancestry.size, 2);
});
