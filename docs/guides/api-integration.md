# Quran Foundation API Integration Guide

> Official documentation for the Quran Foundation API - understanding Mushaf pagination and content APIs.

---

## Table of Contents

1. [Introduction](#introduction)
2. [API Overview](#api-overview)
3. [Authentication](#authentication)
4. [Content API](#content-api)
5. [Pages Lookup](#pages-lookup)
6. [Verses API](#verses-api)
7. [Implementation Patterns](#implementation-patterns)
8. [Mushaf IDs](#mushaf-ids)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

The Quran Foundation API provides comprehensive access to Quranic content, Mushaf layouts, and metadata. This guide covers the key endpoints used by open-quran-view for data generation.

### API Base URL

```
https://apis.quran.foundation/content/api/v4
```

### OAuth URL

```
https://oauth2.quran.foundation/oauth2/token
```

---

## API Overview

### Available Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/chapters` | GET | Get all 114 surahs |
| `/juzs` | GET | Get all 30 juz |
| `/verses/by_page/{page}` | GET | Get verses for a specific page |
| `/pages/lookup` | GET | Lookup page boundaries for chapters/juz/verses |

---

## Authentication

The API uses OAuth 2.0 with client credentials flow.

### Getting Credentials

1. Register at [Quran.com API](https://quran.com/api)
2. Obtain `QF_CLIENT_ID` and `QF_CLIENT_SECRET`
3. Store in `.env` file:

```env
QF_CLIENT_ID=your_client_id
QF_CLIENT_SECRET=your_client_secret
```

### Getting Access Token

```typescript
async function getAccessToken(
  clientId: string,
  clientSecret: string
): Promise<string> {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://oauth2.quran.foundation/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=content',
  });

  if (!response.ok) {
    throw new Error('Failed to get access token');
  }

  const data = await response.json();
  return data.access_token;
}
```

### Using the Token

Include the token in requests:

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "https://apis.quran.foundation/content/api/v4/chapters"
```

---

## Content API

### Get All Chapters (Surahs)

```bash
curl -H "Authorization: Bearer TOKEN" \
  "https://apis.quran.foundation/content/api/v4/chapters"
```

**Response:**

```json
[
  {
    "id": 1,
    "nameSimple": "Al-Fatihah",
    "nameComplex": "The Opening",
    "nameArabic": "ٱلْفَاتِحَة",
    "versesCount": 7,
    "revelationPlace": "makkah",
    "revelationOrder": 5,
    "bismillahPre": false,
    "pages": [1, 1],
    "translatedName": {
      "languageName": "english",
      "name": "The Opening"
    }
  }
  // ... 113 more surahs
]
```

### Get All Juz

```bash
curl -H "Authorization: Bearer TOKEN" \
  "https://apis.quran.foundation/content/api/v4/juzs"
```

**Response:**

```json
[
  {
    "id": 1,
    "juzNumber": 1,
    "firstVerseId": 1,
    "lastVerseId": 148,
    "versesCount": 148,
    "verseMapping": { "1": "1", "2": "1", ... }
  }
  // ... 59 more entries (each juz appears twice)
]
```

---

## Pages Lookup

### Endpoint

```
GET https://apis.quran.foundation/content/api/v4/pages/lookup
```

### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `mushaf` | number | Mushaf ID (required) |
| `chapter_number` | number | Chapter 1-114 |
| `juz_number` | number | Juz 1-30 |
| `page_number` | number | Page 1-604 |
| `from` | string | Starting verse key (e.g., "2:255") |
| `to` | string | Ending verse key |

### Example: Lookup Chapter Pages

```bash
curl -H "Authorization: Bearer TOKEN" \
  "https://apis.quran.foundation/content/api/v4/pages/lookup?chapter_number=2&mushaf=1"
```

**Response:**

```json
{
  "lookupRange": {
    "from": "2:1",
    "to": "2:286"
  },
  "pages": {
    "2": {
      "from": "2:1",
      "to": "2:5",
      "firstVerseKey": "2:1",
      "lastVerseKey": "2:5"
    },
    "3": {
      "from": "2:6",
      "to": "2:16"
    }
    // ... more pages
  },
  "totalPage": 48
}
```

---

## Verses API

### Get Verses by Page

```bash
curl -H "Authorization: Bearer TOKEN" \
  "https://apis.quran.foundation/content/api/v4/verses/by_page/1?mushaf=1&words=true"
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `mushaf` | number | Mushaf ID (required) |
| `words` | boolean | Include word-level data |
| `word_fields` | string | Fields to include for words |
| `from` | string | Starting verse key |
| `to` | string | Ending verse key |

### Word Fields

| Field | Description |
|-------|-------------|
| `code_v2` | QCF glyph code for V2/V4 layouts |
| `text_qpc_hafs` | Unicode text (fallback) |
| `line_number` | Line on page (1-15) |
| `page_number` | Page number |
| `position` | Position in verse |

### Example Response (Page 1)

```json
{
  "verses": [
    {
      "id": 1,
      "verse_key": "1:1",
      "words": [
        {
          "id": 1,
          "position": 1,
          "page_number": 1,
          "line_number": 2,
          "text_qpc_hafs": "بِسْمِ",
          "code_v2": "ﱁ"
        }
      ]
    }
  ]
}
```

---

## Implementation Patterns

### Pattern: Page-by-Page Navigation

```typescript
class MushafNavigator {
  private mushafId: number;
  private accessToken: string;
  private pagesLookup: any = null;

  constructor(mushafId: number, accessToken: string) {
    this.mushafId = mushafId;
    this.accessToken = accessToken;
  }

  async loadChapter(chapterNumber: number) {
    const response = await fetch(
      `${API_BASE}/pages/lookup?chapter_number=${chapterNumber}&mushaf=${this.mushafId}`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );
    this.pagesLookup = await response.json();
    return this.pagesLookup;
  }

  async getPageVerses(pageNumber: number) {
    const pageInfo = this.pagesLookup.pages[pageNumber];
    if (!pageInfo) return null;

    const response = await fetch(
      `${API_BASE}/verses/by_page/${pageNumber}?mushaf=${this.mushafId}&words=true&from=${pageInfo.from}&to=${pageInfo.to}`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );
    return response.json();
  }
}
```

### Pattern: Fetch All Pages for Mushaf

```typescript
async function fetchAllPages(mushafId: number, accessToken: string) {
  const allPages = [];

  for (let page = 1; page <= 604; page++) {
    const response = await fetch(
      `${API_BASE}/verses/by_page/${page}?mushaf=${mushafId}&words=true&word_fields=code_v2,text_qpc_hafs,line_number,page_number,position`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const data = await response.json();
    allPages.push(transformToPageFormat(data, page));

    // Rate limiting - delay between requests
    await new Promise(r => setTimeout(r, 100));
  }

  return allPages;
}
```

---

## Mushaf IDs

Different Mushaf layouts available via the API:

| ID | Name | Pages | Description |
|----|------|-------|-------------|
| 1 | QCF V2 | 604 | Medina Mushaf, recommended |
| 2 | QCF V1 | 604 | Legacy Medina Mushaf |
| 5 | KFGQPC Hafs | 604 | King Fahd Complex |
| 19 | QCF V4 Tajweed | 604 | With Tajweed colors |

### Recommended Mushaf IDs

| Use Case | Recommended ID |
|----------|---------------|
| Standard reading | 1 (QCF V2) |
| Tajweed colors | 19 (QCF V4) |
| Unicode fallback | 5 (KFGQPC) |

---

## Best Practices

### 1. Cache Lookup Data

Pages lookup is static - cache it:

```typescript
const pagesCache = new Map<string, any>();

async function getCachedPagesLookup(chapterNumber: number, mushafId: number) {
  const key = `${chapterNumber}-${mushafId}`;
  if (pagesCache.has(key)) {
    return pagesCache.get(key);
  }
  const data = await fetchPagesLookup(chapterNumber, mushafId);
  pagesCache.set(key, data);
  return data;
}
```

### 2. Rate Limiting

The API has rate limits. Add delays between requests:

```typescript
const RATE_LIMIT_DELAY = 100; // ms

for (const page of pages) {
  await fetchPage(page);
  await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY));
}
```

### 3. Validate Mushaf Pages

Different Mushafs have different page counts:

```typescript
const MAX_PAGES: Record<number, number> = {
  1: 604,   // QCF V2
  2: 604,   // QCF V1
  5: 604,   // KFGQPC
  19: 604,  // QCF V4
};

function isValidPage(pageNumber: number, mushafId: number): boolean {
  const max = MAX_PAGES[mushafId] || 604;
  return pageNumber >= 1 && pageNumber <= max;
}
```

---

## Troubleshooting

### Issue: Empty Pages Object

**Symptom:** `pages` is empty in lookup response

**Cause:** Invalid chapter number or Mushaf ID

**Solution:** Verify parameters:
- `chapter_number` must be 1-114
- `mushaf` must be a valid ID (1, 2, 5, 19, etc.)

### Issue: Wrong Page Numbers

**Symptom:** Page numbers don't match expected Mushaf

**Cause:** Using wrong Mushaf ID

**Solution:** Double-check Mushaf ID:
- QCF V2 = 1
- QCF V4 Tajweed = 19
- KFGQPC = 5

### Issue: Auth Errors

**Symptom:** 401 Unauthorized

**Cause:** Token expired or invalid

**Solution:** Refresh the access token using client credentials

---

## Related Documentation

- [Data Structure](architecture/data-structure.md) - File formats and structure
- [Data Generation Guide](guides/data-generation.md) - Using the generation scripts
- [Mushaf Comparison](guides/mushaf-comparison.md) - Choosing the right Mushaf
