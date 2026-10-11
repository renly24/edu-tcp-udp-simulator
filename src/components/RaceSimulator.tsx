"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import ReplayIcon from "@mui/icons-material/Replay";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import { ACK_COLOR, CIRCLED, LOST_COLOR, MESSAGE, PROTO, SYN_COLOR, type MsgKind } from "@/lib/model";
import { deliveredAt, simulateTcp, simulateUdp, type Flight, type PacketFate, type SimResult } from "@/lib/simulate";

// ---------- 体験問題：TCP と UDP で同時に送る ----------

/** 時刻 1（片道）あたりの再生秒数 */
const SEC_PER_UNIT = 1.1;

const KIND_COLOR: Record<MsgKind, string> = { syn: SYN_COLOR, ack: ACK_COLOR, data: PROTO.tcp.color, udp: PROTO.udp.color };

const FATE_NEXT: Record<PacketFate, PacketFate> = { ok: "lost", lost: "late", late: "ok" };
const FATE_LABEL: Record<PacketFate, string> = { ok: "届く", lost: "消える", late: "遅れる" };

const PRESETS: { label: string; fates: PacketFate[] }[] = [
  { label: "全部届く", fates: ["ok", "ok", "ok", "ok", "ok", "ok"] },
  { label: "③が消える", fates: ["ok", "ok", "lost", "ok", "ok", "ok"] },
  { label: "②が遅れる", fates: ["ok", "late", "ok", "ok", "ok", "ok"] },
  { label: "いろいろ起きる", fates: ["ok", "late", "ok", "lost", "ok", "lost"] },
];

const TASKS: { label: string; test: (f: PacketFate[]) => boolean }[] = [
  { label: "全部届く設定で送る", test: (f) => f.every((x) => x === "ok") },
  { label: "どれか1つを「消える」にして送る", test: (f) => f.includes("lost") },
  { label: "どれか1つを「遅れる」にして送る", test: (f) => f.includes("late") },
];

function fmt(t: number) {
  return t.toFixed(1);
}

function FlightBox({ f, t }: { f: Flight; t: number }) {
  const lostAt = f.t0 + 0.5;
  if (t < f.t0) return null;
  if (!f.lost && t > f.t1) return null;
  const progress = f.lost ? Math.min(t, lostAt) - f.t0 : t - f.t0;
  const frac = Math.min(1, progress / (f.t1 - f.t0));
  const pos = f.dir === "right" ? frac : 1 - frac;
  const vanished = f.lost && t >= lostAt;
  const color = KIND_COLOR[f.kind];
  return (
    <Box
      sx={{
        position: "absolute",
        top: f.dir === "right" ? 4 : 42,
        left: `calc(${pos} * (100% - 56px))`,
        width: 56,
        height: 26,
        borderRadius: 1,
        bgcolor: vanished ? "transparent" : color,
        border: vanished ? `2px dashed ${LOST_COLOR}` : f.resend ? "2px solid #ffeb3b" : "none",
        color: vanished ? LOST_COLOR : "#fff",
        fontSize: "0.72rem",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "nowrap",
        boxShadow: vanished ? 0 : 2,
        zIndex: vanished ? 0 : 1,
      }}
    >
      {vanished ? `✕ ${f.label}` : f.resend ? `再${f.label}` : f.label}
    </Box>
  );
}

