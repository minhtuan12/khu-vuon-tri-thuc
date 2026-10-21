// Curated lesson content. The single source of truth for vocabulary — AI may only
// pick from these lists; it can never introduce new words.

export type AgeBand = "3-4" | "4-5" | "5-6";
export type AdventureId = "garden" | "colors" | "train";
export type StageType = "intro" | "listen" | "scene" | "move" | "recall" | "celebrate";

export interface Word {
  id: string;
  en: string;
  vi: string;
  sentence: string; // English example sentence
  sentenceVi: string;
}

export interface MovementCue {
  id: string;
  vi: string;
  en: string;
  quietVi: string; // seated alternative when movement is off
}

export interface Adventure {
  id: AdventureId;
  title: string;
  subtitle: string;
  introVi: string;
  sceneVi: string;
  words: Word[];
  movements: MovementCue[];
  parentActivity: string[];
}

export const STAGES: { type: StageType; label: string }[] = [
  { type: "intro", label: "Giới thiệu" },
  { type: "listen", label: "Nghe và chọn" },
  { type: "scene", label: "Khu vườn đổi màu" },
  { type: "move", label: "Vận động" },
  { type: "recall", label: "Nhớ lại" },
  { type: "celebrate", label: "Chúc mừng" },
];

export const ADVENTURES: Adventure[] = [
  {
    id: "garden",
    title: "Đánh thức khu vườn",
    subtitle: "sun · rain · rabbit · apple",
    introVi:
      "Chào bé! Mình là Mầm. Khu vườn đang ngủ say. Bé hãy nghe tiếng Anh và chọn đúng hình để đánh thức khu vườn nhé!",
    sceneVi: "Khu vườn đã thức dậy rồi! Bé chạm vào từng bạn để nghe lại nhé.",
    words: [
      { id: "sun", en: "sun", vi: "mặt trời", sentence: "The sun is shining.", sentenceVi: "Mặt trời đang chiếu sáng." },
      { id: "rain", en: "rain", vi: "mưa", sentence: "The rain is falling.", sentenceVi: "Mưa đang rơi." },
      { id: "rabbit", en: "rabbit", vi: "con thỏ", sentence: "The rabbit can hop.", sentenceVi: "Con thỏ nhảy được." },
      { id: "apple", en: "apple", vi: "quả táo", sentence: "I like the red apple.", sentenceVi: "Bé thích quả táo đỏ." },
    ],
    movements: [
      { id: "stretch-sun", vi: "Vươn hai tay lên cao như ông mặt trời!", en: "Stretch up high like the sun!", quietVi: "Giơ hai bàn tay lên, xòe ngón như tia nắng." },
      { id: "hop-rabbit", vi: "Nhảy nhẹ nhàng như chú thỏ, ba cái nhé!", en: "Hop like a rabbit!", quietVi: "Làm tai thỏ bằng hai ngón tay và gật đầu." },
      { id: "rain-fingers", vi: "Làm mưa rơi bằng các ngón tay, từ trên xuống!", en: "Make the rain fall!", quietVi: "Gõ nhẹ ngón tay lên bàn như mưa rơi." },
    ],
    parentActivity: [
      "Cùng bé tìm một quả táo (hoặc hình quả táo) trong nhà và nói “apple”.",
      "Khi trời nắng hay mưa, hỏi bé: “Sun or rain?” — bé chỉ tay là đủ, không cần nói đúng ngay.",
      "Chơi “nhảy như thỏ” 1 phút và cùng nói “rabbit, hop hop!”.",
    ],
  },
  {
    id: "colors",
    title: "Bữa tiệc sắc màu",
    subtitle: "red · blue · yellow · green",
    introVi:
      "Hôm nay khu vườn mở tiệc! Nhưng những bông hoa chưa có màu. Bé nghe tên màu tiếng Anh và tô màu cho khu vườn nhé!",
    sceneVi: "Khu vườn rực rỡ sắc màu! Bé chạm vào từng màu để nghe lại nhé.",
    words: [
      { id: "red", en: "red", vi: "màu đỏ", sentence: "The flower is red.", sentenceVi: "Bông hoa màu đỏ." },
      { id: "blue", en: "blue", vi: "màu xanh dương", sentence: "The sky is blue.", sentenceVi: "Bầu trời màu xanh dương." },
      { id: "yellow", en: "yellow", vi: "màu vàng", sentence: "The sun is yellow.", sentenceVi: "Mặt trời màu vàng." },
      { id: "green", en: "green", vi: "màu xanh lá", sentence: "The leaf is green.", sentenceVi: "Chiếc lá màu xanh lá." },
    ],
    movements: [
      { id: "touch-red", vi: "Tìm và chạm vào một thứ màu đỏ quanh bé!", en: "Touch something red!", quietVi: "Chỉ tay vào một thứ màu đỏ quanh bé." },
      { id: "spin-rainbow", vi: "Xoay một vòng thật chậm như cầu vồng!", en: "Turn around slowly!", quietVi: "Vẽ cầu vồng trên không bằng ngón tay." },
      { id: "clap-colors", vi: "Vỗ tay bốn cái cho bốn màu nhé!", en: "Clap four times!", quietVi: "Vỗ tay thật nhẹ bốn cái." },
    ],
    parentActivity: [
      "Bày 4 đồ vật đỏ, xanh dương, vàng, xanh lá. Bố mẹ nói tên màu, bé chỉ đồ vật.",
      "Khi đi đường, cùng bé tìm “something red” (một thứ màu đỏ).",
      "Tô một bức tranh nhỏ và gọi tên màu bằng tiếng Anh khi bé dùng màu đó.",
    ],
  },
  {
    id: "train",
    title: "Chuyến tàu bạn thú",
    subtitle: "cat · dog · bird · elephant",
    introVi:
      "Tu tu! Chuyến tàu sắp chạy qua khu vườn. Các bạn thú đang chờ lên tàu. Bé nghe tên tiếng Anh và mời đúng bạn lên tàu nhé!",
    sceneVi: "Đoàn tàu đã đầy bạn thú! Bé chạm vào từng bạn để nghe lại nhé.",
    words: [
      { id: "cat", en: "cat", vi: "con mèo", sentence: "The cat says meow.", sentenceVi: "Con mèo kêu meo meo." },
      { id: "dog", en: "dog", vi: "con chó", sentence: "The dog can run.", sentenceVi: "Con chó chạy được." },
      { id: "bird", en: "bird", vi: "con chim", sentence: "The bird can fly.", sentenceVi: "Con chim bay được." },
      { id: "elephant", en: "elephant", vi: "con voi", sentence: "The elephant is big.", sentenceVi: "Con voi thật to." },
    ],
    movements: [
      { id: "fly-bird", vi: "Dang tay bay như chú chim!", en: "Fly like a bird!", quietVi: "Vẫy hai bàn tay như đôi cánh." },
      { id: "elephant-walk", vi: "Đi chậm và nặng như chú voi, vung vòi nhé!", en: "Walk like an elephant!", quietVi: "Dùng tay làm vòi voi và đung đưa." },
      { id: "train-chug", vi: "Làm đoàn tàu: xoay tay và nói “tu tu”!", en: "Choo choo like a train!", quietVi: "Xoay tròn hai tay trước ngực như bánh tàu." },
    ],
    parentActivity: [
      "Đóng vai con vật: bố mẹ nói “cat”, bé kêu “meo”; nói “dog”, bé kêu “gâu”.",
      "Xem sách tranh con vật, bé chỉ khi nghe tên tiếng Anh.",
      "Xếp hàng làm đoàn tàu trong nhà, mỗi người là một bạn thú.",
    ],
  },
];

export function getAdventure(id: string): Adventure | undefined {
  return ADVENTURES.find((a) => a.id === id);
}

export function optionsForAge(age: AgeBand): number {
  return age === "3-4" ? 2 : age === "4-5" ? 3 : 4;
}

export const AGE_LABELS: Record<AgeBand, string> = {
  "3-4": "3–4 tuổi",
  "4-5": "4–5 tuổi",
  "5-6": "5–6 tuổi",
};
