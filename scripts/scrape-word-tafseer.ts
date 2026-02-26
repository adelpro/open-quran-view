import axios from "axios";
import * as cheerio from "cheerio";
import {writeFileSync, readFileSync, mkdirSync} from "fs";

/* simple data shapes */
interface WordObj {
    text: string;
    tafseer: string;
    verse: number;
    surah: number;
}

interface VerseObj {
    tafseer: string;
    verse: number;
    surah: number;
}

export type WordMap = Record<string, WordObj | VerseObj>;

/* remove Arabic diacritics (tashkeel) */
export const removeTashkeel = (text: string): string =>
    text
        .replace(/\u0671/g, "\u0627")
        .replace(/[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06FC]/g, "");

/* normalize Arabic text for comparison/keys */
export const normalizeArabic = (text: string): string => {
    if (!text) return "";

    let normalizedText = removeTashkeel(text).normalize("NFC");
    normalizedText = normalizedText.replace(/[\u0670\u0640]/g, "");
    normalizedText = normalizedText.replace(/[إأآٱ]/g, "ا");
    normalizedText = normalizedText.replace(/[ؤئء]/g, "ء");
    normalizedText = normalizedText.replace(/ى/g, "ي");
    normalizedText = normalizedText.replace(/[\r\n]+/g, " ");
    normalizedText = normalizedText.replace(/[^\u0621-\u064A\s-]+/g, "");
    normalizedText = normalizedText.replace(/\s{2,}/g, " ");

    return normalizedText.trim();
};

/* scrape main site to collect per-sura URLs */
async function scrapeSuraUrls(): Promise<string[]> {
    const url = "https://www.quran-words.com/";
    const suraUrls: string[] = [];

    const {data} = await axios.get(url);
    const $ = cheerio.load(data);

    $("table tr").each((_, row) => {
        const link = $(row).find("td").eq(1).find("a").attr("href");
        if (link) suraUrls.push(link);
    });

    return suraUrls;
}

/* scrape a single sura page and build a WordMap */
async function scrapSura(suraUrl: string, surahNumber: number): Promise<WordMap> {
    const {data} = await axios.get(suraUrl);
    const $ = cheerio.load(data);

    const map: WordMap = {};
    let verseNumber = 1;
    let wordPoss = 1;

    $(".tafseer-table > tbody tr").each((_, row) => {
        const cells = $(row).find("td");
        const rawText = cells.eq(1).text().trim();
        const tafseer = cells.eq(2).text().trim();

        if (rawText.startsWith("آية رقم")) {
            // verse-level tafseer
            const key = `${surahNumber}:${verseNumber}`;
            map[key] = {tafseer, verse: verseNumber, surah: surahNumber} as VerseObj;

            // next verse starts — reset word index
            verseNumber++;
            wordPoss = 1;
        } else {
            // word-level tafseer
            const normalized = normalizeArabic(rawText);
            const key = `${surahNumber}:${verseNumber}:${wordPoss++}`;
            if (normalized) {
                map[key] = {
                    text: normalized,
                    tafseer,
                    verse: verseNumber,
                    surah: surahNumber,
                } as WordObj;
            } else {
                // if normalization removed the word, step index back
                wordPoss--;
            }
        }
    });

    return map;
}

/* split a single word into multiple words (keeps tafseer) */
async function splitWordByKey(key: string, splitList: string[], aggregated: WordMap) {
    const removedWords: (WordObj | VerseObj)[] = [];
    const insertWords: [string, WordObj | VerseObj][] = [];

    let increaseIdxBy = 0;

    const parts: string[] = key.split(":");
    const suraId = parts[0];
    const verseId = parts[1];
    const OriginalPossId = parts[2];

    var possId = parseInt(OriginalPossId);

    // remove consecutive entries starting from possId and store them
    while (`${suraId}:${verseId}:${possId}` in aggregated) {
        const iteratorKey: string = `${suraId}:${verseId}:${possId}`;
        removedWords.push(aggregated[iteratorKey]);
        delete aggregated[iteratorKey];
        possId++;
    }

    possId = parseInt(OriginalPossId);

    // create new cloned objects for each split part (to avoid shared references)
    for (const str of splitList) {
        const newObj: WordObj = {...(<WordObj>removedWords[0]), text: str};
        insertWords.push([`${suraId}:${verseId}:${possId + increaseIdxBy}`, newObj]);
        increaseIdxBy++;
    }

    // append the remaining originally-removed words (after the split parts)
    for (const wordObj of removedWords.slice(1)) {
        insertWords.push([`${suraId}:${verseId}:${possId + increaseIdxBy}`, wordObj]);
        increaseIdxBy++;
    }

    // re-insert into aggregated
    for (const [k, v] of insertWords) {
        aggregated[k] = v;
    }
}

