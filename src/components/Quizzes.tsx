"use client";
import { type ReactNode, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { PROTO, SORT_ITEMS, TEST_QUESTIONS, slideIndexOf, type ChoiceQuiz, type Proto, type SeqMessage } from "@/lib/model";
import SequenceDiagram from "./SequenceDiagram";

// ---------- 共通部品 ----------

export function Feedback({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.25,
        borderLeft: 4,
        borderColor: ok ? "success.main" : "error.main",
        bgcolor: ok ? "#f1f8e9" : "#ffebee",
        display: "flex",
        gap: 1,
        alignItems: "flex-start",
      }}
    >
      {ok ? <CheckCircleIcon color="success" fontSize="small" sx={{ mt: 0.25 }} /> : <CancelIcon color="error" fontSize="small" sx={{ mt: 0.25 }} />}
      <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
        {children}
      </Typography>
    </Paper>
  );
}

function OptionButton({
  label,
  state,
  onClick,
  disabled,
}: {
  label: ReactNode;
  state?: "ok" | "ng" | "picked";
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant={state === "picked" ? "contained" : "outlined"}
      color={state === "ok" ? "success" : state === "ng" ? "error" : "primary"}
      onClick={onClick}
      disabled={disabled && !state}
      sx={{
        justifyContent: "flex-start",
        textAlign: "left",
        textTransform: "none",
        fontWeight: 700,
        borderWidth: 2,
        "&:hover": { borderWidth: 2 },
        bgcolor: state === "ok" ? "#e8f5e9" : state === "ng" ? "#ffebee" : undefined,
        pointerEvents: disabled ? "none" : undefined,
      }}
    >
      {label}
    </Button>
  );
}

// ---------- 選択問題（予想問題・確認問題） ----------

export function ChoiceQuizView({ quiz, value, onAnswer }: { quiz: ChoiceQuiz; value: number | undefined; onAnswer: (v: number) => void }) {
  const answered = value !== undefined;
  return (
    <Stack spacing={1}>
      <Typography fontWeight={700}>Q. {quiz.question}</Typography>
      <Stack spacing={0.75}>
        {quiz.options.map((o, i) => (
          <OptionButton
            key={o}
            label={o}
            disabled={answered}
            state={answered ? (i === quiz.answer ? "ok" : i === value ? "ng" : undefined) : undefined}
            onClick={() => onAnswer(i)}
          />
        ))}
      </Stack>
      {answered && <Feedback ok={value === quiz.answer}>{value === quiz.answer ? quiz.ok : quiz.ng}</Feedback>}
    </Stack>
  );
}

// ---------- 体験問題：3ウェイハンドシェイクの順番 ----------

const HANDSHAKE_STEPS: { text: string; msg: Omit<SeqMessage, "t">; note: string }[] = [
  { text: "📱→🖥️　SYN「つながりたい」", msg: { from: "left", label: "SYN", kind: "syn" }, note: "つながりたい" },
  { text: "🖥️→📱　SYN＋ACK「いいよ。こちらもつながりたい」", msg: { from: "right", label: "SYN＋ACK", kind: "syn" }, note: "いいよ" },
  { text: "📱→🖥️　ACK「了解」", msg: { from: "left", label: "ACK", kind: "ack" }, note: "了解" },
];
/** 選択肢を並べる順番（正しい順番とは変えておく） */
const HANDSHAKE_SHOWN = [1, 2, 0];
const HANDSHAKE_HINT = [
  "最初は、つながりたい側（スマホ）が合図を送ります。",
  "次は、合図を受け取ったサーバが返事をします。",
  "最後に、スマホがサーバの返事を受け取ったことを知らせます。",
];

