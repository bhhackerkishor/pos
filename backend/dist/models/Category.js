import mongoose, { Schema } from 'mongoose';
const CategorySchema = new Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
}, { timestamps: true });
export default mongoose.model('Category', CategorySchema);
