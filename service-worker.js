const wordsUrl = "https://sjh-00028.github.io/words.bin";

let buffer;
let dataView
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function byteLength(str) {
    return textEncoder.encode(str).length;
}

function readString(pos) {
    let stringLength = 0
    while (pos + stringLength < buffer.byteLength && dataView.getUint8(pos + stringLength) != 0)
        stringLength++

    return textDecoder.decode(buffer.slice(pos, pos + stringLength))
}

function readEntry(pos) {
    pos += 12

    let word = readString(pos)
    pos += byteLength(word) + 1
    let infoCount = dataView.getUint8(pos++)
    let infos = []
    for (let i = 0; i < infoCount; i++) {
        let type = dataView.getUint8(pos++)
        if (type == 1) {
            let formOf = readString(pos)
            pos += byteLength(formOf) + 1

            infos.push(formOf)
            continue
        }

        let ipa = readString(pos)
        pos += byteLength(ipa) + 1
        let articles = dataView.getUint8(pos++)
        
        let definitionCount = dataView.getUint8(pos++)
        let definitions = []
        for (let i = 0; i < definitionCount; i++) {
            let definition = readString(pos)

            definitions.push(definition)
            pos += byteLength(definition) + 1
        }

        let formCount = dataView.getUint8(pos++)
        let forms = []
        for (let i = 0; i < formCount; i++) {
            let form = readString(pos)

            forms.push(form)
            pos += byteLength(form) + 1
        }

        infos.push({
            word: word,
            ipa: ipa,
            article: [null, "la", "le", "le,la"][articles],
            definitions: definitions,
            forms: forms
        })
    }

    return infos
}

function findEntry(word) {
    let current = dataView.getUint32(0);
    let found = new Map()

    while (current != 0xFFFFFFFF) {
        let currentWord = readString(current + 12)
        if (found.has(currentWord))
            break
        if (currentWord.toLowerCase() == word.toLowerCase())
            return readEntry(current)

        found.set(currentWord)
        if (currentWord > word)
            current = dataView.getUint32(current + 4)
        else
            current = dataView.getUint32(current + 8)
    }

    return null
}

const loadPromise = caches.open("words-cache").then(async wordsCache => {
    await wordsCache.add(wordsUrl);

    let response = await wordsCache.match(wordsUrl);
    buffer = await response.arrayBuffer();
    dataView = new DataView(buffer)
});

self.addEventListener("message", async e => {
    await loadPromise;

    let word = e.data;

    e.ports[0].start();
    e.ports[0].postMessage({word: word, entries: findEntry(word)});
});
