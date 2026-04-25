/* ===================================================================
   TopSong — App Logic
   Handles birthday input, chart data lookup, YouTube embeds, and UI.
   =================================================================== */

const MONTH_NAMES = [
    "JAN","FEB","MAR","APR","MAY","JUN",
    "JUL","AUG","SEP","OCT","NOV","DEC"
];

const MONTH_FULL = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
];

// ---- DOM Elements ----
const bdayInput    = document.getElementById("bdayInput");
const searchBtn    = document.getElementById("searchBtn");
const loaderEl     = document.getElementById("loaderContainer");
const resultsEl    = document.getElementById("resultsSection");
const errorEl      = document.getElementById("errorMsg");
const heroEl       = document.getElementById("hero");

const yearTitle    = document.getElementById("yearTitle");
const yearArtist   = document.getElementById("yearArtist");
const yearBadge    = document.getElementById("yearBadge");
const yearVideo    = document.getElementById("yearVideo");

const monthTitle   = document.getElementById("monthTitle");
const monthArtist  = document.getElementById("monthArtist");
const monthBadge   = document.getElementById("monthBadge");
const monthVideo   = document.getElementById("monthVideo");

// ---- Utility Helpers ----

/**
 * Build a YouTube embed iframe or a search fallback link.
 */
function buildVideoEmbed(song) {
    const q = song ? encodeURIComponent(`${song.title} ${song.artist} official video`) : "";
    const fallback = `<a class="yt-fallback" href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener">
        <svg viewBox="0 0 68 48"><path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="red"/><path d="M45 24L27 14v20" fill="white"/></svg>
        <span>Watch on YouTube</span>
    </a>`;

    if (song && song.ytId) {
        if (window.location.protocol === "file:") {
            return fallback;
        }

        const params = new URLSearchParams({
            rel: "0",
            origin: window.location.origin
        });

        return `<iframe
            src="https://www.youtube.com/embed/${song.ytId}?${params.toString()}"
            title="${song.title} — ${song.artist}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
            loading="lazy"
        ></iframe>`;
    }

    return fallback;
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

function animateCards() {
    const cards = document.querySelectorAll(".result-card");
    cards.forEach((card, i) => {
        card.classList.remove("show");
        setTimeout(() => card.classList.add("show"), 200 + i * 200);
    });
}

// ---- Main Search Handler ----

searchBtn.addEventListener("click", () => {
    const val = bdayInput.value;
    if (!val) {
        showError("Please select a date to continue.");
        return;
    }

    clearError();

    // Parse date (input gives "YYYY-MM-DD")
    const parts = val.split("-");
    const year  = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // 0-indexed

    if (year < 1946 || year > 2025) {
        showError("Please enter a date between 1946 and 2025.");
        return;
    }

    // Show loader
    searchBtn.disabled = true;
    searchBtn.innerHTML = 'Searching... <div class="btn-loader"></div>';
    loaderEl.classList.add("visible");
    resultsEl.classList.remove("visible");

    // Simulate brief search delay for feel
    setTimeout(() => {
        // Lookup data
        const yearSong  = lookupYear(year);
        const monthSong = lookupMonth(year, month);
        // Update cards
        updateCard(yearTitle, yearArtist, yearBadge, yearVideo,
                   yearSong, String(year));

        updateCard(monthTitle, monthArtist, monthBadge, monthVideo,
                   monthSong, `${MONTH_NAMES[month]} ${year}`);

        // Show results, hide loader
        loaderEl.classList.remove("visible");
        resultsEl.classList.add("visible");
        heroEl.classList.add("shrink");

        // Reset button
        searchBtn.disabled = false;
        searchBtn.innerHTML = `Find My Top Songs <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

        // Animate cards in sequence
        animateCards();

        // Scroll to results
        setTimeout(() => {
            resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);

    }, 1500);
});

// Allow Enter key on date input
bdayInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchBtn.click();
});
