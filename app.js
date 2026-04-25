/* ===================================================================
   TopSong App Logic
   Handles birthday input, chart lookups, YouTube embeds, sharing, and UI.
   =================================================================== */

const MONTH_NAMES = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
];

const MONTH_FULL = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const MIN_YEAR = 1946;
const MAX_YEAR = 2025;

// ---- DOM Elements ----
const bdayInput = document.getElementById("bdayInput");
const searchBtn = document.getElementById("searchBtn");
const randomBtn = document.getElementById("randomBtn");
const shareBtn = document.getElementById("shareBtn");
const loaderEl = document.getElementById("loaderContainer");
const resultsEl = document.getElementById("resultsSection");
const errorEl = document.getElementById("errorMsg");
const heroEl = document.getElementById("hero");
const resultSummary = document.getElementById("resultSummary");
const timelineList = document.getElementById("timelineList");

const yearTitle = document.getElementById("yearTitle");
const yearArtist = document.getElementById("yearArtist");
const yearBadge = document.getElementById("yearBadge");
const yearVideo = document.getElementById("yearVideo");

const monthTitle = document.getElementById("monthTitle");
const monthArtist = document.getElementById("monthArtist");
const monthBadge = document.getElementById("monthBadge");
const monthVideo = document.getElementById("monthVideo");

const shareButtonMarkup = shareBtn.innerHTML;
const searchButtonMarkup = searchBtn.innerHTML;

// ---- Utility Helpers ----

function getSongQuery(song) {
    return song ? encodeURIComponent(`${song.title} ${song.artist} official video`) : "";
}

function getWatchUrl(song) {
    if (song && song.ytId) {
        return `https://www.youtube.com/watch?v=${song.ytId}`;
    }
    return `https://www.youtube.com/results?search_query=${getSongQuery(song)}`;
}

function buildYouTubeFallback(song, label = "Watch on YouTube") {
    return `<a class="yt-fallback" href="${getWatchUrl(song)}" target="_blank" rel="noopener">
        <svg viewBox="0 0 68 48"><path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="red"/><path d="M45 24L27 14v20" fill="white"/></svg>
        <span>${label}</span>
    </a>`;
}

function buildVideoEmbed(song) {
    if (!song || !song.ytId || window.location.protocol === "file:") {
        return buildYouTubeFallback(song);
    }

    const params = new URLSearchParams({
        rel: "0",
        origin: window.location.origin
    });

    return `<iframe
        src="https://www.youtube.com/embed/${song.ytId}?${params.toString()}"
        title="${song.title} - ${song.artist}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
        loading="lazy"
    ></iframe>
    <a class="video-link" href="${getWatchUrl(song)}" target="_blank" rel="noopener">Open on YouTube</a>`;
}

function getShareUrl(dateValue) {
    const url = new URL(window.location.href);
    url.searchParams.set("date", dateValue);
    return url.toString();
}

function getRandomDate() {
    const start = new Date(MIN_YEAR, 0, 1).getTime();
    const end = new Date(MAX_YEAR, 11, 31).getTime();
    const date = new Date(start + Math.random() * (end - start));

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

function getDaysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
}

function setPageBackground(yearSong) {
    if (!yearSong || !yearSong.ytId) {
        document.body.classList.remove("has-year-background");
        document.body.style.removeProperty("--page-bg-image");
        return;
    }

    const thumb = `https://img.youtube.com/vi/${yearSong.ytId}/hqdefault.jpg`;
    document.body.style.setProperty("--page-bg-image", `url("${thumb}")`);
    document.body.classList.add("has-year-background");
}

// ---- Data Lookup ----

function lookupYear(year) {
    return BILLBOARD.yearly[year] || null;
}

function lookupMonth(year, month) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    return BILLBOARD.monthly[key] || null;
}

// ---- UI Updates ----

function showError(msg) {
    errorEl.textContent = msg;
}

function clearError() {
    errorEl.textContent = "";
}

function renderSummary(year, month, yearSong, monthSong) {
    const monthName = MONTH_FULL[month];
    const yearText = yearSong
        ? `The year-end #1 for ${year} was "${yearSong.title}" by ${yearSong.artist}.`
        : `Year-end data is unavailable for ${year}.`;
    const monthText = monthSong
        ? `For ${monthName}, the monthly #1 entry is "${monthSong.title}" by ${monthSong.artist}.`
        : `Monthly Hot 100 data is unavailable for ${monthName} ${year}.`;
    const sourceText = year < 1958
        ? "This year predates the Hot 100, so the yearly result uses Billboard's pre-Hot-100 retail-sales lists."
        : "These results use Billboard chart history, with monthly entries approximating the dominant #1 for the month.";

    resultSummary.innerHTML = `
        <p>${yearText}</p>
        <p>${monthText}</p>
        <span>${sourceText}</span>
    `;
}

