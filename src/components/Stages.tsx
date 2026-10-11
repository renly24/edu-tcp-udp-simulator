"use client";
import { type CSSProperties, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ReplayIcon from "@mui/icons-material/Replay";
import { LOST_COLOR, PROTO, TCP_HEADER, UDP_HEADER, type HeaderField, type Proto } from "@/lib/model";

// ---------- 第1章：TCP と UDP の紹介 ----------

const LAYERS = [
  { name: "アプリケーション層", note: "HTTP・メール・通話アプリなど", color: "#1e88e5" },
  { name: "トランスポート層", note: "", color: "#455a64" },
  { name: "インターネット層", note: "IP", color: "#fb8c00" },
  { name: "ネットワークインタフェース層", note: "イーサネット・Wi-Fi", color: "#8e24aa" },
];

const INTRO: Record<Proto, { icon: string; like: string; items: string[] }> = {
  tcp: {
    icon: "🤝",
    like: "電話・書留郵便のイメージ",
    items: ["相手とつながりを作ってから送る", "届いたら「受け取りました」と返事（ACK）", "届かなければ送り直す・順番も直す"],
  },
  udp: {
    icon: "📣",
    like: "放送・はがきのイメージ",
    items: ["つながりを作らず、いきなり送る", "届いたかどうか確認しない", "消えても送り直さない・順番もそのまま"],
  },
};

export function IntroStage() {
  return (
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        {LAYERS.map((l) =>
          l.name === "トランスポート層" ? (
            <Box key={l.name} sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.5 }}>
              {(["tcp", "udp"] as Proto[]).map((p) => (
                <Box key={p} sx={{ border: 3, borderColor: PROTO[p].color, bgcolor: PROTO[p].color, color: "#fff", borderRadius: 2, px: 1, py: 0.5, textAlign: "center" }}>
                  <Typography fontWeight={700} sx={{ fontSize: "0.85rem" }}>
                    トランスポート層：{PROTO[p].name}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Box key={l.name} sx={{ border: 2, borderColor: l.color, borderRadius: 2, px: 1, py: 0.4, display: "flex", justifyContent: "space-between", gap: 1, opacity: 0.75 }}>
              <Typography fontWeight={700} sx={{ fontSize: "0.8rem", color: l.color }}>
                {l.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {l.note}
              </Typography>
            </Box>
          ),
        )}
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
        {(["tcp", "udp"] as Proto[]).map((p) => (
          <Box key={p} sx={{ border: 2, borderColor: PROTO[p].color, bgcolor: PROTO[p].bg, borderRadius: 3, p: 1.5 }}>
            <Typography sx={{ fontSize: "2rem", lineHeight: 1 }}>{INTRO[p].icon}</Typography>
            <Typography fontWeight={700} sx={{ color: PROTO[p].color, fontSize: "1.2rem" }}>
              {PROTO[p].name}：{PROTO[p].catch}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
              {INTRO[p].like}
            </Typography>
            <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2.5 }}>
              {INTRO[p].items.map((t) => (
                <Typography key={t} component="li" variant="body2" fontWeight={600}>
                  {t}
                </Typography>
              ))}
            </Stack>
          </Box>
        ))}
      </Box>
    </Stack>
  );
}

// ---------- 第1章：ヘッダの比較 ----------

/** 項目を 32 ビットずつの行に分ける */
function toRows(fields: HeaderField[]) {
  const rows: HeaderField[][] = [[]];
  let used = 0;
  for (const f of fields) {
    if (used + f.bits > 32) {
      rows.push([]);
      used = 0;
    }
    rows[rows.length - 1].push(f);
    used += f.bits;
  }
  return rows;
}

function HeaderBlock({ proto, fields }: { proto: Proto; fields: HeaderField[] }) {
  const p = PROTO[proto];
  const bytes = fields.reduce((n, f) => n + f.bits, 0) / 8;
  return (
    <Box>
      <Stack direction="row" alignItems="baseline" spacing={1} mb={0.5}>
        <Typography fontWeight={700} sx={{ color: p.color }}>
          {p.name}ヘッダ
        </Typography>
        <Typography variant="body2" fontWeight={700}>
          {bytes} バイト{proto === "tcp" ? "〜" : ""}
        </Typography>
      </Stack>
      <Stack spacing={0.5}>
        {toRows(fields).map((row, i) => (
          <Box key={i} sx={{ display: "flex", gap: 0.5, height: 40 }}>
            {row.map((f) => (
              <Box
                key={f.name}
                sx={{
                  flex: `${f.bits} 0 0`,
                  minWidth: 0,
                  borderRadius: 1,
                  border: 2,
                  borderColor: p.color,
                  bgcolor: f.only ? p.color : "#fff",
                  color: f.only ? "#fff" : "text.primary",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  px: 0.25,
                }}
              >
                <Typography sx={{ fontSize: { xs: "0.6rem", sm: "0.72rem" }, fontWeight: 700, lineHeight: 1.2 }}>{f.name}</Typography>
              </Box>
            ))}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

export function HeaderStage() {
  return (
    <Stack spacing={2}>
      <Typography variant="caption" color="text.secondary">
        1行が 32 ビット（4 バイト）です。
      </Typography>
      <HeaderBlock proto="tcp" fields={TCP_HEADER} />
      <HeaderBlock proto="udp" fields={UDP_HEADER} />
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: PROTO.tcp.color }} />
          <Typography variant="caption">TCP にしかない項目</Typography>
        </Stack>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box sx={{ width: 14, height: 14, borderRadius: 0.5, border: 2, borderColor: "#90a4ae" }} />
          <Typography variant="caption">どちらにもある項目</Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}

// ---------- 第4章：ビデオ通話で 1コマ消えたとき ----------

const FACES = ["😀", "😃", "😄", "😁", "😆", "😊", "🙂", "😉"];
const LOST_FRAME = 3;
/** 1コマあたりのアニメーションの秒数 */
const FRAME_SEC = 0.45;

type Cell = { kind: "frame"; no: number } | { kind: "glitch"; no: number } | { kind: "wait" };

const STREAM_ROWS: { proto: Proto; cells: Cell[]; result: string }[] = [
  {
    proto: "tcp",
    cells: [
      ...FACES.slice(0, LOST_FRAME).map((_, i): Cell => ({ kind: "frame", no: i })),
      { kind: "wait" },
      { kind: "wait" },
      ...FACES.slice(LOST_FRAME).map((_, i): Cell => ({ kind: "frame", no: LOST_FRAME + i })),
    ],
    result: "④の再送を待つ間、映像が止まる。ぜんぶ見られるが、2コマ分遅れて終わる",
  },
  {
    proto: "udp",
    cells: FACES.map((_, i): Cell => (i === LOST_FRAME ? { kind: "glitch", no: i } : { kind: "frame", no: i })),
    result: "④のところで一瞬乱れるだけ。映像は止まらず、時間どおりに終わる",
  },
];
const SLOTS = Math.max(...STREAM_ROWS.map((r) => r.cells.length));

export function StreamStage() {
  const [run, setRun] = useState(0);
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" fontWeight={700}>
          📹 相手の画面に映るコマ（④が途中で消えた）
        </Typography>
        <Button size="small" startIcon={<ReplayIcon />} onClick={() => setRun(run + 1)}>
          もう一度
        </Button>
      </Stack>
      <Box key={run} className="seq-anim">
        {STREAM_ROWS.map((row) => {
          const p = PROTO[row.proto];
          return (
            <Box key={row.proto} sx={{ mb: 1.5, p: 1, borderRadius: 2, bgcolor: p.bg, border: 2, borderColor: p.color }}>
              <Typography fontWeight={700} sx={{ color: p.color, mb: 0.5 }}>
                {p.name}
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${SLOTS}, minmax(0, 1fr))`, gap: { xs: 0.25, sm: 0.5 } }}>
                {row.cells.map((c, i) => (
                  <Box
                    key={i}
                    className="pop"
                    style={{ "--delay": `${i * FRAME_SEC}s` } as CSSProperties}
                    sx={{
                      aspectRatio: "4 / 3",
                      borderRadius: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: c.kind === "frame" ? "#263238" : c.kind === "glitch" ? "#90a4ae" : "#fff",
                      backgroundImage:
                        c.kind === "glitch" ? "repeating-linear-gradient(0deg, #b0bec5 0 3px, #607d8b 3px 6px)" : undefined,
                      border: c.kind === "wait" ? `2px dashed ${LOST_COLOR}` : "none",
                      color: "#fff",
                    }}
                  >
                    <Typography sx={{ fontSize: { xs: "0.9rem", sm: "1.3rem" }, lineHeight: 1 }}>
                      {c.kind === "frame" ? FACES[c.no] : c.kind === "glitch" ? "⚡" : "⏳"}
                    </Typography>
                    <Typography sx={{ fontSize: { xs: "0.5rem", sm: "0.62rem" }, fontWeight: 700, color: c.kind === "wait" ? LOST_COLOR : "#fff" }}>
                      {c.kind === "wait" ? "待ち" : `${"①②③④⑤⑥⑦⑧"[c.no]}`}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Typography variant="body2" fontWeight={600} mt={0.75}>
                {row.result}
              </Typography>
            </Box>
          );
        })}
        <Typography variant="caption" color="text.secondary" display="block" textAlign="right">
          時間 →
        </Typography>
      </Box>
    </Stack>
  );
}

// ---------- 第5章：TCP と UDP の比較表 ----------

export function ProtocolTable() {
  const rows: [string, string, string][] = [
    ["つながり（コネクション）", "作る（3ウェイハンドシェイク）", "作らない"],
    ["届いたかの確認", "する（ACK）", "しない"],
    ["消えたパケット", "再送する", "そのまま（欠ける）"],
    ["順番の入れ替わり", "並べ替える（シーケンス番号）", "そのまま"],
    ["ヘッダの大きさ", "20 バイト〜", "8 バイト"],
    ["速さ", "確認や再送を待つ分だけ遅い", "待たないので速い"],
    ["向いている通信", "Web・メール・ファイル・支払い", "通話・ゲーム・ライブ中継"],
  ];
  const cell = { border: "1px solid #cfd8dc", px: 1, py: 0.75, fontSize: { xs: "0.75rem", sm: "0.85rem" }, textAlign: "left" as const };
  return (
    <Box component="table" sx={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr>
          <Box component="th" sx={{ ...cell, bgcolor: "#eceff1" }} />
          {(["tcp", "udp"] as Proto[]).map((p) => (
            <Box key={p} component="th" sx={{ ...cell, bgcolor: PROTO[p].color, color: "#fff", width: "38%" }}>
              {PROTO[p].name}（{PROTO[p].catch}）
            </Box>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([k, t, u]) => (
          <tr key={k}>
            <Box component="th" sx={{ ...cell, bgcolor: "#f5f7fa", fontWeight: 700 }}>
              {k}
            </Box>
            <Box component="td" sx={{ ...cell, bgcolor: PROTO.tcp.bg }}>
              {t}
            </Box>
            <Box component="td" sx={{ ...cell, bgcolor: PROTO.udp.bg }}>
              {u}
            </Box>
          </tr>
        ))}
      </tbody>
    </Box>
  );
}
