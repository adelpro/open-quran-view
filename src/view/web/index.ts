import {
  getBismillahWords,
  loadPage,
  loadFont,
  loadSurahNameFont,
  loadAyatMarkerFont,
  surahNumberToFontCode,
  createLayoutCalculator,
  type MushafLayout,
  type PageLayout,
  type Word,
  type WordLocation,
} from "../../core";

const STYLES = `
  :host {
    display: block;
    position: relative;
    overflow: hidden;
    font-family: system-ui, -apple-system, sans-serif;
    direction: rtl;
  }

  .quran-viewer {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .quran-loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: inherit;
  }

  .quran-content {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .quran-line {
    position: absolute;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    padding: 2px;
  }

  .quran-line-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    gap: 4px;
  }

  .quran-surah-name {
    font-weight: bold;
    font-family: "SurahNameFont", system-ui, -apple-system, sans-serif !important;
    text-align: center;
    width: 100%;
    box-sizing: border-box;
    padding-inline: 12px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .quran-word {
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    transition: background 0.2s;
    font-size: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    flex-shrink: 0;
  }

  .quran-word.ayah-end {
    padding: 0px;
    min-width: auto;
    width: auto;
  }

  .quran-nav {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px;
    border-radius: 50px;
    backdrop-filter: blur(10px);
  }

  .quran-nav button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transition: all 0.2s ease;
    font-family: system-ui, -apple-system, sans-serif;
    background: transparent;
  }

  .quran-nav button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .quran-nav button:not(:disabled):hover {
    background: rgba(255,255,255,0.1);
  }

  .quran-page-display {
    background: transparent;
    border: none;
    font-size: 14px;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 8px;
    transition: all 0.2s ease;
    font-family: system-ui, -apple-system, sans-serif;
    font-weight: 500;
  }

  .quran-page-display:hover {
    background: rgba(255,255,255,0.05);
  }

  .quran-nav input {
    width: 60px;
    height: 32px;
    text-align: center;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .quran-highlight-segment {
    position: absolute;
    height: calc(100% - 4px);
    top: 2px;
    z-index: 0;
    pointer-events: none;
    transition: all 0.2s ease;
  }
`;

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>${STYLES}</style>
  <div class="quran-viewer">
    <div class="quran-loading">جاري التحميل...</div>
    <div class="quran-content"></div>
    <div class="quran-nav" style="display: none;">
      <button class="quran-prev" title="السابق">❮</button>
      <button class="quran-page-display"></button>
      <input type="number" class="quran-page-input" min="1" style="display: none;" />
      <button class="quran-next" title="التالي">❯</button>
    </div>
  </div>