function renderTimeline(year) {
    const years = [year - 2, year - 1, year, year + 1, year + 2]
        .filter((item) => BILLBOARD.yearly[item]);

    timelineList.innerHTML = years.map((item) => {
        const song = BILLBOARD.yearly[item];
        const activeClass = item === year ? " active" : "";
        return `<button class="timeline-item${activeClass}" type="button" data-year="${item}">
            <span class="timeline-year">${item}</span>
            <strong>${song.title}</strong>
            <span>${song.artist}</span>
        </button>`;
    }).join("");
}

function updateCard(titleEl, artistEl, badgeEl, videoEl, song, badgeText) {
    if (song) {
        titleEl.textContent = song.title;
        artistEl.textContent = song.artist;
        videoEl.innerHTML = buildVideoEmbed(song);
    } else {
        titleEl.textContent = "Data unavailable";
        artistEl.textContent = "Try another date; monthly data starts in August 1958";
        videoEl.innerHTML = "";
    }
    badgeEl.textContent = badgeText;
}

function jumpToYear(targetYear) {
    if (!bdayInput.value) return;

    const [, monthText, dayText] = bdayInput.value.split("-");
    const month = parseInt(monthText, 10) - 1;
    const day = Math.min(parseInt(dayText, 10), getDaysInMonth(targetYear, month));

    bdayInput.value = [
        targetYear,
        monthText,
        String(day).padStart(2, "0")
    ].join("-");

    runSearch();
}

function animateCards() {
    const cards = document.querySelectorAll(".result-card");
    cards.forEach((card, i) => {
        card.classList.remove("show");
        setTimeout(() => card.classList.add("show"), 200 + i * 200);
    });
}

async function shareResult(dateValue) {
    const shareUrl = getShareUrl(dateValue);

    if (navigator.share) {
        await navigator.share({
            title: "TopSong Birthday Soundtrack",
            text: "My birthday soundtrack on TopSong",
            url: shareUrl
        });
        return;
    }

    await navigator.clipboard.writeText(shareUrl);
    shareBtn.textContent = "Copied Link";
    setTimeout(() => {
        shareBtn.innerHTML = shareButtonMarkup;
    }, 1800);
}

// ---- Main Search Handler ----

function runSearch() {
    const val = bdayInput.value;
    if (!val) {
        showError("Please select a date to continue.");
        return;
    }

    clearError();

    const parts = val.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;

    if (year < MIN_YEAR || year > MAX_YEAR) {
        showError(`Please enter a date between ${MIN_YEAR} and ${MAX_YEAR}.`);
        return;
    }

    searchBtn.disabled = true;
    searchBtn.innerHTML = 'Searching... <div class="btn-loader"></div>';
    loaderEl.classList.add("visible");
    resultsEl.classList.remove("visible");

    setTimeout(() => {
        const yearSong = lookupYear(year);
        const monthSong = lookupMonth(year, month);

        setPageBackground(yearSong);
        renderSummary(year, month, yearSong, monthSong);
        renderTimeline(year);

        updateCard(yearTitle, yearArtist, yearBadge, yearVideo, yearSong, String(year));
        updateCard(monthTitle, monthArtist, monthBadge, monthVideo, monthSong, `${MONTH_NAMES[month]} ${year}`);

        loaderEl.classList.remove("visible");
        resultsEl.classList.add("visible");
        heroEl.classList.add("shrink");
        shareBtn.disabled = false;

        window.history.replaceState({}, "", getShareUrl(val));

        searchBtn.disabled = false;
        searchBtn.innerHTML = searchButtonMarkup;

        animateCards();

        setTimeout(() => {
            resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
    }, 650);
}

searchBtn.addEventListener("click", runSearch);

randomBtn.addEventListener("click", () => {
    bdayInput.value = getRandomDate();
    runSearch();
});

timelineList.addEventListener("click", (event) => {
    const item = event.target.closest(".timeline-item");
    if (!item) return;

    jumpToYear(parseInt(item.dataset.year, 10));
});

shareBtn.addEventListener("click", () => {
    if (!bdayInput.value) return;
    shareResult(bdayInput.value).catch(() => {
        showError("Could not share this result. Try copying the page URL.");
    });
});

bdayInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchBtn.click();
});

const sharedDate = new URLSearchParams(window.location.search).get("date");
if (sharedDate && /^\d{4}-\d{2}-\d{2}$/.test(sharedDate)) {
    bdayInput.value = sharedDate;
    runSearch();
}
