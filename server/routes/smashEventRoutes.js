const express = require("express");
const router = express.Router();
const smashEventService = require("../Services/smashEventService");

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Operations related to Smash events
 */

/**
 * @swagger
 * path:
 *  /api/v1/events:
 *    get:
 *      summary: Get all events
 *      description: Fetches a list of all Smash Padel events
 *      tags: [Events]  # Ensure the tag matches the one in the tags array
 *      responses:
 *        200:
 *          description: A list of events
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  type: object
 *                  properties:
 *                    dato:
 *                      type: string
 *                      description: The date of the event
 *                    titel:
 *                      type: string
 *                      description: The title of the event
 *                    tidspunkt:
 *                      type: string
 *                      description: The time of the event
 *                    sted:
 *                      type: string
 *                      description: The venue of the event
 *                    instruktør:
 *                      type: string
 *                      description: The instructor for the event
 *                    status:
 *                      type: string
 *                      description: The event's status (e.g., upcoming, completed)
 *                    billede:
 *                      type: string
 *                      description: Image URL for the event
 *        500:
 *          description: Server error
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  error:
 *                    type: string
 *                    description: Error message
 */
router.get("/events", async (req, res) => {
  try {
    const events = await smashEventService.getAllEvents();
    console.log("Events sent to frontend:", events); // Add this log to verify the data
    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
