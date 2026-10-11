// ---------- 送受信の図（1つずつ進める） ----------
// 送信側・受信側のノートパソコンの間を、番号付きのデータが流れる図。
// 「1つ進める」を押すたびに 1 つのできごと（ステップ）が進む。

import type { Proto } from "./model";

export type FlowItem =
  /** 手元のデータ。filled に含まれる番号を色付きで表示する */
  | { kind: "buffer"; side: "sender" | "receiver"; y: number; filled: number[] }
  /** データ。lost なら途中でエラーになる */
  | { kind: "packet"; no: number; y0: number; y1: number; lost?: boolean }
  /** 受信側からの「OK!」（確認応答） */
  | { kind: "ok"; y0: number; y1: number }
  /** 吹き出し */
  | { kind: "callout"; y: number; lines: string[] };

export interface FlowStep {
  text: string;
  /** このステップで現れるもの（at は現れるまでの秒数） */
  items: (FlowItem & { at?: number })[];
}

export interface Flow {
  proto: Proto;
  caption: string;
  /** 図の下端 */
  end: number;
  /** ステップ 0（まだ何も起きていない）の説明 */
  intro: string;
  steps: FlowStep[];
}

export const TCP_FLOW: Flow = {
  proto: "tcp",
  caption: "TCP の送受信",
  end: 285,
  intro: "「1つ進める」を押すと、TCP の送受信が1つずつ進みます。",
  steps: [
    {
      text: "送信側が①を送ります。①は受信側に届きました。",
      items: [
        { kind: "buffer", side: "sender", y: 70, filled: [1] },
        { kind: "packet", no: 1, y0: 70, y1: 100, at: 0.2 },
        { kind: "buffer", side: "receiver", y: 100, filled: [1], at: 1 },
      ],
    },
    {
      text: "受信側は「OK!」（確認応答・ACK）を返します。これで送信側は、①がちゃんと届いたと分かります。",
      items: [{ kind: "ok", y0: 105, y1: 130 }],
    },
    {
      text: "続けて②を送りましたが、途中でエラーが起きて届きませんでした。受信側は②を受け取っていないので、OK を返しません。",
      items: [
        { kind: "buffer", side: "sender", y: 135, filled: [1, 2] },
        { kind: "packet", no: 2, y0: 135, y1: 160, lost: true, at: 0.2 },
      ],
    },
    {
      text: "送信側は、一定時間たっても②の OK が返ってこないので、②をもう一度送ります（再送）。今度は届きました。",
      items: [
        { kind: "callout", y: 173, lines: ["一定時間経過", "後に再送"] },
        { kind: "packet", no: 2, y0: 170, y1: 195, at: 0.4 },
        { kind: "buffer", side: "receiver", y: 195, filled: [1, 2], at: 1.2 },
      ],
    },
    {
      text: "受信側は、②の「OK!」を返します。",
      items: [{ kind: "ok", y0: 200, y1: 225 }],
    },
    {
      text: "最後に③を送ります。受信側に①②③がそろい、完全な形のデータが届きました。そのかわり、OK を待ったり再送したりした分だけ時間がかかります。",
      items: [
        { kind: "buffer", side: "sender", y: 230, filled: [1, 2, 3] },
        { kind: "packet", no: 3, y0: 230, y1: 260, at: 0.2 },
        { kind: "buffer", side: "receiver", y: 260, filled: [1, 2, 3], at: 1 },
      ],
    },
  ],
};

export const UDP_FLOW: Flow = {
  proto: "udp",
  caption: "UDP の送受信",
  end: 285,
  intro: "「1つ進める」を押すと、UDP の送受信が1つずつ進みます。",
  steps: [
    {
      text: "送信側が①を送ります。①は受信側に届きました。UDP では、受信側は OK（確認応答）を返しません。",
      items: [
        { kind: "buffer", side: "sender", y: 70, filled: [1] },
        { kind: "packet", no: 1, y0: 70, y1: 100, at: 0.2 },
        { kind: "buffer", side: "receiver", y: 100, filled: [1], at: 1 },
      ],
    },
    {
      text: "送信側は応答を待たずに、すぐ②を送ります。途中でエラーが起きて届きませんでしたが、送信側も受信側も気づきません。",
      items: [
        { kind: "buffer", side: "sender", y: 130, filled: [1, 2] },
        { kind: "packet", no: 2, y0: 130, y1: 155, lost: true, at: 0.2 },
        { kind: "buffer", side: "receiver", y: 160, filled: [1], at: 1 },
      ],
    },
    {
      text: "続けて③を送ります。受信側には①と③が届き、②は欠けたままです。そのかわり、待ち時間がないので TCP より早く終わります。",
      items: [
        { kind: "buffer", side: "sender", y: 190, filled: [1, 2, 3] },
        { kind: "packet", no: 3, y0: 190, y1: 220, at: 0.2 },
        { kind: "buffer", side: "receiver", y: 220, filled: [1, 3], at: 1 },
        { kind: "callout", y: 238, lines: ["応答を待たずに", "次々に送信"], at: 1.2 },
      ],
    },
  ],
};

export const FLOWS: Record<Proto, Flow> = { tcp: TCP_FLOW, udp: UDP_FLOW };
