const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const DATA_FILE = path.join(__dirname, "..", "data.js");
const WRITE = process.argv.includes("--write");
const SEARCH_LIMIT = 10;

const data = fs.readFileSync(DATA_FILE, "utf8");
const entryPattern = /title: "([^"]+)", artist: "([^"]+)", ytId: "([^"]+)"/g;

function runYtDlp(args) {
    const result = spawnSync("yt-dlp", args, {
        encoding: "utf8",
        windowsHide: true
    });

    return {
        ok: result.status === 0,
        stdout: result.stdout || "",
        stderr: result.stderr || ""
    };
}

function parsePrintLine(line) {
    const [id, availability, embeddable, ...titleParts] = line.split("\t");
    return {
        id,
        availability,
        embeddable: embeddable === "True",
        title: titleParts.join("\t")
    };
}

function printArgs(target) {
    return [
        "--skip-download",
        "--no-warnings",
        "--print",
        "%(id)s\t%(availability)s\t%(playable_in_embed)s\t%(title)s",
        target
    ];
}

function validateId(id) {
    const result = runYtDlp(printArgs(`https://www.youtube.com/watch?v=${id}`));
    if (!result.ok) {
        return { ok: false, reason: "yt-dlp failed" };
    }

    const line = result.stdout.trim().split(/\r?\n/).find(Boolean);
    if (!line) {
        return { ok: false, reason: "no metadata returned" };
    }

    const info = parsePrintLine(line);
    const ok = info.availability === "public" && info.embeddable;
    return {
        ok,
        reason: ok ? "ok" : `${info.availability || "unknown"} / embeddable=${info.embeddable}`,
        info
    };
}

function findReplacement(title, artist) {
    const query = `ytsearch${SEARCH_LIMIT}:${title} ${artist} official audio`;
    const result = runYtDlp(printArgs(query));
    if (!result.ok) {
        return null;
    }

    return result.stdout
        .trim()
        .split(/\r?\n/)
        .filter(Boolean)
        .map(parsePrintLine)
        .find((candidate) => candidate.availability === "public" && candidate.embeddable) || null;
}

const entries = [];
let match;
while ((match = entryPattern.exec(data))) {
    entries.push({
        title: match[1],
        artist: match[2],
        ytId: match[3]
    });
}

const validationCache = new Map();
const replacementCache = new Map();
const replacements = new Map();

for (const entry of entries) {
    if (!validationCache.has(entry.ytId)) {
        validationCache.set(entry.ytId, validateId(entry.ytId));
    }

    const validation = validationCache.get(entry.ytId);
    if (validation.ok) {
        console.log(`OK       ${entry.ytId}  ${entry.title} - ${entry.artist}`);
        continue;
    }

    const songKey = `${entry.title}\t${entry.artist}`;
    if (!replacementCache.has(songKey)) {
        replacementCache.set(songKey, findReplacement(entry.title, entry.artist));
    }

    const replacement = replacementCache.get(songKey);
    if (replacement) {
        replacements.set(entry.ytId, replacement.id);
        console.log(`REPLACE  ${entry.ytId} -> ${replacement.id}  ${entry.title} - ${entry.artist}`);
    } else {
        console.log(`MISSING  ${entry.ytId}  ${entry.title} - ${entry.artist} (${validation.reason})`);
    }
}

if (WRITE && replacements.size > 0) {
    let updated = data;
    for (const [oldId, newId] of replacements) {
        updated = updated.replaceAll(`ytId: "${oldId}"`, `ytId: "${newId}"`);
    }

    fs.writeFileSync(DATA_FILE, updated, "utf8");
    console.log(`Updated ${replacements.size} unique ID(s) in data.js.`);
} else if (!WRITE) {
    console.log("Dry run only. Re-run with --write to update data.js.");
}