export function HandshakeQuiz() {
  const [placed, setPlaced] = useState(0);
  const [miss, setMiss] = useState(false);
  const done = placed === HANDSHAKE_STEPS.length;

  const pick = (i: number) => {
    if (i < placed) return;
    if (i !== placed) {
      setMiss(true);
      return;
    }
    setPlaced(placed + 1);
    setMiss(false);
  };

  const scenario = {
    proto: "tcp" as Proto,
    caption: "TCP：3ウェイハンドシェイク",
    left: "📱 スマホ",
    right: "🖥️ サーバ",
    messages: HANDSHAKE_STEPS.slice(0, placed).map((s, i) => ({ ...s.msg, t: i })),
    notes: HANDSHAKE_STEPS.slice(0, placed).map((s, i) => ({ side: s.msg.from, t: i, text: s.note })),
    end: 3.2,
  };

  return (
    <Stack spacing={1.5}>
      <Box sx={{ maxWidth: 460, width: "100%", mx: "auto" }}>
        <SequenceDiagram scenario={scenario} from={Math.max(0, placed - 1)} hideReplay />
      </Box>
      <Stack spacing={1}>
        <Typography fontWeight={700}>Q. {done ? "完成！" : `${placed + 1}番目のやりとりは？`}</Typography>
        {HANDSHAKE_SHOWN.map((i) => (
          <OptionButton
            key={i}
            label={
              <>
                {i < placed && <Box component="span" sx={{ mr: 0.75 }}>{`${i + 1}.`}</Box>}
                {HANDSHAKE_STEPS[i].text}
              </>
            }
            state={i < placed ? "ok" : undefined}
            disabled={done}
            onClick={() => pick(i)}
          />
        ))}
        {done ? (
          <Feedback ok>
            正解！ SYN → SYN＋ACK → ACK の3回で、おたがいに「送れる・受け取れる」ことを確かめ合いました。これでデータを送り始められます。
          </Feedback>
        ) : (
          miss && <Feedback ok={false}>{HANDSHAKE_HINT[placed]}</Feedback>
        )}
        {placed > 0 && (
          <Box>
            <Button
              variant="outlined"
              onClick={() => {
                setPlaced(0);
                setMiss(false);
              }}
            >
              最初から
            </Button>
          </Box>
        )}
      </Stack>
    </Stack>
  );
}

// ---------- 体験問題：TCP と UDP の仕分け ----------

export function SortQuiz() {
  const [box, setBox] = useState<Record<string, Proto | undefined>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const put = (proto: Proto) => {
    if (!picked) return;
    setBox({ ...box, [picked]: proto });
    setPicked(null);
    setChecked(false);
  };
  const placedCount = SORT_ITEMS.filter((i) => box[i.label]).length;
  const correct = SORT_ITEMS.filter((i) => box[i.label] === i.answer).length;

  const card = (label: string) => {
    const state = checked && box[label] ? (SORT_ITEMS.find((i) => i.label === label)!.answer === box[label] ? "ok" : "ng") : undefined;
    return (
      <Button
        key={label}
        size="small"
        variant={picked === label ? "contained" : "outlined"}
        color={state === "ok" ? "success" : state === "ng" ? "error" : "primary"}
        onClick={(e) => {
          e.stopPropagation();
          setPicked(picked === label ? null : label);
        }}
        sx={{ textTransform: "none", fontWeight: 700, borderWidth: 2, "&:hover": { borderWidth: 2 }, bgcolor: state === "ok" ? "#e8f5e9" : state === "ng" ? "#ffebee" : undefined }}
      >
        {state === "ok" ? "○ " : state === "ng" ? "× " : ""}
        {label}
      </Button>
    );
  };

  const bin = (proto: Proto, title: string) => (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => put(proto)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          put(proto);
        }
      }}
      sx={{
        border: `2px dashed ${PROTO[proto].color}`,
        borderRadius: 2,
        p: 1,
        minHeight: 170,
        bgcolor: picked ? "#fffde7" : PROTO[proto].bg,
        cursor: picked ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
        alignItems: "flex-start",
      }}
    >
      <Typography fontWeight={700} sx={{ color: PROTO[proto].color }}>
        {title}
      </Typography>
      {SORT_ITEMS.filter((i) => box[i.label] === proto).map((i) => card(i.label))}
    </Box>
  );

  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, minHeight: 72, alignContent: "flex-start" }}>
        {SORT_ITEMS.filter((i) => !box[i.label]).map((i) => card(i.label))}
        {placedCount === SORT_ITEMS.length && (
          <Typography variant="body2" color="text.secondary">
            全部仕分けました。「答え合わせ」を押そう。
          </Typography>
        )}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
        {bin("tcp", "TCP（確実さが大事）")}
        {bin("udp", "UDP（速さが大事）")}
      </Box>
      <Stack direction="row" spacing={1}>
        <Button variant="contained" disabled={placedCount < SORT_ITEMS.length} onClick={() => setChecked(true)}>
          答え合わせ
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            setBox({});
            setPicked(null);
            setChecked(false);
          }}
        >
          やり直す
        </Button>
      </Stack>
      {checked && (
        <Feedback ok={correct === SORT_ITEMS.length}>
          {correct === SORT_ITEMS.length
            ? "全問正解！ 1つでも欠けると困るもの（Webページ・メール・ファイル・支払い）は TCP、少し欠けても止まらずに流れてほしいもの（通話・ゲーム・ライブ中継）は UDP が向いています。"
            : `${correct} / ${SORT_ITEMS.length} 正解。赤いカードを選んで、もう一方の箱に入れ直してみよう。`}
        </Feedback>
      )}
    </Stack>
  );
}

