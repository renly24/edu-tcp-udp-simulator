// ---------- TCP と UDP の同時送信シミュレーション ----------
// 時間の単位は「パケットが片道届くのにかかる時間」を 1 とする。

import { CIRCLED, MESSAGE, type MsgKind, type Proto } from "./model";

export type PacketFate = "ok" | "lost" | "late";

/** 遅れるパケットが届くまでの時間 */
const LATE_DELAY = 2;
/** 次のパケットを送るまでの間隔 */
const GAP = 0.35;
/** ACK が返ってこないときに再送するまでの時間（タイムアウト） */
const TIMEOUT = 2.6;

export interface Flight {
  key: string;
  label: string;
  kind: MsgKind;
  /** right = 送信側 → 受信側 */
  dir: "right" | "left";
  t0: number;
  t1: number;
  lost: boolean;
  /** データのパケットなら何番目か */
  piece?: number;
  resend?: boolean;
}

export interface SimResult {
  proto: Proto;
  flights: Flight[];
  /** 受信側に届いた時刻（piece → 時刻）。届かなかったものは無い */
  arrivals: { piece: number; t: number }[];
  /** すべて終わる時刻 */
  end: number;
  /** 受信側のアプリにデータを渡し終えた時刻 */
  done: number;
}

function travel(fate: PacketFate) {
  return fate === "late" ? LATE_DELAY : 1;
}

export function simulateUdp(fates: PacketFate[]): SimResult {
  const flights: Flight[] = MESSAGE.map((ch, i) => {
    const t0 = i * GAP;
    return { key: `d${i}`, label: `${CIRCLED[i]}${ch}`, kind: "udp", dir: "right", t0, t1: t0 + travel(fates[i]), lost: fates[i] === "lost", piece: i };
  });
  const arrivals = flights.filter((f) => !f.lost).map((f) => ({ piece: f.piece!, t: f.t1 }));
  arrivals.sort((a, b) => a.t - b.t);
  const end = Math.max(...flights.map((f) => (f.lost ? f.t0 + 0.5 : f.t1)));
  const done = arrivals.length ? arrivals[arrivals.length - 1].t : 0;
  return { proto: "udp", flights, arrivals, end, done };
}

export function simulateTcp(fates: PacketFate[]): SimResult {
  const flights: Flight[] = [
    { key: "syn", label: "SYN", kind: "syn", dir: "right", t0: 0, t1: 1, lost: false },
    { key: "synack", label: "SYN+ACK", kind: "syn", dir: "left", t0: 1, t1: 2, lost: false },
    { key: "ack0", label: "ACK", kind: "ack", dir: "right", t0: 2, t1: 3, lost: false },
  ];
  // ハンドシェイクの最後の ACK と一緒に、データも送り始める
  const start = 2;
  const arrivals: { piece: number; t: number }[] = [];
  MESSAGE.forEach((ch, i) => {
    const t0 = start + i * GAP;
    const lost = fates[i] === "lost";
    flights.push({ key: `d${i}`, label: `${CIRCLED[i]}${ch}`, kind: "data", dir: "right", t0, t1: t0 + travel(fates[i]), lost, piece: i });
    if (lost) {
      // 再送したパケットは必ず届くことにする
      const r0 = t0 + TIMEOUT;
      flights.push({ key: `r${i}`, label: `${CIRCLED[i]}${ch}`, kind: "data", dir: "right", t0: r0, t1: r0 + 1, lost: false, piece: i, resend: true });
      arrivals.push({ piece: i, t: r0 + 1 });
    } else {
      arrivals.push({ piece: i, t: t0 + travel(fates[i]) });
    }
  });
  arrivals.sort((a, b) => a.t - b.t);

  // 受信側はデータが届くたびに「次にほしい番号」を ACK で返す
  const have = new Set<number>();
  let doneAt = 0;
  arrivals.forEach(({ piece, t }, n) => {
    have.add(piece);
    let next = 0;
    while (have.has(next)) next++;
    if (next === MESSAGE.length && doneAt === 0) doneAt = t;
    flights.push({ key: `a${n}`, label: `ACK=${next + 1}`, kind: "ack", dir: "left", t0: t, t1: t + 1, lost: false });
  });

  const end = Math.max(...flights.map((f) => (f.lost ? f.t0 + 0.5 : f.t1)));
  return { proto: "tcp", flights, arrivals, end, done: doneAt };
}

/** 時刻 t までに受信側のアプリに渡されたデータ（piece の並び）と、TCP が保管中のデータ */
export function deliveredAt(sim: SimResult, t: number): { delivered: number[]; buffered: number[] } {
  const arrived = sim.arrivals.filter((a) => a.t <= t).map((a) => a.piece);
  if (sim.proto === "udp") return { delivered: arrived, buffered: [] };
  const have = new Set(arrived);
  const delivered: number[] = [];
  while (have.has(delivered.length)) delivered.push(delivered.length);
  return { delivered, buffered: arrived.filter((p) => p >= delivered.length).sort((a, b) => a - b) };
}
