const mongoose = require('mongoose');

const snippetSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    age: Number,
    team: String,
    jerseyNumber: Number,
    stats: [{
        rpg: Number,
        ppg: Number,
        apg: Number,
    }]
});





const Snippet = mongoose.model('Snippet', snippetSchema);

module.exports = Snippet;
