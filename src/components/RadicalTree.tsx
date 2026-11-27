import React, { useEffect, useMemo, useState } from 'react';
import { GitBranch, Volume2 } from 'lucide-react';
import type { KanjiCard } from '../data/curriculumData';
import {
  buildRadicalTreeForKanji,
  collectAncestryIds,
  layoutRadicalTree,
  type RadicalNodeRole,
} from '../utils/radicalTreeLayout';
import { speakJapanese } from '../utils/speechAndPwa';

interface RadicalTreeProps {
  kanji: KanjiCard;
  darkMode: boolean;
  audioSpeed?: number;
}

function truncateLabel(text: string, max = 14): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export const RadicalTree: React.FC<RadicalTreeProps> = ({ kanji, darkMode, audioSpeed = 1.0 }) => {
  const [expandSubRadicals, setExpandSubRadicals] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(`root-${kanji.id}`);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedNodeId(`root-${kanji.id}`);
    setHoveredNodeId(null);
  }, [kanji.id]);

  const treeRoot = useMemo(
    () => buildRadicalTreeForKanji(kanji, expandSubRadicals),
    [kanji, expandSubRadicals]
  );

  const layout = useMemo(() => layoutRadicalTree(treeRoot), [treeRoot]);

  const activeNode = useMemo(() => {
    return (
      layout.nodes.find((n) => n.node.id === selectedNodeId) ??
      layout.nodes[0]
    );
  }, [layout.nodes, selectedNodeId]);

  const highlightTargetId = hoveredNodeId ?? activeNode?.node.id ?? `root-${kanji.id}`;
  const highlightedIds = useMemo(
    () => collectAncestryIds(layout.nodes, highlightTargetId),
    [layout.nodes, highlightTargetId]
  );

  const hasSubRadicals = useMemo(() => {
    const full = buildRadicalTreeForKanji(kanji, true);
    return full.children.some((c) => c.children.length > 0);
  }, [kanji]);

  const getNodeColors = (role: RadicalNodeRole, isSelected: boolean, isHighlighted: boolean) => {
    if (role === 'root') {
      return {
        fill: '#D92525',
        stroke: isSelected ? (darkMode ? '#FDA4AF' : '#7F1D1D') : '#D92525',
        symbolColor: '#FFFFFF',
        labelColor: '#FFE4E6',
        roleColor: '#FECDD3',
      };
    }
    if (role === 'meaning') {
      return {
        fill: darkMode ? '#1F171A' : '#FFF5F5',
        stroke:
          isSelected || isHighlighted
            ? '#D92525'
            : darkMode
            ? '#52343A'
            : '#FECACA',
        symbolColor: darkMode ? '#FDA4AF' : '#B91C1C',
        labelColor: darkMode ? '#F4F3EF' : '#141413',
        roleColor: darkMode ? '#A1A1AA' : '#78716C',
      };
    }
    if (role === 'phonetic') {
      return {
        fill: darkMode ? '#131D29' : '#F0F9FF',
        stroke:
          isSelected || isHighlighted
            ? '#0284C7'
            : darkMode
            ? '#29445C'
            : '#BAE6FD',
        symbolColor: darkMode ? '#7DD3FC' : '#0369A1',
        labelColor: darkMode ? '#F4F3EF' : '#141413',
        roleColor: darkMode ? '#A1A1AA' : '#64748B',
      };
    }
    return {
      fill: darkMode ? '#16181F' : '#FFFFFF',
      stroke:
        isSelected || isHighlighted
          ? '#D92525'
          : darkMode
          ? '#3F3F46'
          : '#D6D3D1',
      symbolColor: darkMode ? '#E4E4E7' : '#292524',
      labelColor: darkMode ? '#F4F3EF' : '#141413',
      roleColor: darkMode ? '#A1A1AA' : '#78716C',
    };
  };

  return (
    <div className="xl:col-span-5 min-w-0 rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-4 sm:p-6 space-y-5">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <GitBranch className="w-4 h-4 text-[#D92525] shrink-0" aria-hidden="true" />
            <h2 className="text-lg font-bold text-[#141413] dark:text-white truncate">
              Radical Breakdown Tree
            </h2>
          </div>

          {hasSubRadicals && (
            <div
              role="tablist"
              aria-label="Radical tree decomposition depth"
              className="inline-flex items-center gap-1 p-1 rounded-lg bg-stone-100 dark:bg-[#101218] border border-stone-200 dark:border-zinc-800 shrink-0"
            >
              <button
                type="button"
                role="tab"
                aria-selected={expandSubRadicals}
                onClick={() => setExpandSubRadicals(true)}
                className={`min-h-[38px] px-3 py-1.5 rounded-md text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  expandSubRadicals
                    ? 'bg-white dark:bg-[#1E2029] text-[#141413] dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-zinc-400 hover:text-[#141413] dark:hover:text-white'
                }`}
              >
                Full Tree
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!expandSubRadicals}
                onClick={() => {
                  setExpandSubRadicals(false);
                  if (activeNode && activeNode.depth > 1) {
                    setSelectedNodeId(`root-${kanji.id}`);
                  }
                }}
                className={`min-h-[38px] px-3 py-1.5 rounded-md text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  !expandSubRadicals
                    ? 'bg-white dark:bg-[#1E2029] text-[#141413] dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-zinc-400 hover:text-[#141413] dark:hover:text-white'
                }`}
              >
                Primary Split
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-stone-500 dark:text-zinc-400">
          Click any radical node to trace its meaning and elementary strokes.
        </p>
      </div>

      {/* Recursive SVG Hierarchical Tree */}
      <div className="rounded-xl bg-stone-50 dark:bg-[#101218] border border-stone-200/80 dark:border-zinc-800 p-3 sm:p-4 space-y-3">
        <svg
          data-testid="radical-tree-svg"
          data-kanji={kanji.kanji}
          data-node-count={layout.nodes.length}
          data-depth={layout.maxDepth}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="w-full h-auto block select-none"
          role="img"
          aria-label={`Recursive radical tree for Kanji ${kanji.kanji} (${kanji.meaning})`}
        >
          {/* Cubic Bézier Branches */}
          <g aria-hidden="true">
            {layout.edges.map((edge) => {
              const isHighlighted =
                highlightedIds.has(edge.fromId) && highlightedIds.has(edge.toId);
              return (
                <path
                  key={edge.id}
                  d={edge.pathD}
                  fill="none"
                  stroke={
                    isHighlighted
                      ? '#D92525'
                      : darkMode
                      ? '#3F3F46'
                      : '#D6D3D1'
                  }
                  strokeWidth={isHighlighted ? 2.4 : 1.5}
                  strokeLinecap="round"
                  className="transition-colors duration-200"
                />
              );
            })}
          </g>

          {/* Positioned Tree Nodes */}
          {layout.nodes.map((item) => {
            const { node, x, y, width, height } = item;
            const isSelected = activeNode?.node.id === node.id;
            const isHighlighted = highlightedIds.has(node.id);
            const colors = getNodeColors(node.role, isSelected, isHighlighted);
            const left = x - width / 2;
            const top = y - height / 2;

            return (
              <g
                key={node.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`${node.symbol} ${node.name} — ${node.meaning} (${node.roleLabel})`}
                data-testid={`radical-node-${node.id}`}
                onClick={() => setSelectedNodeId(node.id)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onFocus={() => setHoveredNodeId(node.id)}
                onBlur={() => setHoveredNodeId(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedNodeId(node.id);
                  }
                }}
                className="cursor-pointer focus:outline-none"
              >
                <rect
                  x={left}
                  y={top}
                  width={width}
                  height={height}
                  rx={12}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isSelected ? 2.4 : 1.4}
                  className="transition-colors duration-150"
                />
                <text
                  x={x}
                  y={top + 31}
                  textAnchor="middle"
                  fill={colors.symbolColor}
                  className="font-jp font-bold"
                  fontSize={node.role === 'root' ? 28 : 24}
                >
                  {node.symbol}
                </text>
                <text
                  x={x}
                  y={top + 48}
                  textAnchor="middle"
                  fill={colors.labelColor}
                  fontWeight={600}
                  fontSize={10.5}
                >
                  {truncateLabel(
                    node.role === 'root' ? node.meaning.split('·')[0].trim() : node.name,
                    14
                  )}
                </text>
                <text
                  x={x}
                  y={top + 62}
                  textAnchor="middle"
                  fill={colors.roleColor}
                  fontSize={9}
                >
                  {truncateLabel(node.roleLabel, 15)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Quiet Inline Legend (No pills, no hue-only reliance) */}
        <div className="pt-2 border-t border-stone-200/70 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-zinc-400">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-[#D92525]" aria-hidden="true" />
              Root Kanji
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-xs border border-rose-400 bg-rose-100 dark:bg-rose-950/60"
                aria-hidden="true"
              />
              Meaning
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-xs border border-sky-400 bg-sky-100 dark:bg-sky-950/60"
                aria-hidden="true"
              />
              Phonetic
            </span>
            {expandSubRadicals && layout.maxDepth >= 2 && (
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-xs border border-stone-400 bg-white dark:bg-[#16181F]"
                  aria-hidden="true"
                />
                Primitive
              </span>
            )}
          </div>
          <span className="font-mono-nums">
            {layout.nodes.length} nodes · {layout.maxDepth + 1} levels
          </span>
        </div>
      </div>

      {/* Selected Node Inspector */}
      {activeNode && (
        <div
          data-testid="radical-node-inspector"
          className="p-4 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/80 dark:border-zinc-800 space-y-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-700 flex items-center justify-center font-jp text-2xl font-bold text-[#D92525] dark:text-rose-400 shrink-0">
                {activeNode.node.symbol}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#141413] dark:text-white truncate">
                  {activeNode.node.role === 'root'
                    ? `${kanji.kanji} · ${kanji.meaning}`
                    : `${activeNode.node.name} · ${activeNode.node.meaning}`}
                </p>
                <p className="text-[11px] font-mono-nums text-stone-500 dark:text-zinc-400">
                  {activeNode.node.roleLabel}
                  {typeof activeNode.node.strokes === 'number'
                    ? ` · ${activeNode.node.strokes} strokes`
                    : ''}
                  {activeNode.node.children.length > 0
                    ? ` · ${activeNode.node.children.length} components`
                    : ' · Atomic unit'}
                </p>
              </div>
            </div>

            {activeNode.node.role === 'root' && (
              <button
                type="button"
                data-testid="radical-tree-speak-btn"
                onClick={() => speakJapanese(kanji.kanji, audioSpeed)}
                aria-label={`Pronounce ${kanji.kanji}`}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#16181F] text-xs font-medium text-stone-700 dark:text-zinc-200 hover:border-[#D92525] cursor-pointer shrink-0"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
                Speak
              </button>
            )}
          </div>
          <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
            {activeNode.node.note}
          </p>
        </div>
      )}

      <div className="p-4 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-[#D92525]/25 text-xs text-stone-700 dark:text-zinc-300 leading-relaxed">
        <strong className="text-[#141413] dark:text-white">Mnemonic Story: </strong>
        {kanji.combinationStory}
      </div>
    </div>
  );
};
