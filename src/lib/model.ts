// ---------- モデル（スライドの内容） ----------

export type Proto = "tcp" | "udp";

export const TCP_COLOR = "#1565c0";
export const UDP_COLOR = "#e65100";
export const ACK_COLOR = "#2e7d32";
export const SYN_COLOR = "#6a1b9a";
export const LOST_COLOR = "#c62828";

export const PROTO = {
  tcp: { name: "TCP", color: TCP_COLOR, bg: "#e3f2fd", catch: "確実に届ける" },
  udp: { name: "UDP", color: UDP_COLOR, bg: "#fff3e0", catch: "すばやく届ける" },
} as const;

/** 送るメッセージ。1文字ずつ 1つのパケットに入れて送る */
export const MESSAGE = ["ネ", "ッ", "ト", "ワ", "ー", "ク"];
export const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];

export const CHAPTERS = [
  { id: 1, name: "TCPとUDP", color: "#455a64" },
  { id: 2, name: "つながりを作る", color: SYN_COLOR },
  { id: 3, name: "確実に届ける（TCP）", color: TCP_COLOR },
  { id: 4, name: "すばやく届ける（UDP）", color: UDP_COLOR },
  { id: 5, name: "比べて使い分ける", color: ACK_COLOR },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"];

// ---------- 時間の流れ図（シーケンス図） ----------

export type MsgKind = "syn" | "ack" | "data" | "udp";

export interface SeqMessage {
  /** 送る側（left = 左の機器、right = 右の機器） */
  from: "left" | "right";
  /** 送り出す時刻 */
  t: number;
  /** 届くまでの時間（既定は 1） */
  d?: number;
  label: string;
  kind: MsgKind;
  /** 途中で消える */
  lost?: boolean;
}

export interface SeqNote {
  side: "left" | "right";
  t: number;
  text: string;
  /** 注意を引く色で表示する */
  alert?: boolean;
}

export interface Scenario {
  proto: Proto;
  caption: string;
  left: string;
  right: string;
  messages: SeqMessage[];
  notes?: SeqNote[];
  /** 図の下端の時刻 */
  end: number;
}

// ---------- 問題 ----------

export interface ChoiceQuiz {
  kind: "choice";
  question: string;
  options: string[];
  answer: number;
  ok: string;
  ng: string;
  /** true の予想問題は、答えるまで次のスライドへ進めない */
  gate?: boolean;
}

export type Quiz = ChoiceQuiz | { kind: "handshake" } | { kind: "race" } | { kind: "sort" } | { kind: "test" };

export type QuizLabel = "予想問題" | "体験問題" | "確認問題";

export function quizLabel(quiz: Quiz | undefined): QuizLabel | null {
  if (!quiz) return null;
  if (quiz.kind === "choice") return quiz.gate ? "予想問題" : "確認問題";
  if (quiz.kind === "test") return "確認問題";
  return "体験問題";
}

export const QUIZ_COLOR: Record<QuizLabel, string> = {
  予想問題: "#1565c0",
  体験問題: "#ef6c00",
  確認問題: "#2e7d32",
};

// ---------- スライド ----------

export type Stage =
  | { kind: "intro" }
  | { kind: "header" }
  | { kind: "diagram"; scenarios: Scenario[] }
  /** 送受信の図（教科書の図と同じ形で、1つずつ進める） */
  | { kind: "flow"; protos: Proto[] }
  | { kind: "handshake" }
  | { kind: "stream" }
  | { kind: "race" }
  | { kind: "table" }
  | { kind: "sort" }
  | { kind: "test" };

export interface Slide {
  id?: string;
  chapter: ChapterId;
  title: string;
  description: string;
  stage: Stage;
  /** 説明の下に出す要点 */
  points?: string[];
  quiz?: Quiz;
}

const PHONE = "📱 スマホ";
const SERVER = "🖥️ サーバ";

const HANDSHAKE: Scenario = {
  proto: "tcp",
  caption: "TCP：3ウェイハンドシェイク",
  left: PHONE,
  right: SERVER,
  messages: [
    { from: "left", t: 0, label: "SYN", kind: "syn" },
    { from: "right", t: 1, label: "SYN＋ACK", kind: "syn" },
    { from: "left", t: 2, label: "ACK", kind: "ack" },
    { from: "left", t: 3, label: "① ネ", kind: "data" },
  ],
  notes: [
    { side: "left", t: 0, text: "つながりたい" },
    { side: "right", t: 1, text: "いいよ" },
    { side: "left", t: 2, text: "了解" },
    { side: "left", t: 3, text: "ここで\n送り始める" },
  ],
  end: 4.2,
};

const UDP_START: Scenario = {
  proto: "udp",
  caption: "UDP：準備なし",
  left: PHONE,
  right: SERVER,
  messages: [
    { from: "left", t: 0, label: "① ネ", kind: "udp" },
    { from: "left", t: 0.5, label: "② ッ", kind: "udp" },
    { from: "left", t: 1, label: "③ ト", kind: "udp" },
    { from: "left", t: 1.5, label: "④ ワ", kind: "udp" },
  ],
  notes: [
    { side: "left", t: 0, text: "いきなり送る" },
    { side: "right", t: 2.5, text: "もう4つ\n届いた" },
  ],
  end: 4.2,
};

const TCP_ACK: Scenario = {
  proto: "tcp",
  caption: "TCP：届くたびに ACK を返す",
  left: PHONE,
  right: SERVER,
  messages: [
    { from: "left", t: 0, label: "① seq=1", kind: "data" },
    { from: "left", t: 0.6, label: "② seq=2", kind: "data" },
    { from: "left", t: 1.2, label: "③ seq=3", kind: "data" },
    { from: "right", t: 1, label: "ACK=2", kind: "ack" },
    { from: "right", t: 1.6, label: "ACK=3", kind: "ack" },
    { from: "right", t: 2.2, label: "ACK=4", kind: "ack" },
  ],
  notes: [
    { side: "right", t: 1, text: "①OK\n次は2" },
    { side: "right", t: 2.2, text: "③OK\n次は4" },
    { side: "left", t: 3.2, text: "全部届いた！" },
  ],
  end: 3.8,
};

const TCP_LOSS: Scenario = {
  proto: "tcp",
  caption: "TCP：②が消えたとき",
  left: PHONE,
  right: SERVER,
  messages: [
    { from: "left", t: 0, label: "① seq=1", kind: "data" },
    { from: "left", t: 0.6, label: "② seq=2", kind: "data", lost: true },
    { from: "left", t: 1.2, label: "③ seq=3", kind: "data" },
    { from: "right", t: 1, label: "ACK=2", kind: "ack" },
    { from: "right", t: 2.2, label: "ACK=2", kind: "ack" },
    { from: "left", t: 3.2, label: "② 再送", kind: "data" },
    { from: "right", t: 4.2, label: "ACK=4", kind: "ack" },
  ],
  notes: [
    { side: "right", t: 2.2, text: "まだ2がない\n③は保管", alert: true },
    { side: "left", t: 3.2, text: "⏰ACKが来ない\n→②を再送", alert: true },
    { side: "right", t: 4.2, text: "そろった！" },
  ],
  end: 5.6,
};

const TCP_ORDER: Scenario = {
  proto: "tcp",
  caption: "TCP：②が遅れて届いたとき",
  left: PHONE,
  right: SERVER,
  messages: [
    { from: "left", t: 0, label: "① seq=1", kind: "data" },
    { from: "left", t: 0.6, label: "② seq=2", kind: "data", d: 2 },
    { from: "left", t: 1.2, label: "③ seq=3", kind: "data" },
  ],
  notes: [
    { side: "right", t: 2.2, text: "③を保管" },
    { side: "right", t: 2.6, text: "番号順に並べ替え\n→「ネット」" },
  ],
  end: 3.6,
};

const UDP_ORDER: Scenario = {
  proto: "udp",
  caption: "UDP：②が遅れて届いたとき",
  left: PHONE,
  right: SERVER,
  messages: [
    { from: "left", t: 0, label: "① ネ", kind: "udp" },
    { from: "left", t: 0.6, label: "② ッ", kind: "udp", d: 2 },
    { from: "left", t: 1.2, label: "③ ト", kind: "udp" },
  ],
  notes: [
    { side: "right", t: 2.2, text: "届いた順に渡す" },
    { side: "right", t: 2.6, text: "→「ネトッ」", alert: true },
  ],
  end: 3.6,
};

export const SLIDES: Slide[] = [
  // ---- 第1章 TCP と UDP ----
  {
    id: "intro",
    chapter: 1,
    title: "トランスポート層の2つのプロトコル",
    description:
      "インターネットでデータを送るとき、トランスポート層では TCP と UDP のどちらかを使います。どちらもポート番号で「どのアプリあてか」を区別しますが、届け方の考え方がまったく違います。TCP は「確実に届ける」、UDP は「すばやく届ける」ことを大事にしています。",
    stage: { kind: "intro" },
    points: ["TCP：相手とつながりを作り、届いたか確認しながら送る", "UDP：つながりを作らず、確認もしないで送りっぱなし"],
  },
  {
    id: "header",
    chapter: 1,
    title: "ヘッダを比べてみよう",
    description:
      "TCP と UDP は、データの前にヘッダ（送り状）を付けて送ります。TCP のヘッダには、データの順番を表すシーケンス番号や、受け取ったことを知らせる確認応答番号（ACK 番号）などが書かれていて、最低 20 バイトあります。UDP のヘッダはたった 8 バイトです。",
    stage: { kind: "header" },
  },
  {
    chapter: 1,
    title: "ヘッダの違いから予想しよう",
    description: "UDP のヘッダには、シーケンス番号も ACK 番号もありません。書いてあるのはポート番号・長さ・チェックサム（データが壊れていないかの確認用）だけです。",
    stage: { kind: "header" },
    quiz: {
      kind: "choice",
      gate: true,
      question: "シーケンス番号のない UDP には、どんなことができないと思う？",
      options: ["宛先のアプリにデータを届けること", "届いたデータを元の順番に並べ直すこと", "データを送ること"],
      answer: 1,
      ok: "正解！ 番号がないので、届いたデータの順番が入れ替わっていても並べ直せません。どれが足りないかも分かりません。ポート番号はあるので、アプリに届けることはできます。",
      ng: "ポート番号はあるので、アプリに届けることはできます。でも番号（シーケンス番号）がないので、届いたデータを元の順番に並べ直したり、足りない分に気づいたりはできません。",
    },
  },

  // ---- 第2章 つながりを作る ----
  {
    chapter: 2,
    title: "TCP は送る前に何をする？",
    description: "TCP は「確実に届ける」プロトコルです。電話で話す前に「もしもし」「はい」と確かめ合うように、データを送る前にも準備をします。",
    stage: { kind: "intro" },
    quiz: {
      kind: "choice",
      gate: true,
      question: "TCP がデータを送る前にすることは？",
      options: ["相手と「つながりたい」「いいよ」とやりとりして、つながりを作る", "データを圧縮して小さくする", "何もしないで、すぐに送り始める"],
      answer: 0,
      ok: "正解！ TCP は、まず相手とやりとりして「つながり（コネクション）」を作ってから送ります。",
      ng: "TCP は、まず相手とやりとりして「つながり（コネクション）」を作ってから送ります。すぐに送り始めるのは UDP です。",
    },
  },
  {
    id: "handshake",
    chapter: 2,
    title: "3ウェイハンドシェイク",
    description:
      "TCP は、3回のやりとりでつながりを作ります。①スマホが「つながりたい（SYN）」、②サーバが「いいよ。こちらもつながりたい（SYN＋ACK）」、③スマホが「了解（ACK）」。3回握手するので 3ウェイハンドシェイクといいます。これが終わってから、やっとデータを送り始めます。",
    stage: { kind: "diagram", scenarios: [HANDSHAKE] },
    points: ["SYN（シン）＝ つながりたい", "ACK（アック）＝ 受け取りました（確認応答）"],
  },
  {
    chapter: 2,
    title: "あいさつの順番を並べよう",
    description: "3ウェイハンドシェイクの3つのやりとりを、正しい順番にタップしてください。並べると、図に矢印がかかれていきます。",
    stage: { kind: "handshake" },
    quiz: { kind: "handshake" },
  },
  {
    id: "udp-start",
    chapter: 2,
    title: "UDP はいきなり送る",
    description:
      "UDP は、つながりを作りません。相手の準備ができているかを確かめずに、いきなりデータを送り始めます。図を比べると、TCP がまだあいさつをしている間に、UDP はもうデータを4つ届けています。",
    stage: { kind: "diagram", scenarios: [HANDSHAKE, UDP_START] },
    points: ["TCP：コネクション型（つながりを作ってから送る）", "UDP：コネクションレス型（つながりを作らない）"],
  },

  // ---- 第3章 確実に届ける（TCP） ----
  {
    id: "ack",
    chapter: 3,
    title: "受け取ったら ACK を返す",
    description:
      "TCP では、データを受け取った側が「ここまで届きました。次は何番をください」という確認応答（ACK）を返します。①を受け取ったら「ACK=2（次は2番）」です。送る側は ACK を見て、ちゃんと届いたことを確認します。",
    stage: { kind: "diagram", scenarios: [TCP_ACK] },
    points: ["シーケンス番号：そのデータが何番目か（実際は何バイト目からかを表す）", "ACK 番号：次に受け取りたい番号"],
  },
  {
    chapter: 3,
    title: "途中でパケットが消えたら？",
    description:
      "ネットワークの途中で、混雑したルータがパケットを捨ててしまうことがあります（パケットロス）。①②③を送ったら、②だけが途中で消えてしまいました。サーバには①と③が届きます。",
    stage: { kind: "diagram", scenarios: [{ ...TCP_LOSS, messages: TCP_LOSS.messages.slice(0, 3), notes: [], caption: "TCP：②が消えた！", end: 3 }] },
    quiz: {
      kind: "choice",
      gate: true,
      question: "TCP では、このあとどうなる？",
      options: ["②が欠けたまま「ネト」として受け取る", "スマホが②をもう一度送る（再送）", "全部最初から送り直す"],
      answer: 1,
      ok: "正解！ スマホは②の ACK が返ってこないので、②だけをもう一度送ります。次のスライドで見てみましょう。",
      ng: "TCP は欠けたままにはしません。かといって全部ではなく、届かなかった②だけをもう一度送ります（再送）。次のスライドで見てみましょう。",
    },
  },
  {
    id: "resend",
    chapter: 3,
    title: "届かなかった分だけ再送する",
    description:
      "図の「1つ進める」を押して、TCP の送受信を1つずつ見ていきましょう。受信側はデータを受け取るたびに「OK!」（確認応答・ACK）を返します。送信側は、一定時間たっても OK が返ってこないデータをもう一度送ります（再送）。左右の □□□ は、送信側が送ったデータと、受信側が受け取ったデータです。",
    stage: { kind: "flow", protos: ["tcp"] },
    points: ["ACK が来ない → 一定時間（タイムアウト）で再送", "確実に届くが、待つ分だけ時間がかかる"],
  },
  {
    id: "order",
    chapter: 3,
    title: "順番が入れ替わっても大丈夫",
    description:
      "パケットはルータごとに違う道を通ることがあるので、追い越しが起きます。②が遠回りして、③より後に届きました。TCP はシーケンス番号を見て元の順番に並べ直してからアプリに渡すので、「ネット」と正しく読めます。",
    stage: { kind: "diagram", scenarios: [TCP_ORDER] },
  },
  {
    chapter: 3,
    title: "ここまでの確認",
    description: "TCP がデータを確実に届けるためのしくみを確認しましょう。",
    stage: { kind: "diagram", scenarios: [TCP_LOSS] },
    quiz: {
      kind: "choice",
      question: "TCP で、受け取った側が「次は何番がほしいか」を知らせるのに使うのは？",
      options: ["SYN", "ACK（確認応答）", "ポート番号"],
      answer: 1,
      ok: "正解！ ACK 番号で「次に受け取りたい番号」を知らせます。同じ ACK 番号がくり返し届くと、送る側はそこが届いていないと分かります。",
      ng: "答えは ACK（確認応答）です。ACK 番号で「次に受け取りたい番号」を知らせます。SYN はつながりを作るときに使います。",
    },
  },

  // ---- 第4章 すばやく届ける（UDP） ----
  {
    id: "udp-loss",
    chapter: 4,
    title: "UDP でパケットが消えたら",
    description:
      "同じように②でエラーが起きたとき、UDP ではどうなるでしょう。図の「1つ進める」を押して見ていきましょう。UDP はパケットの受信確認（OK）をしないので、送信側は応答を待たずに次々に送ります。",
    stage: { kind: "flow", protos: ["udp"] },
  },
  {
    id: "compare-flow",
    chapter: 4,
    title: "TCP と UDP の送受信を比べよう",
    description:
      "TCP は OK を確かめながら送り、届かなかった②を再送するので、完全な形のデータが届きます。ただし図の縦の長さ（かかった時間）は長くなります。UDP は確認をしないので、完全な形で届く保証はありませんが、早く送り終わります。この速さ（リアルタイム性）を生かして、動画のライブ配信などに使われています。",
    stage: { kind: "flow", protos: ["tcp", "udp"] },
  },
  {
    chapter: 4,
    title: "UDP で順番が入れ替わったら",
    description:
      "UDP にはシーケンス番号がないので、並べ替えもしません。届いた順番のままアプリに渡すので、「ネトッ」になってしまいます。必要なら、アプリ側で番号を付けるなどの工夫をします。",
    stage: { kind: "diagram", scenarios: [TCP_ORDER, UDP_ORDER] },
  },
  {
    chapter: 4,
    title: "ビデオ通話で、1コマ消えたら？",
    description: "ビデオ通話では、映像を1秒間に何十コマも送り続けています。その途中の1コマ（④）が消えてしまいました。",
    stage: { kind: "stream" },
    quiz: {
      kind: "choice",
      gate: true,
      question: "ビデオ通話に向いているのは、TCP と UDP のどちら？",
      options: ["TCP：④を再送してもらい、届くまで映像を止めて待つ", "UDP：④はあきらめて、すぐ次のコマを表示する"],
      answer: 1,
      ok: "正解！ 一瞬だけ映像が乱れても、止まらずに続くほうが会話しやすいですね。遅れて届いた④は、もう役に立ちません。",
      ng: "TCP だと④が届くまで映像が止まり、会話がずれてしまいます。遅れて届いた④はもう役に立たないので、一瞬乱れても止まらない UDP が向いています。",
    },
  },
  {
    id: "stream",
    chapter: 4,
    title: "遅れるより、欠けるほうがまし",
    description:
      "TCP は④を再送するまで次のコマを渡さないので、映像が止まって「読み込み中」になります。UDP は④が欠けて一瞬乱れるだけで、映像は時間どおりに流れ続けます。通話・オンラインゲーム・ライブ中継のように「今」が大事な通信には UDP が向いています。",
    stage: { kind: "stream" },
  },

  // ---- 第5章 比べて使い分ける ----
  {
    id: "race",
    chapter: 5,
    title: "TCP と UDP で同時に送ってみよう",
    description:
      "「ネットワーク」の6文字を、1文字ずつ6つのパケットに分けて送ります。パケットの番号をタップすると「消える」「遅れる」を設定できます。いろいろ試して、TCP と UDP の届き方と、終わるまでの時間を比べてください。",
    stage: { kind: "race" },
    quiz: { kind: "race" },
  },
  {
    id: "table",
    chapter: 5,
    title: "TCP と UDP のまとめ",
    description:
      "TCP は、つながりを作り、ACK で確認し、再送や並べ替えをして確実に届けます。そのぶん時間がかかり、ヘッダも大きくなります。UDP は、確認をしないぶん速く、ヘッダも小さくてすみますが、欠けや順番の乱れはそのままです。",
    stage: { kind: "table" },
  },
  {
    chapter: 5,
    title: "TCP と UDP を仕分けよう",
    description:
      "8つの通信を、TCP と UDP のどちらが向いているかで仕分けてください。カードをタップしてから、入れたい箱をタップします。「1つでも欠けたら困る？」「遅れるより速いほうがいい？」がヒントです。",
    stage: { kind: "sort" },
    quiz: { kind: "sort" },
  },
  {
    chapter: 5,
    title: "まとめテスト",
    description:
      "ここまでの内容から8問です。全部答えたら「採点する」を押してください。間違えた問題は、説明のスライドに戻って確認できます。最後の結果画面をスクリーンショットして提出しましょう。",
    stage: { kind: "test" },
    quiz: { kind: "test" },
  },
];

export function slideIndexOf(id: string) {
  return SLIDES.findIndex((s) => s.id === id);
}

// ---------- ヘッダの中身 ----------

export interface HeaderField {
  name: string;
  /** ビット数（1行は 32 ビット） */
  bits: number;
  /** TCP にしかない項目 */
  only?: boolean;
}

export const TCP_HEADER: HeaderField[] = [
  { name: "送信元ポート番号", bits: 16 },
  { name: "宛先ポート番号", bits: 16 },
  { name: "シーケンス番号", bits: 32, only: true },
  { name: "確認応答番号（ACK番号）", bits: 32, only: true },
  { name: "長さなど", bits: 10, only: true },
  { name: "フラグ（SYN・ACK…）", bits: 6, only: true },
  { name: "ウィンドウサイズ", bits: 16, only: true },
  { name: "チェックサム", bits: 16 },
  { name: "緊急ポインタ", bits: 16, only: true },
];

export const UDP_HEADER: HeaderField[] = [
  { name: "送信元ポート番号", bits: 16 },
  { name: "宛先ポート番号", bits: 16 },
  { name: "長さ", bits: 16 },
  { name: "チェックサム", bits: 16 },
];

// ---------- 仕分け・まとめテスト ----------

export const SORT_ITEMS: { label: string; answer: Proto }[] = [
  { label: "ビデオ通話", answer: "udp" },
  { label: "Webページを見る", answer: "tcp" },
  { label: "オンラインゲームの位置情報", answer: "udp" },
  { label: "メールを送る", answer: "tcp" },
  { label: "インターネット電話", answer: "udp" },
  { label: "ファイルのダウンロード", answer: "tcp" },
  { label: "スポーツのライブ中継", answer: "udp" },
  { label: "ネットショッピングの支払い", answer: "tcp" },
];

export const TEST_QUESTIONS: { question: string; options: string[]; answer: number; review: string }[] = [
  {
    question: "TCP がデータを送る前に、つながりを作るために行うやりとりは？",
    options: ["3ウェイハンドシェイク", "パケットロス", "ルーティング"],
    answer: 0,
    review: "handshake",
  },
  {
    question: "3ウェイハンドシェイクで、最初に送る「つながりたい」という合図は？",
    options: ["ACK", "SYN", "FIN"],
    answer: 1,
    review: "handshake",
  },
  {
    question: "TCP で、ACK が返ってこないとき送る側はどうする？",
    options: ["あきらめて次のデータを送る", "届かなかったデータをもう一度送る", "つながりを切る"],
    answer: 1,
    review: "resend",
  },
  {
    question: "届いた順番がバラバラでも、TCP が元の順番に戻せるのはヘッダの何を使うから？",
    options: ["ポート番号", "チェックサム", "シーケンス番号"],
    answer: 2,
    review: "order",
  },
  {
    question: "UDP のヘッダに書かれていないものは？",
    options: ["宛先ポート番号", "シーケンス番号", "チェックサム"],
    answer: 1,
    review: "header",
  },
  {
    question: "UDP でパケットが1つ消えたとき、受け取ったアプリにはどう渡される？",
    options: ["欠けたまま渡される", "再送されてから渡される", "何も渡されない"],
    answer: 0,
    review: "udp-loss",
  },
  {
    question: "ビデオ通話で UDP が使われるのはなぜ？",
    options: ["1コマも欠けてはいけないから", "少し欠けても、遅れずに届くことが大事だから", "ヘッダが大きいから"],
    answer: 1,
    review: "stream",
  },
  {
    question: "ファイルのダウンロードに向いているのは？",
    options: ["TCP", "UDP"],
    answer: 0,
    review: "table",
  },
];
