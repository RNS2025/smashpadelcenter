const axios = require("axios");
const cheerio = require("cheerio");

async function fetchSmashEvents() {
  const url = "https://book.smash.dk/newlook/proc_liste.asp"; // The new URL to fetch the HTML from

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
        "Accept-Encoding": "gzip, deflate, br",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        Connection: "keep-alive",
      },
    });

    // Check if the request was successful
    if (response.status === 200) {
      const html = response.data; // Get the HTML from the response
      console.log("HTML fetched successfully.");

      const $ = cheerio.load(html); // Load the HTML with Cheerio

      const events = [];

      // Select each event row from the table
      $("tr.infinite-item").each((_, row) => {
        const columns = $(row).find("td");

        // Extracting event details from each column
        const billede = $(columns[1]).find("img").attr("src")?.trim(); // Image URL
        const titel = $(columns[2]).find(".strong").text().trim(); // Title (e.g., event name)
        const datoTidspunkt = $(columns[2])
          .text()
          .trim()
          .replace(/[\r\n]+/g, " "); // Date and Time
        const sted = $(columns[3]).find(".strong").text().trim(); // Location
        const instruktør = $(columns[3])
          .text()
          .trim()
          .split("Instruktør")[1]
          ?.trim(); // Instructor
        const status = $(columns[3]).find(".strong").text().trim(); // Event Status (e.g., Started or Full)

        events.push({
          billede: billede ? `https://portal.halbooking.dk${billede}` : null,
          titel,
          datoTidspunkt,
          sted,
          instruktør,
          status,
        });
      });

      // Log the events array to check if the data has been scraped correctly
      console.log(events);
      return events; // Return the events array
    } else {
      console.error(`Failed to fetch data. Status code: ${response.status}`);
      return []; // Return an empty array if there's an issue
    }
  } catch (error) {
    console.error("Error fetching events:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data); // Log response data if available
    }
    return []; // Return an empty array if there's an error
  }
}

module.exports = {
  getAllEvents: fetchSmashEvents, // Export the function to use it in other parts of the application
};
