const express = require("express");
const router = express.Router();
const trainerService = require("../Services/trainerService");

/**
 * @swagger
 * path:
 *  /api/v1/trainers:
 *    get:
 *      summary: Get all trainers
 *      description: Fetches a list of all trainers
 *      tags: [trainers]
 *      responses:
 *        200:
 *          description: A list of trainers
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  type: object
 *                  properties:
 *                    id:
 *                      type: string
 *                      description: Unique identifier for the trainer
 *                    name:
 *                      type: string
 *                      description: Name of the trainer
 *                    expertise:
 *                      type: string
 *                      description: Trainer's area of expertise
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
router.get("/trainers", async (req, res) => {
  try {
    const trainers = await trainerService.getAllTrainers();
    res.json(trainers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * path:
 *  /api/v1/trainers:
 *    post:
 *      summary: Create a new trainer
 *      description: Adds a new trainer to the system
 *      tags: [trainers]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                name:
 *                  type: string
 *                  description: Name of the trainer
 *                expertise:
 *                  type: string
 *                  description: Trainer's area of expertise
 *      responses:
 *        201:
 *          description: The created trainer
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 *                    description: Unique identifier of the trainer
 *                  name:
 *                    type: string
 *                    description: Name of the trainer
 *                  expertise:
 *                    type: string
 *                    description: Area of expertise of the trainer
 *        400:
 *          description: Bad request
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  error:
 *                    type: string
 *                    description: Error message
 */
router.post("/trainers", async (req, res) => {
  try {
    const trainer = await trainerService.createTrainer(req.body);
    res.status(201).json(trainer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * path:
 *  /api/v1/update/{id}:
 *    put:
 *      summary: Update a trainer
 *      description: Updates the details of an existing trainer
 *      tags: [trainers]
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          description: The unique identifier of the trainer to be updated
 *          schema:
 *            type: string
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                name:
 *                  type: string
 *                  description: Name of the trainer
 *                expertise:
 *                  type: string
 *                  description: Trainer's area of expertise
 *      responses:
 *        200:
 *          description: The updated trainer details
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 *                    description: Unique identifier of the trainer
 *                  name:
 *                    type: string
 *                    description: Name of the trainer
 *                  expertise:
 *                    type: string
 *                    description: Area of expertise of the trainer
 *        400:
 *          description: Bad request
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  error:
 *                    type: string
 *                    description: Error message
 *        404:
 *          description: Trainer not found
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  error:
 *                    type: string
 *                    description: Error message
 */
router.put("/update/:id", async (req, res) => {
  try {
    const updated = await trainerService.updateTrainer(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * path:
 *  /api/v1/delete/{id}:
 *    delete:
 *      summary: Delete a trainer
 *      description: Deletes a trainer from the system
 *      tags: [trainers]
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          description: The unique identifier of the trainer to be deleted
 *          schema:
 *            type: string
 *      responses:
 *        200:
 *          description: The deleted trainer
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 *                    description: The unique identifier of the trainer
 *                  name:
 *                    type: string
 *                    description: Name of the trainer
 *                  expertise:
 *                    type: string
 *                    description: Trainer's area of expertise
 *        404:
 *          description: Trainer not found
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  error:
 *                    type: string
 *                    description: Error message
 */
router.delete("/delete/:id", async (req, res) => {
  try {
    const deleted = await trainerService.deleteTrainer(req.params.id);
    res.json(deleted);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