function Lane({ sim, t }: { sim: SimResult; t: number }) {
  const p = PROTO[sim.proto];
  const { delivered, buffered } = deliveredAt(sim, t);
  const finished = t >= sim.end;
  const sent = sim.flights.filter((f) => f.t0 <= t).length;
  const missing = MESSAGE.length - sim.arrivals.length;
  const inOrder = sim.arrivals.every((a, i) => i === 0 || a.piece > sim.arrivals[i - 1].piece);

  return (
    <Box sx={{ p: 1, borderRadius: 2, border: 2, borderColor: p.color, bgcolor: p.bg }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={0.5}>
        <Typography fontWeight={700} sx={{ color: p.color }}>
          {p.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
          やりとりしたパケット {sent} 個
        </Typography>
      </Stack>
      <Box sx={{ display: "flex", alignItems: "stretch", gap: 0.5 }}>
        <Box sx={{ width: { xs: 40, sm: 56 }, flexShrink: 0, textAlign: "center", bgcolor: "#fff", borderRadius: 1.5, border: "1px solid #cfd8dc", py: 0.5 }}>
          <Typography sx={{ fontSize: "1.4rem", lineHeight: 1.2 }}>📱</Typography>
          <Typography sx={{ fontSize: "0.6rem", fontWeight: 700 }}>送信側</Typography>
        </Box>
        <Box sx={{ position: "relative", flex: 1, minWidth: 0, height: 72 }}>
          <Box sx={{ position: "absolute", top: 16, left: 0, right: 0, height: 2, bgcolor: "#b0bec5" }} />
          <Box sx={{ position: "absolute", top: 54, left: 0, right: 0, height: 2, bgcolor: "#b0bec5" }} />
          {sim.flights.map((f) => (
            <FlightBox key={f.key} f={f} t={t} />
          ))}
        </Box>
        <Box sx={{ width: { xs: 40, sm: 56 }, flexShrink: 0, textAlign: "center", bgcolor: "#fff", borderRadius: 1.5, border: "1px solid #cfd8dc", py: 0.5 }}>
          <Typography sx={{ fontSize: "1.4rem", lineHeight: 1.2 }}>🖥️</Typography>
          <Typography sx={{ fontSize: "0.6rem", fontWeight: 700 }}>受信側</Typography>
        </Box>
      </Box>
      <Stack direction="row" alignItems="center" spacing={0.75} mt={0.75} flexWrap="wrap" useFlexGap>
        <Typography variant="caption" fontWeight={700}>
          📥 アプリに渡したデータ
        </Typography>
        <Stack direction="row" spacing={0.25}>
          {delivered.map((piece, i) => (
            <Box
              key={i}
              sx={{ width: 24, height: 26, borderRadius: 0.5, bgcolor: "#fff", border: `2px solid ${p.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}
            >
              {MESSAGE[piece]}
            </Box>
          ))}
          {delivered.length === 0 && <Box sx={{ height: 26 }} />}
        </Stack>
        {buffered.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            保管中：{buffered.map((b) => CIRCLED[b]).join("")}
          </Typography>
        )}
      </Stack>
      <Typography variant="body2" fontWeight={700} mt={0.5} sx={{ minHeight: 22, color: finished ? (sim.proto === "tcp" || (missing === 0 && inOrder) ? "success.dark" : LOST_COLOR) : "text.secondary" }}>
        {finished
          ? sim.proto === "tcp"
            ? `時間 ${fmt(sim.done)} で全部そろった！（正しく「${MESSAGE.join("")}」）`
            : missing === 0 && inOrder
              ? `時間 ${fmt(sim.done)} で全部届いた！（「${MESSAGE.join("")}」）`
              : `時間 ${fmt(sim.done)} で終わり。${missing > 0 ? `${missing}文字欠けた` : ""}${missing > 0 && !inOrder ? "うえに、" : ""}${!inOrder ? "順番が入れ替わった" : ""}`
          : t > 0
            ? "送信中…"
            : ""}
      </Typography>
    </Box>
  );
}

export default function RaceSimulator() {
  const [fates, setFates] = useState<PacketFate[]>(PRESETS[1].fates);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState<boolean[]>(TASKS.map(() => false));
  const tcp = useMemo(() => simulateTcp(fates), [fates]);
  const udp = useMemo(() => simulateUdp(fates), [fates]);
  const end = Math.max(tcp.end, udp.end);
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let now = t;
    const tick = (ms: number) => {
      const dt = last.current === null ? 0 : (ms - last.current) / 1000 / SEC_PER_UNIT;
      last.current = ms;
      now = Math.min(end, now + dt);
      setT(now);
      if (now >= end) {
        // 最後まで再生したら止めて、やってみようの項目に印を付ける
        setPlaying(false);
        setDone((prev) => prev.map((d, i) => d || TASKS[i].test(fates)));
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      last.current = null;
    };
    // 再生中の t はこの中で進めるので、依存に入れない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, end, fates]);

  const changeFates = (next: PacketFate[]) => {
    setFates(next);
    setPlaying(false);
    setT(0);
  };

  const finished = t >= end;

  return (
    <Stack spacing={1.25}>
      <Paper variant="outlined" sx={{ p: 1 }}>
        <Typography variant="body2" fontWeight={700} mb={0.5}>
          ⚙️ 送るパケット（タップで「届く → 消える → 遅れる」を切りかえ）
        </Typography>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap mb={0.75}>
          {MESSAGE.map((ch, i) => (
            <Button
              key={i}
              size="small"
              variant={fates[i] === "ok" ? "outlined" : "contained"}
              color={fates[i] === "lost" ? "error" : fates[i] === "late" ? "warning" : "primary"}
              onClick={() => changeFates(fates.map((f, j) => (j === i ? FATE_NEXT[f] : f)))}
              sx={{ minWidth: 0, px: 1, flexDirection: "column", lineHeight: 1.2, fontWeight: 700 }}
            >
              <span>
                {CIRCLED[i]}
                {ch}
              </span>
              <Box component="span" sx={{ fontSize: "0.65rem" }}>
                {FATE_LABEL[fates[i]]}
              </Box>
            </Button>
          ))}
        </Stack>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {PRESETS.map((pr) => (
            <Chip key={pr.label} label={pr.label} size="small" variant="outlined" onClick={() => changeFates(pr.fates)} />
          ))}
        </Stack>
      </Paper>

      <Stack direction="row" spacing={1} alignItems="center">
        {playing ? (
          <Button variant="contained" startIcon={<PauseIcon />} onClick={() => setPlaying(false)}>
            一時停止
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={finished ? <ReplayIcon /> : <PlayArrowIcon />}
            onClick={() => {
              if (finished) setT(0);
              setPlaying(true);
            }}
          >
            {finished ? "もう一度送る" : t > 0 ? "続きを送る" : "送信スタート"}
          </Button>
        )}
        {t > 0 && !finished && !playing && (
          <Button variant="outlined" onClick={() => setT(0)}>
            最初に戻す
          </Button>
        )}
        <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums", ml: "auto !important" }}>
          時間 <b>{fmt(t)}</b>
        </Typography>
      </Stack>

      <Lane sim={tcp} t={t} />
      <Lane sim={udp} t={t} />

      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        {(
          [
            [PROTO.tcp.color, "データ（TCP）"],
            [PROTO.udp.color, "データ（UDP）"],
            [SYN_COLOR, "SYN・SYN+ACK"],
            [ACK_COLOR, "ACK"],
          ] as [string, string][]
        ).map(([c, l]) => (
          <Stack key={l} direction="row" spacing={0.5} alignItems="center">
            <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: c }} />
            <Typography variant="caption">{l}</Typography>
          </Stack>
        ))}
        <Typography variant="caption" color="text.secondary">
          時間 1 ＝ パケットが片道届くまでの時間
        </Typography>
      </Stack>

      <Paper variant="outlined" sx={{ p: 1, bgcolor: "#fffde7" }}>
        <Typography variant="body2" fontWeight={700} mb={0.25}>
          ✏️ やってみよう（最後まで送ると ✔ が付きます）
        </Typography>
        {TASKS.map((task, i) => (
          <Stack key={task.label} direction="row" spacing={0.5} alignItems="center">
            {done[i] ? <CheckBoxIcon color="success" fontSize="small" /> : <CheckBoxOutlineBlankIcon color="disabled" fontSize="small" />}
            <Typography variant="body2">{task.label}</Typography>
          </Stack>
        ))}
        {done.every(Boolean) && (
          <Typography variant="body2" fontWeight={700} mt={0.5} color="success.dark">
            どの場合も先に終わるのは UDP。でも、消えたり遅れたりしても正しくそろうのは TCP だけですね。
          </Typography>
        )}
      </Paper>
    </Stack>
  );
}
