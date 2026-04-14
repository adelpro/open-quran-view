interface OpenQuranViewElement extends HTMLElement {
  page: number;
  mushafLayoutAttr: string;
  goToPage(page: number): void;
}

declare global {
  interface HTMLElementTagNameMap {
    "open-quran-view": OpenQuranViewElement;
  }
}

import { registerOpenQuranView } from "open-quran-view/view/web";

interface WordTafseer {
  text: string;
  tafseer: string;
  verse: number;
  surah: number;
}

interface VerseTafseer {
  tafseer: string;
  verse: number;
  surah: number;
}

type WordMap = Record<string, WordTafseer | VerseTafseer>;

registerOpenQuranView();

const viewer = document.getElementById("quran-viewer") as OpenQuranViewElement;
const pageInput = document.getElementById("page-input") as HTMLInputElement;
const themeSelect = document.getElementById(
  "theme-select",
) as HTMLSelectElement;
const mushafSelect = document.getElementById(
  "mushaf-select",
) as HTMLSelectElement;
const goBtn = document.getElementById("go-btn") as HTMLButtonElement;
const prevBtn = document.getElementById("prev-btn") as HTMLButtonElement;
const nextBtn = document.getElementById("next-btn") as HTMLButtonElement;
const wordInfo = document.getElementById("word-info") as HTMLDivElement;
const tafseerDialog = document.getElementById(
  "tafseer-dialog",
) as HTMLDialogElement;
const tafseerContent = document.getElementById(
  "tafseer-content",
) as HTMLDivElement;

let quranWords: WordMap = {};

fetch("/data/tafseers/quran-words.json")
  .then((res) => res.json())
  .then((data) => {
    quranWords = data as WordMap;
  })
  .catch(console.error);

function closeTafseerDialog() {
  tafseerDialog.close();
  tafseerContent.innerHTML = "";
}

tafseerDialog.addEventListener("click", (e) => {
  if (e.target === tafseerDialog) {
    closeTafseerDialog();
  }
});

goBtn.addEventListener("click", () => {
  const page = parseInt(pageInput.value, 10);
  if (page >= 1 && page <= 604) {
    viewer.setAttribute("page", String(page));
  }
});

pageInput.addEventListener("keypress", (e: KeyboardEvent) => {
  if (e.key === "Enter") {
    const page = parseInt(pageInput.value, 10);
    if (page >= 1 && page <= 604) {
      viewer.setAttribute("page", String(page));
    }
  }
});

prevBtn.addEventListener("click", () => {
  const currentPage = parseInt(viewer.getAttribute("page") || "1", 10);
  viewer.setAttribute("page", String(Math.max(1, currentPage - 1)));
  pageInput.value = viewer.getAttribute("page") || "1";
});

nextBtn.addEventListener("click", () => {
  const currentPage = parseInt(viewer.getAttribute("page") || "1", 10);
  viewer.setAttribute("page", String(Math.min(604, currentPage + 1)));
  pageInput.value = viewer.getAttribute("page") || "1";
});

themeSelect.addEventListener("change", () => {
  viewer.setAttribute("theme", themeSelect.value);
});

mushafSelect.addEventListener("change", () => {
  viewer.setAttribute("mushaf-layout", mushafSelect.value);
});

viewer.addEventListener("load", (e: Event) => {
  // console.log("Page loaded:", (e as CustomEvent).detail);
});

viewer.addEventListener("wordclick", (e: Event) => {
  const detail = (e as CustomEvent).detail as {
    id: number;
    surahNumber?: number;
    ayahNumber?: number;
    position?: number;
    text?: string;
    charType?: string;
  };

  if (detail.charType === "end") {
    const verseKey = `${detail.surahNumber}:${detail.ayahNumber}`;
    const verseTafseer = quranWords[verseKey] as VerseTafseer | undefined;
    if (verseTafseer) {
      tafseerContent.innerHTML = `
        <div class="tafseer-header">
          <span class="tafseer-surah">سورة ${verseTafseer.surah}</span>
          <span class="tafseer-verse">آية ${verseTafseer.verse}</span>
        </div>
        <div class="tafseer-text">${verseTafseer.tafseer}</div>
        <div class="tafseer-actions">
          <button class="tafseer-close" id="tafseer-close-btn">إغلاق</button>
        </div>
      `;
      tafseerDialog.showModal();
      document
        .getElementById("tafseer-close-btn")
        ?.addEventListener("click", closeTafseerDialog);
    }
    return;
  }

  if (detail.charType === "word" && detail.position) {
    const wordKey = `${detail.surahNumber}:${detail.ayahNumber}:${detail.position}`;
    const wordTafseer = quranWords[wordKey] as WordTafseer | undefined;
    if (wordTafseer) {
      tafseerContent.innerHTML = `
        <div class="tafseer-header">
          <span class="tafseer-surah">سورة ${wordTafseer.surah}</span>
          <span class="tafseer-position">الموقع - ${detail.position}</span>
          <span class="tafseer-verse">آية ${wordTafseer.verse}</span>
        </div>
        <div class="tafseer-word">${wordTafseer.text}</div>
        <div class="tafseer-text">${wordTafseer.tafseer}</div>
        <div class="tafseer-actions">
          <button class="tafseer-close" id="tafseer-close-btn">إغلاق</button>
        </div>
      `;
      tafseerDialog.showModal();
      document
        .getElementById("tafseer-close-btn")
        ?.addEventListener("click", closeTafseerDialog);
    }
    return;
  }

  wordInfo.innerHTML = `
    <strong>Word Clicked:</strong><br>
    ID: ${detail.id} | Surah: ${detail.surahNumber ?? "N/A"} | Ayah: ${detail.ayahNumber ?? "N/A"}
  `;
});

viewer.addEventListener("pagechange", (e: Event) => {
  const detail = (e as CustomEvent).detail as { page: number };
  pageInput.value = String(detail.page);
});

console.log("Open Quran View web example loaded successfully");
