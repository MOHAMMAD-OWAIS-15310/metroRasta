const mongoose = require("mongoose");

const anonymousUserSchema = new mongoose.Schema(
    {
        anonymousId: {
            type: String,
            required: true,
            unique: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "AnonymousUser",
    anonymousUserSchema,
    "anonymousUsers"
);