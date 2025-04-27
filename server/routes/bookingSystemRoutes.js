const express = require("express");
const {
  extractCourtNames,
  fetchAvailableCourtTimes,
} = require("../scripts/scraper");
const logger = require("../config/logger"); // Add logger import

const router = express();

/**
 * @swagger
 * tags:
 *   name: BookingScraper
 *   description: Endpoints der scraper baneoplysninger fra booking siden
 */

/**
 * @swagger
 * /api/v1/courts/names:
 *   get:
 *     tags:
 *       - BookingScraper
 *     summary: Hent alle unikke banenavne
 *     responses:
 *       200:
 *         description: En liste med alle baner
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 courts:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get("/courts/names", async (req, res) => {
  logger.debug("Court names request received");
  try {
    const names = await extractCourtNames();
    logger.info("Court names fetched successfully", { count: names.length });
    res.json({ courts: names });
  } catch (err) {
    logger.error("Error fetching court names", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/v1/courts/times:
 *   get:
 *     tags:
 *       - BookingScraper
 *     summary: Hent alle baner med tilgængelige tider og deres status
 *     responses:
 *       200:
 *         description: En liste med tider og status pr. bane
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       bane:
 *                         type: string
 *                       tider:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             tid:
 *                               type: string
 *                             status:
 *                               type: string
 */
router.get("/courts/times", async (req, res) => {
  logger.debug("Court times request received");
  try {
    const data = await fetchAvailableCourtTimes();
    logger.info("Court times fetched successfully", {
      courtCount: data.length,
    });
    res.json({ data });
  } catch (err) {
    logger.error("Error fetching court times", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
