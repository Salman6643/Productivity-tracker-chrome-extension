const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
email: {type: String, unique: true},
passwordHash: String,
createdAt: {type: Date, default: Date.now}
});
module.exports = mongoose.model('User', UserSchema);