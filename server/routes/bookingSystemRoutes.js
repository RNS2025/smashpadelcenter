const express = require("express");
const {
  extractCourtNames,
  fetchAvailableCourtTimes,
} = require("../scripts/scraper");

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
  try {
    const names = await extractCourtNames();
    res.json({ courts: names });
  } catch (err) {
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
  try {
    const data = await fetchAvailableCourtTimes();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
