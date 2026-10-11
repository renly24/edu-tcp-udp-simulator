"use client";
import { type CSSProperties, type ReactNode, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ReplayIcon from "@mui/icons-material/Replay";
import { PROTO } from "@/lib/model";
import type { Flow, FlowItem } from "@/lib/flow";

// ---------- 送受信の図（教科書の図と同じ形で、1つずつ進める） ----------

const W = 400;
const L = 150;
const R = 300;
const CELL = 20;
const PACKET = 22;
const DATA_COLOR = "#2f6fbf";
const OK_COLOR = "#e25d58";
const CELL_COLOR = "#e3ebb5";
const CALLOUT_COLOR = "#d4eaf7";
/** 線を引く秒数 */
const DRAW = 0.8;

function timing(delay: number, dur = 0.25, extra?: Record<string, string>): CSSProperties {
  return { "--delay": `${delay}s`, "--dur": `${dur}s`, ...extra } as CSSProperties;
}

function Laptop({ x, label }: { x: number; label: string }) {
  return (
    <g>
      <rect x={x - 34} y={6} width={68} height={40} rx={4} fill="#fff" stroke="#546e7a" strokeWidth={3} />
      <text x={x} y={31} textAnchor="middle" fontSize={13} fontWeight={700} fill="#263238">
        {label}
      </text>
      <path d={`M ${x - 40} 48 L ${x + 40} 48 L ${x + 46} 56 L ${x - 46} 56 Z`} fill="#90a4ae" stroke="#546e7a" strokeWidth={2} />
    </g>
  );
}

function Buffer({ x, y, filled }: { x: number; y: number; filled: number[] }) {
  return (
    <g>
      {[1, 2, 3].map((n, i) => (
        <g key={n}>
          <rect x={x + i * CELL} y={y - CELL / 2} width={CELL} height={CELL} fill={filled.includes(n) ? CELL_COLOR : "#fff"} stroke="#455a64" strokeWidth={1.5} />
          <text x={x + i * CELL + CELL / 2} y={y + 5} textAnchor="middle" fontSize={12} fontWeight={700} fill="#263238">
            {n}
          </text>
        </g>
      ))}
    </g>
  );
}

function Arrowhead({ x, y, dir, color, className, style }: { x: number; y: number; dir: 1 | -1; color: string; className?: string; style?: CSSProperties }) {
  return <polygon className={className} style={style} points={`${x},${y} ${x - dir * 11},${y - 6} ${x - dir * 9},${y + 5}`} fill={color} />;
}

/** 図の部品を1つかく。animate のときはアニメーションで現れる */
function Item({ item, at, animate }: { item: FlowItem; at: number; animate: boolean }) {
  const cls = (name: string) => (animate ? name : undefined);
  switch (item.kind) {
    case "buffer": {
      const x = item.side === "sender" ? L - 16 - CELL * 3 : R + 16;
      return (
        <g className={cls("pop")} style={timing(at)}>
          <Buffer x={x} y={item.y} filled={item.filled} />
        </g>
      );
    }
    case "packet": {
      const frac = item.lost ? 0.75 : 1;
      const xe = L + (R - L) * frac;
      const ye = item.y0 + (item.y1 - item.y0) * frac;
      const mx = (L + R) / 2;
      const my = (item.y0 + item.y1) / 2;
      return (
        <g>
          <path
            className={cls("draw")}
            style={timing(at, DRAW * frac)}
            pathLength={1}
            d={`M ${L} ${item.y0} L ${xe} ${ye}`}
            stroke={DATA_COLOR}
            strokeWidth={2.5}
            fill="none"
          />
          {item.lost ? (
            <g className={cls("pop")} style={timing(at + DRAW * frac)}>
              <text x={xe} y={ye + 8} textAnchor="middle" fontSize={24} fontWeight={700} fill="#212121">
                ✕
              </text>
              <text x={xe + 8} y={ye - 12} textAnchor="middle" fontSize={11} fontWeight={700} fill="#212121">
                エラー
              </text>
            </g>
          ) : (
            <Arrowhead x={xe} y={ye} dir={1} color={DATA_COLOR} className={cls("pop")} style={timing(at + DRAW)} />
          )}
          {/* 番号の付いたデータが、線に沿って真ん中まで進む */}
          <g className={cls("move")} style={timing(at, DRAW / 2, { "--fx": `${L - mx}px`, "--fy": `${item.y0 - my}px` })}>
            <rect x={mx - PACKET / 2} y={my - PACKET / 2} width={PACKET} height={PACKET} fill={CELL_COLOR} stroke="#455a64" strokeWidth={1.5} />
            <text x={mx} y={my + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill="#263238">
              {item.no}
            </text>
          </g>
        </g>
      );
    }
    case "ok": {
      const mx = (L + R) / 2;
      const my = (item.y0 + item.y1) / 2;
      return (
        <g>
          <path className={cls("draw")} style={timing(at, DRAW)} pathLength={1} d={`M ${R} ${item.y0} L ${L} ${item.y1}`} stroke={OK_COLOR} strokeWidth={2.5} fill="none" />
          <Arrowhead x={L} y={item.y1} dir={-1} color={OK_COLOR} className={cls("pop")} style={timing(at + DRAW)} />
          <text
            className={cls("pop")}
            style={timing(at + DRAW / 2)}
            x={mx}
            y={my - 7}
            textAnchor="middle"
            fontSize={13}
            fontWeight={700}
            fill={OK_COLOR}
            stroke="#fff"
            strokeWidth={4}
            paintOrder="stroke"
          >
            OK！
          </text>
        </g>
      );
    }
    case "callout": {
      const h = 14 + item.lines.length * 15;
      return (
        <g className={cls("pop")} style={timing(at)}>
          <rect x={14} y={item.y - h / 2} width={124} height={h} rx={4} fill={CALLOUT_COLOR} />
          <text x={22} y={item.y - h / 2 + 18} fontSize={12} fontWeight={700} fill="#263238">
            {item.lines.map((line, i) => (
              <tspan key={i} x={22} dy={i === 0 ? 0 : 15}>
                {line}
              </tspan>
            ))}
          </text>
        </g>
      );
    }
  }
}

export default function FlowDiagram({ flow }: { flow: Flow }) {
  const [step, setStep] = useState(0);
  /** 進めたときだけ、新しく現れた部品をアニメーションさせる */
  const [animate, setAnimate] = useState(true);
  const p = PROTO[flow.proto];
  const total = flow.steps.length;

  const go = (next: number, anim: boolean) => {
    setStep(Math.max(0, Math.min(total, next)));
    setAnimate(anim);
  };

  const parts: ReactNode[] = [];
  flow.steps.slice(0, step).forEach((s, si) =>
    s.items.forEach((item, ii) => parts.push(<Item key={`${si}-${ii}`} item={item} at={item.at ?? 0} animate={animate && si === step - 1} />)),
  );

  return (
    <Stack spacing={1} sx={{ minWidth: 0 }}>
      <Typography fontWeight={700} sx={{ color: p.color }}>
        {flow.caption}
      </Typography>
      <Box
        component="svg"
        className="seq-anim"
        viewBox={`0 0 ${W} ${flow.end}`}
        role="img"
        aria-label={`${flow.caption}の図`}
        sx={{ width: "100%", maxWidth: 520, mx: "auto", height: "auto", display: "block", bgcolor: "#fff", borderRadius: 2, border: "1px solid #e0e0e0" }}
      >
        <Laptop x={L} label="送信側" />
        <Laptop x={R} label="受信側" />
        {[L, R].map((x) => (
          <line key={x} x1={x} y1={58} x2={x} y2={flow.end - 6} stroke="#bdbdbd" strokeWidth={3} />
        ))}
        {parts}
      </Box>
      <Paper variant="outlined" sx={{ p: 1, minHeight: 72, bgcolor: p.bg, borderColor: p.color }}>
        <Typography variant="caption" fontWeight={700} sx={{ color: p.color }}>
          {step === 0 ? "はじめ" : `ステップ ${step} / ${total}`}
        </Typography>
        <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.7 }} aria-live="polite">
          {step === 0 ? flow.intro : flow.steps[step - 1].text}
        </Typography>
      </Paper>
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
        <Button size="small" variant="outlined" startIcon={<NavigateBeforeIcon />} disabled={step === 0} onClick={() => go(step - 1, false)}>
          1つ戻る
        </Button>
        <Button size="small" variant="contained" endIcon={<NavigateNextIcon />} disabled={step === total} onClick={() => go(step + 1, true)}>
          1つ進める
        </Button>
        {step === total ? (
          <Button size="small" startIcon={<ReplayIcon />} onClick={() => go(0, true)}>
            最初から
          </Button>
        ) : (
          <Button size="small" onClick={() => go(total, false)}>
            すべて表示
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
