import type { KanjiCard } from '../data/curriculumData';

export type RadicalNodeRole = 'root' | 'meaning' | 'phonetic' | 'primitive';

export interface RadicalTreeNode {
  id: string;
  symbol: string;
  name: string;
  meaning: string;
  role: RadicalNodeRole;
  roleLabel: string;
  strokes?: number;
  note: string;
  children: RadicalTreeNode[];
}

export interface PositionedTreeNode {
  node: RadicalTreeNode;
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  parentId: string | null;
}

export interface PositionedTreeEdge {
  id: string;
  fromId: string;
  toId: string;
  pathD: string;
}

export interface RadicalTreeLayout {
  width: number;
  height: number;
  maxDepth: number;
  nodes: PositionedTreeNode[];
  edges: PositionedTreeEdge[];
}

interface SubRadicalSpec {
  symbol: string;
  name: string;
  meaning: string;
  strokes: number;
  note: string;
  children?: SubRadicalSpec[];
}

/**
 * Recursive elementary decomposition dictionary for compound radicals used across KANJI_DECK.
 * Allows the Radical Tree to decompose complex Kanji down to atomic primitives.
 */
const RADICAL_DECOMPOSITION: Record<string, SubRadicalSpec[]> = {
  亻: [
    {
      symbol: '人',
      name: 'Hito',
      meaning: 'Standing human figure',
      strokes: 2,
      note: 'Side-variant of 人 (person) compressed on the left of compound Kanji.',
    },
  ],
  木: [
    {
      symbol: '十',
      name: 'Trunk · Top',
      meaning: 'Vertical trunk + branches',
      strokes: 2,
      note: 'Upper cross forming the main trunk and spreading horizontal branches.',
    },
    {
      symbol: 'ハ',
      name: 'Ne (Roots)',
      meaning: 'Spreading tree roots',
      strokes: 2,
      note: 'Diagonal left-right strokes anchoring the tree in the ground.',
    },
  ],
  言: [
    {
      symbol: '亠',
      name: 'Nabebuta',
      meaning: 'Rising sound / Lid',
      strokes: 2,
      note: 'Top lid stroke paired with parallel sound waves rising from the mouth.',
    },
    {
      symbol: '口',
      name: 'Kuchi',
      meaning: 'Mouth · Speech',
      strokes: 3,
      note: 'Elementary mouth pictogram at the base of speaking and language Kanji.',
    },
  ],
  吾: [
    {
      symbol: '五',
      name: 'Go · Five',
      meaning: 'Five · Phonetic "go"',
      strokes: 4,
      note: 'Supplies the On’yomi reading ゴ (go) in 語.',
    },
    {
      symbol: '口',
      name: 'Kuchi',
      meaning: 'Mouth · Voice',
      strokes: 3,
      note: 'Reinforces spoken articulation from the mouth.',
    },
  ],
  馬: [
    {
      symbol: '目',
      name: 'Mane & Body',
      meaning: 'Horse head & saddle frame',
      strokes: 6,
      note: 'Framed upper body depicting the horse’s mane and torso.',
    },
    {
      symbol: '灬',
      name: 'Rekka (Hooves)',
      meaning: 'Four galloping hooves',
      strokes: 4,
      note: 'Four swift dots representing a horse’s running legs.',
    },
  ],
  扌: [
    {
      symbol: '手',
      name: 'Te (Full Form)',
      meaning: 'Hand · Physical action',
      strokes: 4,
      note: 'Compressed left-side form of 手 (hand) signaling active movement.',
    },
  ],
  亟: [
    {
      symbol: '了',
      name: 'Reach',
      meaning: 'Ceiling & hook',
      strokes: 2,
      note: 'Upper bound marking the highest point between earth and sky.',
    },
    {
      symbol: '口',
      name: 'Kuchi',
      meaning: 'Core center',
      strokes: 3,
      note: 'Central focus point within the boundary.',
    },
    {
      symbol: '又',
      name: 'Mata',
      meaning: 'Striving hand',
      strokes: 2,
      note: 'Right-hand glyph showing effort pushing toward the limit.',
    },
  ],
  金: [
    {
      symbol: '𠆢',
      name: 'Hito-yane',
      meaning: 'Ore cover / Smelter',
      strokes: 2,
      note: 'Roof covering molten metal ore underground.',
    },
    {
      symbol: '王',
      name: 'Nuggets in Earth',
      meaning: 'Precious veins in soil',
      strokes: 4,
      note: 'Mineral veins embedded beneath the surface, highlighted by two dots.',
    },
  ],
  監: [
    {
      symbol: '臣',
      name: 'Shin',
      meaning: 'Gazing eye',
      strokes: 7,
      note: 'Pictogram of an attentive eye looking downward.',
    },
    {
      symbol: '皿',
      name: 'Sara',
      meaning: 'Water basin',
      strokes: 5,
      note: 'Shallow vessel filled with water acting as an ancient mirror.',
    },
  ],
  幺: [
    {
      symbol: '糸',
      name: 'Ito (Family)',
      meaning: 'Twisted silk threads',
      strokes: 6,
      note: 'Paired twin cocoons depicting fine, barely visible silk strands.',
    },
  ],
};

