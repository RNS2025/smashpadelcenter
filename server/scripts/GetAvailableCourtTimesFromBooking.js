const axios = require("axios");
const cheerio = require("cheerio");

async function fetchAvailableTimes() {
  try {
    const url = "https://book.smash.dk/newlook/proc_baner.asp";
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const result = [];

    $(".owl-item .bane").each((_, element) => {
      const court = $(element);
      const courtName =
        court.find(".baneheadtxt").text().trim() || "Ukendt Bane";

      const times = [];

      court
        .find(".banefelt")
        .not(".banehead")
        .each((_, slotEl) => {
          const slot = $(slotEl);
          const classList = slot.attr("class") || "";
          const timeRange = slot.text().replace(/\s+/g, " ").trim();

          let status = "Ukendt";
          if (
            classList.includes("btn_ledig") ||
            classList.includes("bane_ledig_streg")
          ) {
            status = "Ledig";
          } else if (classList.includes("bane_redbg")) {
            status = "Reserveret";
          }

          if (status === "Ledig") {
            times.push({ tid: timeRange });
          }
        });

      if (times.length > 0) {
        result.push({
          bane: courtName,
          ledigeTider: times,
        });
      }
    });

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Fejl ved hentning af data:", error.message);
  }
}

fetchAvailableTimes();
