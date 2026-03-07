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

goBtn.addEventListener("click", () => {
  const page = parseInt(pageInput.value, 10);
  if (page >= 1 && page <= 604) {
    viewer.goToPage(page);
  }
});

pageInput.addEventListener("keypress", (e: KeyboardEvent) => {
  if (e.key === "Enter") {
    const page = parseInt(pageInput.value, 10);
    if (page >= 1 && page <= 604) {
      viewer.goToPage(page);
    }
  }
});

prevBtn.addEventListener("click", () => {
  viewer.goToPage(viewer.page - 1);
  pageInput.value = String(viewer.page);
});

nextBtn.addEventListener("click", () => {
  viewer.goToPage(viewer.page + 1);
  pageInput.value = String(viewer.page);
});

themeSelect.addEventListener("change", () => {
  viewer.setAttribute("theme", themeSelect.value);
});

mushafSelect.addEventListener("change", () => {
  viewer.setAttribute("mushaf-layout", mushafSelect.value);
});

viewer.addEventListener("load", (e: Event) => {
  console.log("Page loaded:", (e as CustomEvent).detail);
});

viewer.addEventListener("wordclick", (e: Event) => {
  const detail = (e as CustomEvent).detail as {
    id: number;
    surahNumber?: number;
    ayahNumber?: number;
  };
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
