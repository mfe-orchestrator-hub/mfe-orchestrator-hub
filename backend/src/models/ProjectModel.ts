import mongoose, { Document, Schema, ObjectId } from "mongoose"

export interface IProject extends Document<ObjectId> {
    name: string
    slug: string
    description?: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

const projectSchema = new Schema<IProject>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255
        },
        description: {
            type: String,
            trim: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
)

const Project = mongoose.model<IProject>("Project", projectSchema)
export default Project