function mapSubSpecToNode(spec: SubRadicalSpec, pathKey: string): RadicalTreeNode {
  return {
    id: pathKey,
    symbol: spec.symbol,
    name: spec.name,
    meaning: spec.meaning,
    role: 'primitive',
    roleLabel: 'Primitive',
    strokes: spec.strokes,
    note: spec.note,
    children: (spec.children ?? []).map((child, idx) =>
      mapSubSpecToNode(child, `${pathKey}-${idx}`)
    ),
  };
}

function classifyRadicalRole(roleText: string): RadicalNodeRole {
  return roleText.toLowerCase().includes('meaning') ? 'meaning' : 'phonetic';
}

export function buildRadicalTreeForKanji(
  kanji: KanjiCard,
  expandSubRadicals = true
): RadicalTreeNode {
  return {
    id: `root-${kanji.id}`,
    symbol: kanji.kanji,
    name: kanji.level,
    meaning: kanji.meaning,
    role: 'root',
    roleLabel: 'Root Kanji',
    strokes: kanji.strokes,
    note: kanji.combinationStory,
    children: kanji.radicals.map((rad, idx) => {
      const role = classifyRadicalRole(rad.role);
      const subSpecs = expandSubRadicals ? RADICAL_DECOMPOSITION[rad.symbol] ?? [] : [];
      const nodeId = `rad-${kanji.id}-${idx}`;
      return {
        id: nodeId,
        symbol: rad.symbol,
        name: rad.name,
        meaning: rad.meaning,
        role,
        roleLabel: role === 'meaning' ? 'Meaning' : 'Phonetic',
        note: `${rad.name} (${rad.symbol}) contributes "${rad.meaning}" as a ${rad.role.toLowerCase()}.`,
        children: subSpecs.map((sub, subIdx) =>
          mapSubSpecToNode(sub, `${nodeId}-sub-${subIdx}`)
        ),
      };
    }),
  };
}

function computeSubtreeStats(node: RadicalTreeNode): { span: number; maxDepth: number } {
  if (node.children.length === 0) {
    return { span: 1, maxDepth: 0 };
  }
  let spanSum = 0;
  let deepestChild = 0;
  for (const child of node.children) {
    const childStats = computeSubtreeStats(child);
    spanSum += childStats.span;
    if (childStats.maxDepth > deepestChild) {
      deepestChild = childStats.maxDepth;
    }
  }
  return {
    span: Math.max(1, spanSum),
    maxDepth: deepestChild + 1,
  };
}

export function layoutRadicalTree(root: RadicalTreeNode): RadicalTreeLayout {
  const { span: totalSpan, maxDepth } = computeSubtreeStats(root);

  const nodeWidth = 104;
  const nodeHeight = 72;
  const colUnit = 122;
  const levelHeight = 114;
  const padX = 20;
  const padY = 20;

  const contentWidth = Math.max(320, totalSpan * colUnit);
  const width = contentWidth + padX * 2;
  const height = maxDepth * levelHeight + nodeHeight + padY * 2;

  const nodes: PositionedTreeNode[] = [];
  const edges: PositionedTreeEdge[] = [];

  const spanCache = new Map<string, number>();
  const getSpan = (n: RadicalTreeNode): number => {
    const cached = spanCache.get(n.id);
    if (cached !== undefined) return cached;
    const s =
      n.children.length === 0
        ? 1
        : Math.max(
            1,
            n.children.reduce((acc, c) => acc + getSpan(c), 0)
          );
    spanCache.set(n.id, s);
    return s;
  };

  function placeNode(
    node: RadicalTreeNode,
    depth: number,
    xStart: number,
    xEnd: number,
    parentPos: PositionedTreeNode | null
  ) {
    const x = (xStart + xEnd) / 2;
    const y = padY + nodeHeight / 2 + depth * levelHeight;
    const pos: PositionedTreeNode = {
      node,
      depth,
      x,
      y,
      width: nodeWidth,
      height: nodeHeight,
      parentId: parentPos ? parentPos.node.id : null,
    };
    nodes.push(pos);

    if (parentPos) {
      const startY = parentPos.y + parentPos.height / 2;
      const endY = y - nodeHeight / 2;
      const midY = (startY + endY) / 2;
      edges.push({
        id: `${parentPos.node.id}->${node.id}`,
        fromId: parentPos.node.id,
        toId: node.id,
        pathD: `M ${parentPos.x.toFixed(1)} ${startY.toFixed(1)} C ${parentPos.x.toFixed(1)} ${midY.toFixed(1)}, ${x.toFixed(1)} ${midY.toFixed(1)}, ${x.toFixed(1)} ${endY.toFixed(1)}`,
      });
    }

    if (node.children.length > 0) {
      const childSpanSum = node.children.reduce((acc, c) => acc + getSpan(c), 0);
      let cursor = xStart;
      const available = xEnd - xStart;
      for (const child of node.children) {
        const share = (getSpan(child) / Math.max(1, childSpanSum)) * available;
        placeNode(child, depth + 1, cursor, cursor + share, pos);
        cursor += share;
      }
    }
  }

  placeNode(root, 0, padX, padX + contentWidth, null);

  return {
    width,
    height,
    maxDepth,
    nodes,
    edges,
  };
}

export function collectAncestryIds(
  nodes: PositionedTreeNode[],
  targetId: string
): Set<string> {
  const byId = new Map(nodes.map((n) => [n.node.id, n]));
  const ids = new Set<string>();
  let cursor = byId.get(targetId);
  while (cursor) {
    ids.add(cursor.node.id);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }
  return ids;
}