/* merge a word with its following word (concatenate text) */
async function mergeWordMap(key: string, aggregated: WordMap) {
    const removedWords: (WordObj | VerseObj)[] = [];
    const insertWords: [string, WordObj | VerseObj][] = [];

    let increaseIdxBy = 0;

    const parts: string[] = key.split(":");
    const suraId = parts[0];
    const verseId = parts[1];
    const OriginalPossId = parts[2];

    var possId = parseInt(OriginalPossId);

    // remove consecutive entries starting from possId and store them
    while (`${suraId}:${verseId}:${possId}` in aggregated) {
        const iteratorKey: string = `${suraId}:${verseId}:${possId}`;
        removedWords.push(aggregated[iteratorKey]);
        delete aggregated[iteratorKey];
        possId++;
    }
    possId = parseInt(OriginalPossId);

    // merge first two into one (concatenate with a space)
    (<WordObj>removedWords[0]).text += " " + (<WordObj>removedWords[1]).text;

    insertWords.push([`${suraId}:${verseId}:${possId++}`, <WordObj>removedWords[0]]);

    // re-insert the rest
    for (const wordObj of removedWords.slice(2)) {
        insertWords.push([`${suraId}:${verseId}:${possId + increaseIdxBy}`, wordObj]);
        increaseIdxBy++;
    }

    for (const [k, v] of insertWords) {
        aggregated[k] = v;
    }
}

/* validate aggregated map against pages.json */
async function testItWithPages(aggregated: WordMap) {
    const pages = JSON.parse(readFileSync("../src/data/pages/hafs-unicode/pages.json", "utf8"));
    let poss = 1;
    let last_sura_number = 1;

    for (let i = 0; i < pages.length; i++) {
        const lines = pages[i]["lines"];
        for (let j = 0; j < lines.length; j++) {
            if (lines[j]["lineType"] != "text") continue;

            const words = lines[j]["words"];
            for (let k = 0; k < words.length; k++) {
                const verseNumber = words[k]["verse"];
                if (last_sura_number != verseNumber) {
                    poss = 1;
                    last_sura_number = verseNumber;
                }
                if (words[k]["charType"] === "word") {
                    const key = `${words[k]["surah"]}:${words[k]["verse"]}:${words[k]["position"]}`;
                    if (!(key in aggregated)) {
                        console.log("Error key not found:", key);
                        continue;
                    }
                    const aggregatedText = (<WordObj>aggregated[key]).text;
                    const pagesText = normalizeArabic(words[k]["text"]);
                    if (aggregatedText != pagesText) {
                        console.log(`Warning: not same words ${pagesText} , ${aggregatedText} with key ${key}`);
                    }
                } else {
                    words[k]["tafseerKey"] = `${words[k]["surah"]}:${words[k]["verse"]}`;
                }
            }
        }
    }
    console.log("please check  all warning and fix them with merge and split lists");
    console.log("duo arabic tashkiel it could be miss compare");
}

/* main flow: scrape, split, merge, sort, save, test */
async function main() {
    const aggregated: WordMap = {};
    const suraUrls = await scrapeSuraUrls();

    for (let idx = 0; idx < suraUrls.length; idx++) {
        const suraMap = await scrapSura(suraUrls[idx], idx + 1);
        Object.assign(aggregated, suraMap); // merge maps (keys are unique)
        console.log(`Scraped sura ${idx + 1}`);
    }

    // split definitions (to adapt to pages.json)
    const splitList = [
        {
            key: "15:7:1",
            splits: ["لو", "ما"],
        },
    ];

    // merge definitions (merge word with next word)
    const mergeList: string[] = ["2:181:3", "8:6:4", "13:37:8", "37:130:3"];

    const numberOfWordBeforeSplit: number = Object.keys(aggregated).length;

    console.log("start splitting dataset from split list");
    for (const split of splitList) {
        const fullWord = split.splits.join("");
        const keyText = (<WordObj>aggregated[split.key]).text;
        if (keyText != fullWord) {
            console.log(`Warning text not match on key ${split.key} check splitList`);
        }

        await splitWordByKey(split.key, split.splits, aggregated);
    }
    const numberOfWordAfterSplit = Object.keys(aggregated).length;

    console.log(`number of words before split: ${numberOfWordBeforeSplit}`);
    console.log(`number of words after split: ${numberOfWordAfterSplit}`);
    console.log(
        `number of words added after splitting: ${numberOfWordAfterSplit - numberOfWordBeforeSplit}`
    );

    console.log("start merging dataset from merge list");

    for (const key of mergeList) {
        await mergeWordMap(key, aggregated);
    }

    // sort keys numerically (if equal parts, longer key wins)
    const sortedKeys = Object.keys(aggregated).sort((a, b) => {
        const partsA = a.split(":").map(Number);
        const partsB = b.split(":").map(Number);

        const minLen = Math.min(partsA.length, partsB.length);

        for (let i = 0; i < minLen; i++) {
            if (partsA[i] !== partsB[i]) return partsA[i] - partsB[i];
        }

        // longer key should come first when prefix-equal
        return partsB.length - partsA.length;
    });

    const sortedAggregated: WordMap = {};
    for (const key of sortedKeys) {
        sortedAggregated[key] = aggregated[key];
    }
    mkdirSync('data/tafseers/', {recursive: true});
    writeFileSync("data/tafseers/quran-words.json", JSON.stringify(sortedAggregated, null, 2));
    console.log("Saved data/tafseers/quran-words.json");

    console.log("\n\nstart testing ...\n");
    await testItWithPages(aggregated);
}

main().catch((err) => {
    console.error("Scrape failed:", err);
    process.exit(1);
});