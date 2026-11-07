"use client";

import { useState, useEffect } from "react";
import { Volume2 } from "lucide-react";

interface Mission {
  romaji: string;
  ja: string;
  desc: Record<string, string>;
}

const MISSIONS: Mission[] = [
  {
    romaji: "Oishii!",
    ja: "おいしい！",
    desc: {
      "en-US": "Love the food? Tell the staff \"Oishii!\" (Delicious!)",
      "ja-JP": "美味しかったらスタッフに「Oishii!」と伝えよう",
      "ko-KR": "음식이 맛있으면 스태프에게 \"Oishii!\"(맛있어요!)라고 말해보세요",
      "zh-CN": "觉得好吃就对工作人员说 \"Oishii!\"（好吃！）",
      "es-ES": "¿Te encanta la comida? Dile al equipo \"Oishii!\" (¡Delicioso!)",
      "pt-BR": "Amou a comida? Diga \"Oishii!\" (Delicioso!) para a equipe",
    },
  },
  {
    romaji: "Kanpai!",
    ja: "乾杯！",
    desc: {
      "en-US": "Raise your glass and shout \"Kanpai!\" (Cheers!)",
      "ja-JP": "グラスを掲げて「Kanpai!」と叫ぼう",
      "ko-KR": "잔을 들고 \"Kanpai!\"(건배!)라고 외쳐보세요",
      "zh-CN": "举起酒杯大喊 \"Kanpai!\"（干杯！）",
      "es-ES": "Levanta tu copa y grita \"Kanpai!\" (¡Salud!)",
      "pt-BR": "Levante o copo e grite \"Kanpai!\" (Saúde!)",
    },
  },
  {
    romaji: "Onegaishimasu!",
    ja: "お願いします！",
    desc: {
      "en-US": "Order like a local: \"Karaage, Onegaishimasu!\" (Karaage, please!)",
      "ja-JP": "注文は「Karaage, Onegaishimasu!」と言ってみよう",
      "ko-KR": "현지인처럼 주문해보세요: \"Karaage, Onegaishimasu!\"(가라아게 주세요!)",
      "zh-CN": "像本地人一样点餐：\"Karaage, Onegaishimasu!\"（请给我炸鸡！）",
      "es-ES": "Pide como un local: \"Karaage, Onegaishimasu!\" (¡Karaage, por favor!)",
      "pt-BR": "Peça como um local: \"Karaage, Onegaishimasu!\" (Karaage, por favor!)",
    },
  },
  {
    romaji: "Sumimasen!",
    ja: "すみません！",
    desc: {
      "en-US": "Need the staff? Call out \"Sumimasen!\" (Excuse me!)",
      "ja-JP": "スタッフを呼ぶときは「Sumimasen!」と声をかけよう",
      "ko-KR": "스태프가 필요하면 \"Sumimasen!\"(저기요!)라고 불러보세요",
      "zh-CN": "需要服务时喊一声 \"Sumimasen!\"（不好意思！）",
      "es-ES": "¿Necesitas al equipo? Di \"Sumimasen!\" (¡Disculpe!)",
      "pt-BR": "Precisa da equipe? Chame \"Sumimasen!\" (Com licença!)",
    },
  },
  {
    romaji: "Otsukaresama!",
    ja: "お疲れ様！",
    desc: {
      "en-US": "Cheer the hard-working staff with \"Otsukaresama!\" (Thanks for your hard work!)",
      "ja-JP": "頑張るスタッフに「Otsukaresama!」と声をかけよう",
      "ko-KR": "열심히 일하는 스태프에게 \"Otsukaresama!\"(수고하세요!)라고 말해보세요",
      "zh-CN": "对辛苦的工作人员说 \"Otsukaresama!\"（辛苦了！）",
      "es-ES": "Anima al equipo con \"Otsukaresama!\" (¡Gracias por tu esfuerzo!)",
      "pt-BR": "Anime a equipe com \"Otsukaresama!\" (Obrigado pelo trabalho!)",
    },
  },
  {
    romaji: "Arigatou!",
    ja: "ありがとう！",
    desc: {
      "en-US": "When your dish arrives, say \"Arigatou!\" (Thank you!)",
      "ja-JP": "料理が届いたら「Arigatou!」と伝えよう",
      "ko-KR": "음식이 나오면 \"Arigatou!\"(고마워요!)라고 말해보세요",
      "zh-CN": "上菜时说一声 \"Arigatou!\"（谢谢！）",
      "es-ES": "Cuando llegue tu plato, di \"Arigatou!\" (¡Gracias!)",
      "pt-BR": "Quando o prato chegar, diga \"Arigatou!\" (Obrigado!)",
    },
  },
  {
    romaji: "Gochisousama!",
    ja: "ごちそうさま！",
    desc: {
      "en-US": "On your way out, say \"Gochisousama!\" (Thanks for the meal!)",
      "ja-JP": "帰るときに「Gochisousama!」と言ってみよう",
      "ko-KR": "나갈 때 \"Gochisousama!\"(잘 먹었습니다!)라고 말해보세요",
      "zh-CN": "离开时说 \"Gochisousama!\"（谢谢款待！）",
      "es-ES": "Al salir, di \"Gochisousama!\" (¡Gracias por la comida!)",
      "pt-BR": "Ao sair, diga \"Gochisousama!\" (Obrigado pela refeição!)",
    },
  },
];

