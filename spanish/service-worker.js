let words;

const wordsUrl = "https://sjh-00028.github.io/spanish/words.json";
const loadPromise = caches.open("spanish-words-cache").then(async wordsCache => {
    await wordsCache.add(wordsUrl);

    let response = await wordsCache.match(wordsUrl);
    words = await response.json();
});

self.addEventListener("message", async e => {
    await loadPromise;

    let word = e.data;
    let wordEntries = words[word] || words[word.toLowerCase()];

    while (wordEntries != null && wordEntries.length === 1 && typeof(wordEntries[0]) === "string") { // Alias
        word = wordEntries[0];
        wordEntries = words[word] || words[word.toLowerCase()];
    }

    e.ports[0].start();
    e.ports[0].postMessage({word: word, entries: wordEntries});
});