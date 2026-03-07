import {
  loadPage,
  loadFont,
  loadSurahNameFont,
  loadAyatMarkerFont,
  surahNumberToFontCode,
  createLayoutCalculator,
  type MushafLayout,
  type PageLayout,
} from "../../core";

export const CENTERED_PAGES_VERTICAL = [1, 2] as const;
export const CENTERED_PAGES_HORIZONTAL = [1, 2, 602, 603, 604] as const;

const CENTERED_PAGES_HORIZONTAL_SET = new Set<number>(
  CENTERED_PAGES_HORIZONTAL,
);

const STYLES = `
  :host {
    display: block;
    position: relative;
    font-family: system-ui, -apple-system, sans-serif;
    direction: rtl;
    width: 100%;
    box-sizing: border-box;
  }

  .quran-viewer {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .quran-frame {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
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
    overflow: visible;
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
    margin-top: 12px;
    margin-bottom: 56px;
    padding-inline: 12px;
    padding-block: 4px;
    border-radius: 8px;
    font-size: 42px;
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
    padding: 2px;
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
`;

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>${STYLES}</style>
  <div class="quran-viewer">
    <div class="quran-frame">
      <div class="quran-loading">جاري التحميل...</div>
      <div class="quran-content"></div>
    </div>
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

  static get observedAttributes(): string[] {
    return ["page", "mushaf-layout", "width", "height", "theme"];
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
      case "page": {
        const newPage = parseInt(newValue, 10) || 1;
        if (newPage === this.currentPage) return;
        this.currentPage = newPage;
        this.renderPage();
        break;
      }
      case "mushaf-layout":
      case "width":
      case "height":
      case "theme":
        this.initialize();
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
    const maxWidth = parseInt(this.getAttribute("width") || "600", 10);
    const height = parseInt(this.getAttribute("height") || "850", 10);
    const theme = (this.getAttribute("theme") || "light") as "light" | "dark";
    const mushafLayout = this.getAttribute(
      "mushaf-layout",
    ) as MushafLayout | null;
    this.layout = mushafLayout || "hafs-v2";

    this.container.style.maxWidth = `${maxWidth}px`;
    this.container.style.width = "100%";
    this.container.style.height = `${height}px`;
    this.updateTheme(theme);

    const renderedWidth =
      Math.min(maxWidth, this.container.getBoundingClientRect().width) ||
      maxWidth;

    this.calculator = createLayoutCalculator({
      pageWidth: renderedWidth,
      pageHeight: height,
    });

    await this.loadFont();

    try {
      this.updatePageDisplay();
      this.nav.style.display = "flex";
      this.renderPage();
    } catch (error) {
      this.loading.textContent = "فشل في تحميل البيانات";
      console.error("Failed to initialize:", error);
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

    for (const line of pageLayout.lines) {
      const isCenteredLine =
        line.isCentered || CENTERED_PAGES_HORIZONTAL_SET.has(this.currentPage);

      const lineEl = document.createElement("div");
      lineEl.className = "quran-line";
      lineEl.style.cssText = `
        height: ${pageLayout.metrics.lineHeight}px;
        top: ${line.y - pageLayout.metrics.lineHeight + pageLayout.metrics.baselineOffset}px;
        justify-content: ${isCenteredLine ? "center" : "flex-end"};
      `;

      const theme = (this.getAttribute("theme") || "light") as "light" | "dark";
      const surahColor = theme === "dark" ? "#fff" : "#2c3e50";
      const wordColor = theme === "dark" ? "#fff" : "#34495e";
      const hoverBg = theme === "dark" ? "#333" : "#e0e0e0";

      if (line.lineType === "header") {
        const surahEl = document.createElement("div");
        surahEl.className = "quran-surah-name";
        surahEl.style.cssText = `
          color: ${surahColor}; 
          border: 2px solid ${surahColor};
        `;

        if (line.surahNumber) {
          surahEl.textContent = surahNumberToFontCode(line.surahNumber);
        } else {
          surahEl.textContent = `surah000`;
        }

        lineEl.appendChild(surahEl);
      } else {
        const lineContent = document.createElement("div");
        lineContent.className = "quran-line-content";
        lineContent.style.cssText = `
          justify-content: ${isCenteredLine ? "center" : "space-between"};
        `;

        for (const word of line.words) {
          const wordEl = document.createElement("span");
          wordEl.className = "quran-word";

          const isEndMarker =
            word.charType === "end" && this.layout === "hafs-unicode";

          if (isEndMarker) {
            wordEl.classList.add("ayah-end");
            wordEl.textContent = `﴾${word.ayahNumber}﴿`;
            wordEl.style.cssText = `
              font-family: "AyatMarker", "DigitalKhatt", system-ui;
              color: ${wordColor};
              height: ${pageLayout.metrics.lineHeight}px;
              line-height: ${pageLayout.metrics.lineHeight}px;
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
              height: ${pageLayout.metrics.lineHeight}px;
              line-height: ${pageLayout.metrics.lineHeight}px;
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
              new CustomEvent("wordclick", {
                detail: {
                  id: word.id,
                  surahNumber: word.surahNumber,
                  ayahNumber: word.ayahNumber,
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

  private showLoading(show: boolean): void {
    this.loading.style.display = show ? "block" : "none";
  }

  goToPage(page: number): void {
    const oldPage = this.currentPage;
    page = Math.max(1, Math.min(page, this.totalPages));
    if (page !== oldPage) {
      this.currentPage = page;
      this.setAttribute("page", String(page));
      this.renderPage();

      this.dispatchEvent(
        new CustomEvent("pagechange", {
          detail: { page },
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
}

customElements.define("open-quran-view", OpenQuranView);

export function registerOpenQuranView(): void {
  if (!customElements.get("open-quran-view")) {
    customElements.define("open-quran-view", OpenQuranView);
  }
}

export default OpenQuranView;