const LABELS: Record<string, { title: string; done: string; doneThanks: string }> = {
  "en-US": { title: "Today's Japanese Mission", done: "I did it!", doneThanks: "Sugoi! Mission complete 🎉" },
  "ja-JP": { title: "今日の日本語ミッション", done: "やった！", doneThanks: "すごい！ミッション達成 🎉" },
  "ko-KR": { title: "오늘의 일본어 미션", done: "성공!", doneThanks: "Sugoi! 미션 완료 🎉" },
  "zh-CN": { title: "今日日语任务", done: "完成了！", doneThanks: "Sugoi! 任务完成 🎉" },
  "es-ES": { title: "Misión de japonés del día", done: "¡Lo hice!", doneThanks: "¡Sugoi! Misión cumplida 🎉" },
  "pt-BR": { title: "Missão de japonês do dia", done: "Consegui!", doneThanks: "Sugoi! Missão cumprida 🎉" },
};

/** Vancouver calendar date, so every guest on the same day sees the same mission. */
function vancouverDate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver" }).format(new Date());
}

function missionForDate(date: string): Mission {
  const days = Math.floor(Date.parse(date) / 86_400_000);
  return MISSIONS[((days % MISSIONS.length) + MISSIONS.length) % MISSIONS.length];
}

interface DailyMissionProps {
  lang: string;
  onDone?: (romaji: string) => void;
}

export default function DailyMission({ lang, onDone }: DailyMissionProps) {
  const [today, setToday] = useState(vancouverDate);
  const [dismissed, setDismissed] = useState(false);
  const [done, setDone] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);

  useEffect(() => {
    setCanSpeak(typeof window !== "undefined" && "speechSynthesis" in window);
    const interval = setInterval(() => setToday(vancouverDate()), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem("guu_mission_dismissed") === today);
      setDone(localStorage.getItem("guu_mission_done") === today);
    } catch {}
  }, [today]);

  if (dismissed) return null;

  const mission = missionForDate(today);
  const labels = LABELS[lang] || LABELS["en-US"];
  const desc = mission.desc[lang] || mission.desc["en-US"];

  const speak = () => {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(mission.ja);
      u.lang = "ja-JP";
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch {}
  };

  const markDone = () => {
    setDone(true);
    try { localStorage.setItem("guu_mission_done", today); } catch {}
    onDone?.(mission.romaji);
  };

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem("guu_mission_dismissed", today); } catch {}
  };

  return (
    <div className="relative bg-[#3D2B1F] rounded-2xl px-4 py-3 shadow-sm">
      <button
        onClick={dismiss}
        className="absolute top-2 right-3 text-[#8B7355] hover:text-[#F5EDE3] transition-colors"
        aria-label="Close"
      >
        <span className="text-sm leading-none">&times;</span>
      </button>

      <p className="text-[10px] font-bold text-[#B8D435] uppercase tracking-wider">
        🍶 {labels.title}
      </p>

      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-lg font-bold text-[#F5EDE3]">{mission.romaji}</span>
        <span className="text-xs text-[#D4C4AE]">{mission.ja}</span>
        {canSpeak && (
          <button
            onClick={speak}
            className="self-center p-1 rounded-full text-[#B8D435] hover:bg-[#F5EDE3]/10 transition-colors"
            aria-label="Play pronunciation"
          >
            <Volume2 size={16} />
          </button>
        )}
      </div>

      <p className="text-[11px] text-[#D4C4AE] mt-1 pr-4">{desc}</p>

      <div className="mt-2">
        {done ? (
          <span className="text-[11px] text-[#B8D435] font-medium">{labels.doneThanks}</span>
        ) : (
          <button
            onClick={markDone}
            className="bg-[#B8D435] text-white text-[11px] font-medium px-3 py-1 rounded-full active:scale-95 transition-transform"
          >
            {labels.done}
          </button>
        )}
      </div>
    </div>
  );
}
