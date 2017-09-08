const mongoose = require('mongoose');

const snippetSchema = new mongoose.Schema({
    title: { type: String, required: true },
    snippetbody: String,
    notes: String,
    language: String,
    tags: [String]
})





const Snippet = mongoose.model('Snippet', snippetSchema);

module.exports = Snippet;