`;

export interface OpenQuranViewProps {
  page?: string;
  mushafLayout?: MushafLayout;
  width?: string;
  height?: string;
  theme?: "light" | "dark";
}

export class OpenQuranView extends HTMLElement {
  private layout: MushafLayout = "hafs-v2";
  private calculator: ReturnType<typeof createLayoutCalculator> | null = null;
  private currentPage: number = 1;
  private totalPages: number = 604;
  private container: HTMLElement;
  private content: HTMLElement;
  private loading: HTMLElement;
  private nav: HTMLElement;
  private pageInput: HTMLInputElement;
  private pageDisplay: HTMLButtonElement;
  private prevBtn: HTMLButtonElement;
  private nextBtn: HTMLButtonElement;
  private fontLoaded: boolean = false;
  private fontFaceSheet: HTMLStyleElement | null = null;
  private showingInput: boolean = false;
  private bismillahWords: Word[] = [];
  private highlightedWords: WordLocation[] = [];
  private highlightedVerse: { surah: number; verse: number } | null = null;
  private wordHighlightColor: string = "rgba(255, 215, 0, 0.5)";
  private verseHighlightColor: string = "rgba(135, 206, 250, 0.25)";
  private showNavigation: boolean = false;

  static get observedAttributes(): string[] {
    return [
      "page",
      "mushaf-layout",
      "width",
      "height",
      "theme",
      "highlighted-words",
      "highlighted-verse",
      "word-highlight-color",
      "verse-highlight-color",
      "navigation-controls",
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot?.appendChild(TEMPLATE.content.cloneNode(true));

    this.container = this.shadowRoot!.querySelector(".quran-viewer")!;
    this.content = this.shadowRoot!.querySelector(".quran-content")!;
    this.loading = this.shadowRoot!.querySelector(".quran-loading")!;
    this.nav = this.shadowRoot!.querySelector(".quran-nav")!;
    this.pageInput = this.shadowRoot!.querySelector(".quran-page-input")!;
    this.pageDisplay = this.shadowRoot!.querySelector(".quran-page-display")!;
    this.prevBtn = this.shadowRoot!.querySelector(".quran-prev")!;
    this.nextBtn = this.shadowRoot!.querySelector(".quran-next")!;

    this.bindEvents();
  }

  connectedCallback(): void {
    this.initialize();
  }

  disconnectedCallback(): void {
    this.calculator = null;
  }

  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string,
  ): void {
    if (oldValue === newValue) return;

    switch (name) {
      case "page":
        this.currentPage = parseInt(newValue, 10) || 1;
        this.loadFontForPage(this.layout, this.currentPage).then(() => {
          this.renderPage();
        });
        break;
      case "mushaf-layout":
      case "width":
      case "height":
      case "theme":
        this.initialize();
        break;
      case "highlighted-words":
        try {
          this.highlightedWords = JSON.parse(newValue) || [];
          this.applyHighlights();
        } catch (e) {
          console.error("Failed to parse highlighted-words:", e);
        }
        break;
      case "highlighted-verse":
        try {
          this.highlightedVerse = JSON.parse(newValue) || null;
          this.applyHighlights();
        } catch (e) {
          console.error("Failed to parse highlighted-verse:", e);
        }
        break;
      case "word-highlight-color":
        this.wordHighlightColor = newValue || "rgba(255, 215, 0, 0.5)";
        this.applyHighlights();
        break;
      case "verse-highlight-color":
        this.verseHighlightColor = newValue || "rgba(135, 206, 250, 0.25)";
        this.applyHighlights();
        break;
      case "navigation-controls":
        this.showNavigation = newValue === "true";
        this.nav.style.display = this.showNavigation ? "flex" : "none";
        break;
    }
  }

  private bindEvents(): void {
    this.prevBtn.addEventListener("click", () =>
      this.goToPage(this.currentPage - 1),
    );
    this.nextBtn.addEventListener("click", () =>
      this.goToPage(this.currentPage + 1),
    );

    this.pageDisplay.addEventListener("click", () => {
      this.showingInput = true;
      this.pageDisplay.style.display = "none";
      this.pageInput.style.display = "block";
      this.pageInput.value = String(this.currentPage);
      this.pageInput.focus();
    });

    this.pageInput.addEventListener("blur", () => {
      setTimeout(() => {
        this.showingInput = false;
        this.pageInput.style.display = "none";
        this.pageDisplay.style.display = "block";
      }, 200);
    });

    this.pageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const page = parseInt(this.pageInput.value, 10);
        if (page >= 1 && page <= this.totalPages) {
          this.goToPage(page);
        }
        this.pageInput.blur();
      }
    });
  }

  private async initialize(): Promise<void> {
    const widthAttr = this.getAttribute("width");
    const heightAttr = this.getAttribute("height");
    const theme = (this.getAttribute("theme") || "light") as "light" | "dark";
    const mushafLayout = this.getAttribute(
      "mushaf-layout",
    ) as MushafLayout | null;
    this.layout = mushafLayout || "hafs-v2";

    const width = widthAttr ? parseInt(widthAttr, 10) : 600;
    const height = heightAttr
      ? parseInt(heightAttr, 10)
      : this.clientHeight || 850;

    this.container.style.width = widthAttr ? `${width}px` : "100%";
    this.container.style.height = heightAttr ? `${height}px` : "100%";

    this.calculator = createLayoutCalculator({
      pageWidth: widthAttr ? width : height * 0.7,
      pageHeight: height,
    });

    this.updateTheme(theme);

    await this.loadFont();

    this.bismillahWords = await getBismillahWords(this.layout);

    try {
      this.updatePageDisplay();
      this.nav.style.display = this.showNavigation ? "flex" : "none";
      this.renderPage();
    } catch (error) {
      this.loading.textContent = "فشل في تحميل البيانات";
      console.error("Failed to initialize:", error);
    }

    if (!heightAttr) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const rect = entry.contentRect;
          if (rect.height > 0) {
            let newHeight = rect.height;
            let newWidth = widthAttr ? width : newHeight * 0.7;

            if (!widthAttr && rect.width > 0 && newHeight * 0.7 > rect.width) {
              newHeight = rect.width / 0.7;
              newWidth = rect.width;
            }

            this.calculator = createLayoutCalculator({
              pageWidth: newWidth,
              pageHeight: newHeight,
            });
            this.renderPage();
          }
        }
      });
      resizeObserver.observe(this);
    }
  }

  private async loadFont(): Promise<void> {
    if (this.fontLoaded) return;

    await loadFont(this.layout, this.currentPage);
    await loadSurahNameFont();
    if (this.layout === "hafs-unicode") {
      await loadAyatMarkerFont();
    }

    this.fontFaceSheet = document.createElement("style");
    this.fontFaceSheet.textContent = `
      .quran-word, .quran-surah-name {
        font-family: "QuranFont", system-ui, -apple-system, sans-serif !important;
      }
    `;
    this.shadowRoot?.appendChild(this.fontFaceSheet);
    this.fontLoaded = true;
  }

  private async loadFontForPage(layout: MushafLayout, page: number): Promise<void> {
    if (layout === "hafs-unicode") {
      await loadFont(layout, page);
      return;
    }
    await loadFont(layout, page);
  }

  private updateTheme(theme: "light" | "dark"): void {
    const bgColor = theme === "dark" ? "#1a1a2e" : "#fafafa";
    const textColor = theme === "dark" ? "#fff" : "#333";
    const navBg =
      theme === "dark" ? "rgba(26,26,46,0.85)" : "rgba(255,255,255,0.85)";
    const navBorder =
      theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
    const navShadow =
      theme === "dark"
        ? "0 4px 20px rgba(0,0,0,0.5)"
        : "0 4px 20px rgba(0,0,0,0.1)";
    const buttonBorder =
      theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)";
    const buttonColor = theme === "dark" ? "#fff" : "#2c3e50";
    const inputBg =
      theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.9)";
    const inputBorder =
      theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)";
    const inputColor = theme === "dark" ? "#fff" : "#2c3e50";
    const displayColor =
      theme === "dark" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)";

    this.container.style.background = bgColor;
    this.loading.style.color = textColor;

    this.nav.style.background = navBg;
    this.nav.style.border = `1px solid ${navBorder}`;
    this.nav.style.boxShadow = navShadow;

    this.prevBtn.style.border = `1px solid ${buttonBorder}`;
    this.prevBtn.style.color = buttonColor;
    this.nextBtn.style.border = `1px solid ${buttonBorder}`;
    this.nextBtn.style.color = buttonColor;

    this.pageDisplay.style.color = displayColor;

    this.pageInput.style.background = inputBg;
    this.pageInput.style.borderColor = inputBorder;
    this.pageInput.style.color = inputColor;
    this.pageInput.style.border = `1px solid ${inputBorder}`;
  }

  private updatePageDisplay(): void {
    this.pageDisplay.textContent = `${this.currentPage} / ${this.totalPages}`;
  }

  private async renderPage(): Promise<void> {
    if (!this.calculator) return;

    this.showLoading(true);
    this.updatePageDisplay();
    this.prevBtn.disabled = this.currentPage <= 1;
    this.nextBtn.disabled = this.currentPage >= this.totalPages;

    try {
      const quranPage = await loadPage(this.layout, this.currentPage);
      if (!quranPage) {
        throw new Error("Page not found");
      }
      const pageLayout = this.calculator.calculatePageLayout(quranPage);
      await this.renderLayout(pageLayout);
      this.applyHighlights();
      this.showLoading(false);

      this.dispatchEvent(
        new CustomEvent("load", {
          detail: pageLayout,
          bubbles: false,
          composed: true,
        }),
      );
    } catch (error) {
      this.loading.textContent = "فشل في تحميل الصفحة";
      console.error("Failed to load page:", error);
    }
  }

  private async renderLayout(pageLayout: PageLayout): Promise<void> {
    this.content.innerHTML = "";

    const CENTERED_PAGES_HORIZONTAL_SET = new Set<number>([
      1, 2, 602, 603, 604,
    ]);

    for (const line of pageLayout.lines) {
      const isCenteredLine =
        line.isCentered || CENTERED_PAGES_HORIZONTAL_SET.has(this.currentPage);

      const lineEl = document.createElement("div");
      lineEl.className = "quran-line";
      // Use dynamic line height if available, fallback to metrics
      const lineHeight = line.height || pageLayout.metrics.lineHeight;
      const top = line.y - lineHeight / 2;

      lineEl.style.cssText = `
        height: ${lineHeight}px;
        top: ${top}px;
        justify-content: ${isCenteredLine ? "center" : "flex-end"};
      `;

      const theme = (this.getAttribute("theme") || "light") as "light" | "dark";
      const surahColor = theme === "dark" ? "#fff" : "#2c3e50";
      const wordColor = theme === "dark" ? "#fff" : "#34495e";
      const hoverBg = theme === "dark" ? "#333" : "#e0e0e0";

      const highlightSegment = document.createElement("div");
      highlightSegment.className = "quran-highlight-segment";
      lineEl.appendChild(highlightSegment);

      if (line.lineType === "header") {
        const headerFontSize = Math.min(42, Math.max(16, lineHeight - 10));
        const headerLineHeight = Math.max(12, lineHeight - 4);

        const surahEl = document.createElement("div");
        surahEl.className = "quran-surah-name";
        surahEl.style.cssText = `
          color: ${surahColor}; 
          border: 2px solid ${surahColor};
          height: ${lineHeight}px;
          line-height: ${headerLineHeight}px;
          font-size: ${headerFontSize}px;
          margin: 0;
          padding-block: 0;
        `;

        if (line.surahNumber) {
          surahEl.textContent = surahNumberToFontCode(line.surahNumber);
        } else {
          surahEl.textContent = `surah000`;
        }

        lineEl.appendChild(surahEl);
      } else if (line.lineType === "bismillah") {
        const lineContent = document.createElement("div");
        lineContent.className = "quran-line-content";
        lineContent.style.cssText = `
          justify-content: ${isCenteredLine ? "center" : "space-between"};
        `;

        for (const word of this.bismillahWords) {
          const wordEl = document.createElement("span");
          wordEl.className = "quran-word";
          wordEl.dataset.surah = "1";
          wordEl.dataset.verse = "0";
          wordEl.dataset.position = String(word.position);

          wordEl.textContent = word.text || `[${word.id}]`;
          wordEl.style.cssText = `
            font-family: ${
              this.layout === "hafs-unicode"
                ? '"DigitalKhatt", "Scheherazade New", "Amiri", system-ui, -apple-system, sans-serif'
                : '"QuranFont", system-ui, -apple-system, sans-serif'
            };
            color: ${wordColor};
            height: ${lineHeight}px;
            line-height: ${lineHeight}px;
          `;

          wordEl.addEventListener("mouseenter", () => {
            wordEl.style.background = hoverBg;
          });
          wordEl.addEventListener("mouseleave", () => {
            wordEl.style.background = "transparent";
          });
          wordEl.addEventListener("click", () => {
            this.dispatchEvent(
              new CustomEvent("wordClick", {
                detail: {
                  id: word.id,
                  surahNumber: 1,
                  ayahNumber: 0,
                },
                bubbles: false,
                composed: true,
              }),
            );
          });

          lineContent.appendChild(wordEl);
        }

        lineEl.appendChild(lineContent);
      } else {
        const lineContent = document.createElement("div");
        lineContent.className = "quran-line-content";
        lineContent.style.cssText = `
          justify-content: ${isCenteredLine ? "center" : "space-between"};
        `;

        for (const word of line.words) {
          const wordEl = document.createElement("span");
          wordEl.className = "quran-word";
          wordEl.dataset.surah = String(word.surah);
          wordEl.dataset.verse = String(word.verse);
          wordEl.dataset.position = String(word.position);

          const isEndMarker =
            word.charType === "end" && this.layout === "hafs-unicode";

          if (isEndMarker) {
            wordEl.classList.add("ayah-end");
            wordEl.textContent = word.text || `﴾${word.verse}﴿`;
            wordEl.style.cssText = `
              font-family: "AyatMarker", "DigitalKhatt", system-ui;
              color: ${wordColor};
              height: ${lineHeight}px;
              line-height: ${lineHeight}px;
            `;
          } else {
            wordEl.textContent = word.text || `[${word.id}]`;
            wordEl.style.cssText = `
              font-family: ${
                this.layout === "hafs-unicode"
                  ? '"DigitalKhatt", "Scheherazade New", "Amiri", system-ui, -apple-system, sans-serif'
                  : '"QuranFont", system-ui, -apple-system, sans-serif'
              };
              color: ${wordColor};
              height: ${lineHeight}px;
              line-height: ${lineHeight}px;
            `;
          }

          wordEl.addEventListener("mouseenter", () => {
            wordEl.style.background = hoverBg;
          });
          wordEl.addEventListener("mouseleave", () => {
            wordEl.style.background = "transparent";
          });
          wordEl.addEventListener("click", () => {
            this.dispatchEvent(
              new CustomEvent("wordClick", {
                detail: {
                  id: word.id,
                  surahNumber: word.surah,
                  ayahNumber: word.verse,
                },
                bubbles: false,
                composed: true,
              }),
            );
          });

          lineContent.appendChild(wordEl);
        }

        lineEl.appendChild(lineContent);
      }

      this.content.appendChild(lineEl);
    }
  }

  private applyHighlights(): void {
    if (!this.shadowRoot || !this.content) return;

    const wordEls = this.shadowRoot.querySelectorAll(".quran-word");
    const lineEls = this.shadowRoot.querySelectorAll(".quran-line");

    // Clear previous highlights
    wordEls.forEach((el) => {
      const wordEl = el as HTMLElement;
      wordEl.style.background = "transparent";
      wordEl.style.borderRadius = "4px";
      wordEl.style.boxShadow = "none";
      wordEl.style.zIndex = "auto";
      wordEl.style.position = "relative";
    });
    lineEls.forEach((el) => {
      (el as HTMLElement).style.backgroundColor = "transparent";
    });

    // Apply verse highlights first (so word highlights can stay on top)
    if (this.highlightedVerse) {
      const { surah, verse } = this.highlightedVerse;
      const lines = this.shadowRoot.querySelectorAll(".quran-line");

      lines.forEach((lineEl) => {
        const words = Array.from(
          lineEl.querySelectorAll(".quran-word"),
        ) as HTMLElement[];
        const highlightedWords = words.filter(
          (w) =>
            w.getAttribute("data-surah") === String(surah) &&
            w.getAttribute("data-verse") === String(verse),
        );

        const segmentEl = lineEl.querySelector(
          ".quran-highlight-segment",
        ) as HTMLElement;
        if (!segmentEl) return;

        if (highlightedWords.length > 0) {
          const firstIdx = words.indexOf(highlightedWords[0]);
          const lastIdx = words.indexOf(
            highlightedWords[highlightedWords.length - 1],
          );

          const firstEl = highlightedWords[0];
          const lastEl = highlightedWords[highlightedWords.length - 1];

          // RTL: first word is on the right, last word is on the left
          const rightEdge = firstEl.offsetLeft + firstEl.offsetWidth;
          const leftEdge = lastEl.offsetLeft;

          const isStart =
            firstIdx === 0 ||
            words[firstIdx - 1].getAttribute("data-verse") !== String(verse);
          const isEnd =
            lastIdx === words.length - 1 ||
            words[lastIdx + 1].getAttribute("data-verse") !== String(verse);

          segmentEl.style.display = "block";
          segmentEl.style.left = `${leftEdge}px`;
          segmentEl.style.width = `${rightEdge - leftEdge}px`;
          segmentEl.style.backgroundColor = this.verseHighlightColor;
          segmentEl.style.borderTopRightRadius = isStart ? "8px" : "0";
          segmentEl.style.borderBottomRightRadius = isStart ? "8px" : "0";
          segmentEl.style.borderTopLeftRadius = isEnd ? "8px" : "0";
          segmentEl.style.borderBottomLeftRadius = isEnd ? "8px" : "0";
        } else {
          segmentEl.style.display = "none";
        }
      });
    }

    // Apply word highlights (these take precedence)
    this.highlightedWords.forEach((hw) => {
      const el = this.shadowRoot?.querySelector(
        `.quran-word[data-surah="${hw.surah}"][data-verse="${hw.verse}"][data-position="${hw.position}"]`,
      ) as HTMLElement;
      if (el) {
        el.style.backgroundColor = this.wordHighlightColor;
        el.style.zIndex = "2"; // Ensure word highlight is above verse highlight
      }
    });
  }

  private showLoading(show: boolean): void {
    this.loading.style.display = show ? "block" : "none";
  }

  goToPage(page: number): void {
    const oldPage = this.currentPage;
    page = Math.max(1, Math.min(page, this.totalPages));
    if (page !== oldPage) {
      this.currentPage = page;
      this.renderPage();

      this.dispatchEvent(
        new CustomEvent("pageChange", {
          detail: page,
          bubbles: false,
          composed: true,
        }),
      );
    }
  }

  get page(): number {
    return this.currentPage;
  }

  set page(value: number) {
    this.setAttribute("page", String(value));
  }

  get mushafLayoutAttr(): MushafLayout {
    return this.layout;
  }

  set mushafLayoutAttr(value: MushafLayout) {
    this.setAttribute("mushaf-layout", value);
  }

  get wordsHighlight(): WordLocation[] {
    return this.highlightedWords;
  }

  set wordsHighlight(value: WordLocation[]) {
    this.setAttribute("highlighted-words", JSON.stringify(value));
  }

  get verseHighlight(): { surah: number; verse: number } | null {
    return this.highlightedVerse;
  }

  set verseHighlight(value: { surah: number; verse: number } | null) {
    this.setAttribute("highlighted-verse", JSON.stringify(value));
  }

  get wordHighlightColorOverride(): string {
    return this.wordHighlightColor;
  }

  set wordHighlightColorOverride(value: string) {
    this.setAttribute("word-highlight-color", value);
  }

  get verseHighlightColorOverride(): string {
    return this.verseHighlightColor;
  }

  set verseHighlightColorOverride(value: string) {
    this.setAttribute("verse-highlight-color", value);
  }
}

customElements.define("open-quran-view", OpenQuranView);

export function registerOpenQuranView(): void {
  if (!customElements.get("open-quran-view")) {
    customElements.define("open-quran-view", OpenQuranView);
  }
}

export default OpenQuranView;
