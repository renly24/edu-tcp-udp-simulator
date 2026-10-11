"use client";
import { type CSSProperties, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ReplayIcon from "@mui/icons-material/Replay";
import { ACK_COLOR, LOST_COLOR, PROTO, SYN_COLOR, type MsgKind, type Scenario } from "@/lib/model";

// ---------- 時間の流れ図（シーケンス図） ----------
// 左右の縦線が機器、上から下へ時間が進む。斜めの矢印がパケット。

const W = 460;
const LEFT_X = 130;
const RIGHT_X = 330;
const TOP = 52;
/** 時刻 1 あたりの高さ */
const UNIT = 58;
/** 時刻 1 あたりのアニメーションの秒数 */
const SEC = 0.9;

const KIND_COLOR: Record<MsgKind, string> = {
  syn: SYN_COLOR,
  ack: ACK_COLOR,
  data: PROTO.tcp.color,
  udp: PROTO.udp.color,
};

const y = (t: number) => TOP + t * UNIT;

function timing(start: number, dur = 0.25): CSSProperties {
  return { "--delay": `${start * SEC}s`, "--dur": `${dur * SEC}s` } as CSSProperties;
}

interface Props {
  scenario: Scenario;
  /** この時刻から再生を始める（それより前の矢印は最初から表示しておく） */
  from?: number;
  /** 再生ボタンを出さない */
  hideReplay?: boolean;
}

export default function SequenceDiagram({ scenario, from = 0, hideReplay }: Props) {
  const [run, setRun] = useState(0);
  const { proto, caption, left, right, messages, notes = [], end } = scenario;
  const p = PROTO[proto];
  const height = y(end) + 8;

  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
        <Typography fontWeight={700} sx={{ color: p.color, fontSize: { xs: "0.85rem", sm: "0.95rem" } }}>
          {caption}
        </Typography>
        {!hideReplay && (
          <Button size="small" startIcon={<ReplayIcon />} onClick={() => setRun(run + 1)} sx={{ flexShrink: 0 }}>
            もう一度
          </Button>
        )}
      </Stack>
      <Box
        key={run}
        component="svg"
        className="seq-anim"
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-label={`${caption}の時間の流れ図`}
        sx={{ width: "100%", height: "auto", display: "block", bgcolor: p.bg, borderRadius: 2 }}
      >
        {/* 機器と時間の軸 */}
        {[
          [LEFT_X, left],
          [RIGHT_X, right],
        ].map(([x, name]) => (
          <g key={name}>
            <rect x={(x as number) - 62} y={8} width={124} height={26} rx={6} fill="#fff" stroke="#90a4ae" />
            <text x={x} y={26} textAnchor="middle" fontSize={14} fontWeight={700} fill="#263238">
              {name}
            </text>
            <line x1={x} y1={34} x2={x} y2={height - 4} stroke="#78909c" strokeWidth={2} strokeDasharray="5 4" />
          </g>
        ))}
        <text x={8} y={height - 10} fontSize={11} fill="#78909c">
          時間 ↓
        </text>

        {/* パケット */}
        {messages.map((m, i) => {
          const d = m.d ?? 1;
          const x0 = m.from === "left" ? LEFT_X : RIGHT_X;
          const x1 = m.from === "left" ? RIGHT_X : LEFT_X;
          const frac = m.lost ? 0.42 : 1;
          const xe = x0 + (x1 - x0) * frac;
          const ye = y(m.t) + (y(m.t + d) - y(m.t)) * frac;
          const color = KIND_COLOR[m.kind];
          const start = m.t - from;
          const dir = Math.sign(x1 - x0);
          // すれ違う矢印のラベルが重ならないよう、送った側に寄せて書く（遅れる矢印はさらに寄せる）
          const lf = m.lost ? 0.16 : 0.32 / d;
          const lx = x0 + (x1 - x0) * lf;
          const ly = y(m.t) + (y(m.t + d) - y(m.t)) * lf;
          return (
            <g key={i}>
              <path
                className="draw"
                pathLength={1}
                d={`M ${x0} ${y(m.t)} L ${xe} ${ye}`}
                stroke={color}
                strokeWidth={3}
                strokeLinecap="round"
                fill="none"
                style={timing(start, d * frac)}
              />
              {m.lost ? (
                <text className="pop" x={xe} y={ye + 9} textAnchor="middle" fontSize={26} fontWeight={700} fill={LOST_COLOR} style={timing(start + d * frac)}>
                  <title>消えた</title>✕
                </text>
              ) : (
                <polygon
                  className="pop"
                  points={`${xe},${ye} ${xe - dir * 12},${ye - 7} ${xe - dir * 10},${ye + 5}`}
                  fill={color}
                  style={timing(start + d)}
                />
              )}
              <text
                className="pop"
                x={lx}
                y={ly - 6}
                textAnchor="middle"
                fontSize={13}
                fontWeight={700}
                fill={color}
                stroke="#fff"
                strokeWidth={4}
                paintOrder="stroke"
                style={timing(start + d * 0.2)}
              >
                {m.label}
              </text>
            </g>
          );
        })}

        {/* 機器の横のメモ */}
        {notes.map((n, i) => {
          const isLeft = n.side === "left";
          const x = isLeft ? LEFT_X - 8 : RIGHT_X + 8;
          return (
            <text
              key={i}
              className="pop"
              x={x}
              y={y(n.t) + 4}
              textAnchor={isLeft ? "end" : "start"}
              fontSize={12}
              fontWeight={700}
              fill={n.alert ? LOST_COLOR : "#37474f"}
              style={timing(n.t - from)}
            >
              {n.text.split("\n").map((line, j) => (
                <tspan key={j} x={x} dy={j === 0 ? 0 : 15}>
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}
      </Box>
    </Box>
  );
}
