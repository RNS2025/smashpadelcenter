const axios = require("axios");
const cheerio = require("cheerio");

async function extractCourtNames() {
  try {
    const url = "https://book.smash.dk/newlook/proc_baner.asp";
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    const $ = cheerio.load(response.data);
    const courtNames = [];

    $(".baneheadtxt").each((_, element) => {
      const name = $(element).text().trim();
      if (name && !courtNames.includes(name)) {
        courtNames.push(name);
      }
    });

    return courtNames;
  } catch (error) {
    throw new Error("Fejl ved hentning af bane-navne: " + error.message);
  }
}

async function fetchAvailableCourtTimes() {
  try {
    const url = "https://book.smash.dk/newlook/proc_baner.asp";
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    const $ = cheerio.load(response.data);
    const courts = [];

    $("#owl-kalender .bane").each((_, element) => {
      const court = $(element);
      const courtName =
        court.find(".baneheadtxt").text().trim() || "Ukendt Bane";

      const tider = [];

      court.find(".banefelt").each((_, slotEl) => {
        const slot = $(slotEl);
        const classAttr = slot.attr("class") || "";
        const timeText = slot.text().replace(/\s+/g, " ").trim();

        let status = "Ukendt";
        if (
          classAttr.includes("btn_ledig") ||
          classAttr.includes("bane_ledig_streg")
        ) {
          status = "Ledig";
        } else if (classAttr.includes("bane_redbg")) {
          status = "Reserveret";
        } else if (classAttr.includes("bane_rest")) {
          status = "Ikke tilgængelig";
        }

        if (timeText) {
          tider.push({ tid: timeText, status });
        }
      });

      if (tider.length > 0) {
        courts.push({ bane: courtName, tider });
      }
    });

    return courts;
  } catch (error) {
    throw new Error("Fejl ved hentning af tider: " + error.message);
  }
}

module.exports = {
  extractCourtNames,
  fetchAvailableCourtTimes,
};