// ---------- まとめテスト ----------

export interface TestState {
  answers: (number | undefined)[];
  graded: boolean;
  /** 結果画面をスクリーンショットで提出するときの名前 */
  name: string;
}

export function FinalTest({ state, onChange, onSeek }: { state: TestState; onChange: (s: TestState) => void; onSeek: (index: number) => void }) {
  const { answers, graded, name } = state;
  const allAnswered = TEST_QUESTIONS.every((_, i) => answers[i] !== undefined);
  const score = TEST_QUESTIONS.filter((q, i) => answers[i] === q.answer).length;

  if (graded) {
    return (
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ textAlign: "center", bgcolor: "#f5f7fa", borderRadius: 3, px: 3, py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              あなたの得点
            </Typography>
            <Typography sx={{ fontSize: "2.6rem", fontWeight: 700, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
              {score} / {TEST_QUESTIONS.length}
            </Typography>
          </Box>
          <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
            <TextField
              id="test-name"
              size="small"
              placeholder="名前を入力（提出用）"
              slotProps={{ htmlInput: { "aria-label": "名前（提出用）" } }}
              value={name}
              onChange={(e) => onChange({ ...state, name: e.target.value })}
            />
            <Typography fontWeight={700}>
              {score === TEST_QUESTIONS.length ? "全問正解です！" : score >= 6 ? "よくできました。× の問題を見直そう。" : "説明のスライドに戻って確認しよう。"}
            </Typography>
          </Stack>
        </Stack>
        <Stack spacing={0.75}>
          {TEST_QUESTIONS.map((q, i) => {
            const ok = answers[i] === q.answer;
            const review = slideIndexOf(q.review);
            return (
              <Paper key={q.question} variant="outlined" sx={{ p: 1, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                {ok ? <CheckCircleIcon color="success" fontSize="small" /> : <CancelIcon color="error" fontSize="small" />}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700}>
                    {i + 1}. {q.question}
                  </Typography>
                  {!ok && (
                    <Typography variant="caption" color="text.secondary">
                      正解：{q.options[q.answer]}
                    </Typography>
                  )}
                </Box>
                {!ok && (
                  <Button size="small" onClick={() => onSeek(review)}>
                    スライド {review + 1} で確認
                  </Button>
                )}
              </Paper>
            );
          })}
        </Stack>
        <Box>
          <Button variant="outlined" onClick={() => onChange({ answers: [], graded: false, name })}>
            もう一度解く
          </Button>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5}>
      {TEST_QUESTIONS.map((q, i) => (
        <Box key={q.question}>
          <Typography variant="body2" fontWeight={700} mb={0.5}>
            {i + 1}. {q.question}
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {q.options.map((o, j) => (
              <Button
                key={o}
                size="small"
                variant={answers[i] === j ? "contained" : "outlined"}
                onClick={() => {
                  const next = [...answers];
                  next[i] = j;
                  onChange({ ...state, answers: next, graded: false });
                }}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                {o}
              </Button>
            ))}
          </Stack>
        </Box>
      ))}
      <Box>
        <Button variant="contained" disabled={!allAnswered} onClick={() => onChange({ ...state, graded: true })}>
          採点する
        </Button>
      </Box>
    </Stack>
  );
}
