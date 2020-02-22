const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
    try {
        await mongoose.connect(db, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndexe: true
        });
        console.log('Successfully connected with MongoDB...');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
module.exports = connectDB;
