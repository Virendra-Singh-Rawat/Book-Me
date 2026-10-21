import mongoose from "mongoose";
import Service from "../models/service.model.js";

// List services belonging to the logged-in user
export const listServices = async (req, res) => {
  try {
    const services = await Service.find({
      userId: req.user.id,
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    return res.status(200).json({ services });
  } catch (error) {
    console.error("List services error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// Create a new service
export const createServices = async (req, res) => {
  try {
    const { name, duration, price, description, icon } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      duration === undefined ||
      duration === null ||
      duration === "" ||
      !Number.isFinite(Number(duration)) ||
      Number(duration) < 5
    ) {
      return res.status(400).json({
        message:
          "A service name and duration of at least 5 minutes are required.",
      });
    }

    if (
      price !== undefined &&
      (!Number.isFinite(Number(price)) || Number(price) < 0)
    ) {
      return res.status(400).json({
        message: "Price must be a non-negative number.",
      });
    }

    if (description !== undefined && typeof description !== "string") {
      return res.status(400).json({
        message: "Description must be a string.",
      });
    }

    const service = await Service.create({
      userId: req.user.id,
      name: name.trim(),
      duration: Number(duration),
      price: price === undefined ? 0 : Number(price),
      description: description ?? "",
      icon: icon || "C1.png",
    });

    return res.status(201).json({
      message: "Service created",
      service,
    });
  } catch (error) {
    console.error("Create service error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// Update an existing service
export const updateService = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid service ID",
      });
    }

    const updates = {};
    const allowedFields = [
      "name",
      "duration",
      "price",
      "description",
      "isActive",
      "icon",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided for update",
      });
    }

    if (
      "name" in updates &&
      (typeof updates.name !== "string" || !updates.name.trim())
    ) {
      return res.status(400).json({
        message: "Service name cannot be empty",
      });
    }

    if ("name" in updates) {
      updates.name = updates.name.trim();
    }

    if (
      "duration" in updates &&
      (updates.duration === null ||
        updates.duration === "" ||
        !Number.isFinite(Number(updates.duration)) ||
        Number(updates.duration) < 5)
    ) {
      return res.status(400).json({
        message: "Duration must be at least 5 minutes",
      });
    }

    if ("duration" in updates) {
      updates.duration = Number(updates.duration);
    }

    if (
      "price" in updates &&
      (updates.price === null ||
        updates.price === "" ||
        !Number.isFinite(Number(updates.price)) ||
        Number(updates.price) < 0)
    ) {
      return res.status(400).json({
        message: "Price must be a non-negative number",
      });
    }

    if ("price" in updates) {
      updates.price = Number(updates.price);
    }

    if ("description" in updates && typeof updates.description !== "string") {
      return res.status(400).json({
        message: "Description must be a string",
      });
    }

    if ("isActive" in updates && typeof updates.isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be a boolean",
      });
    }

    if ("icon" in updates && typeof updates.icon !== "string") {
      return res.status(400).json({
        message: "Icon must be a string",
      });
    }

    const service = await Service.findOneAndUpdate(
      {
        _id: id,
        userId: req.user.id,
        isDeleted: { $ne: true },
      },
      updates,
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    return res.status(200).json({
      message: "Service updated",
      service,
    });
  } catch (error) {
    console.error("Update service error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// Delete the service
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid service ID",
      });
    }

    const service = await Service.findOneAndUpdate(
      {
        _id: id,
        userId: req.user.id,
        isDeleted: { $ne: true },
      },
      {
        isDeleted: true,
        isActive: false,
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    return res.status(200).json({
      message: "Service deleted",
      service,
    });
  } catch (error) {
    console.error("Delete service error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// this is service.controller.js