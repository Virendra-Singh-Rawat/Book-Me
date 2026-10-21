import Availability from "../models/availability.model.js";
import { isValidTimeRange } from "../utils/time.js";

export const listAvailability = async (req, res) => {
  try {
    const availability = await Availability.find({
      userId: req.user.id,
    }).sort({ dayOfWeek: 1 });

    return res.status(200).json(availability);
  } catch (error) {
    console.error("List availability error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const saveAvailability = async (req, res) => {
  try {
    const { dayOfWeek, slots } = req.body;

    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({
        message: "Valid day of week is required.",
      });
    }

    if (!Array.isArray(slots)) {
      return res.status(400).json({
        message: "Slots must be an array.",
      });
    }

    const cleanedSlots = [];

    for (const slot of slots) {
      if (
        !slot ||
        typeof slot.startTime !== "string" ||
        typeof slot.endTime !== "string" ||
        !isValidTimeRange(slot.startTime, slot.endTime)
      ) {
        return res.status(400).json({
          message: "Each slot must have a valid start and end time.",
        });
      }

      cleanedSlots.push({
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
    }

    const availability = await Availability.findOneAndUpdate(
      { userId: req.user.id, dayOfWeek },
      { slots: cleanedSlots },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.status(200).json({
      message: "Availability saved",
      availability,
    });
  } catch (error) {
    console.error("Save availability error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
