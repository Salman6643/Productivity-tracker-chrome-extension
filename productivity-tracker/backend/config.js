module.exports = {
MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/prodtracker',
JWT_SECRET: process.env.JWT_SECRET || 'change_this_secret',
PORT: process.env.PORT || 5000
};