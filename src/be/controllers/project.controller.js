
const ProjectTypeSchema = require("../models/projectType.model");
const ProjectSchema = require("../models/project.model")
const CategoriesSchema = require("../models/categories.model")
const UserSchema = require('../models/user.model');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const delete_project_type = async (projectIdType) => {
    const data = await ProjectTypeSchema.deleteOne({ _id: projectIdType });
    return data;
}

const project = {
    create_project_type: async (req, res) => {
        const { nameProjectType } = req.body
        const data = await ProjectTypeSchema.findOne({ nameProjectType });
        if (data) {
            return res.status(400).json({ message: "projectType đã tồn tại trong hệ thống" })
        }

        const datasave = new ProjectTypeSchema({
            nameProjectType: nameProjectType,
        });
        const dataCreate = await datasave.save();
        return res.json({
            message: "",
            data: {
                id: dataCreate._id
            }
        })
    },

    get_project_type: async (req, res) => {
        const data = await ProjectTypeSchema.find();
        return res.json({
            message: "",
            data: {
                listProjectType: data,
            }
        })
    },

    check_project_type: async (req, res) => {
        const { nameProjectTypeNew } = req.body;
        const data = await ProjectTypeSchema.findOne({ nameProjectType: nameProjectTypeNew });
        if (data) {
            return res.status(400).json({ message: "projectTypeNew đã tồn tại trong hệ thống" })
        }
    },
    check_design: async (req, res) => {
        const { userCode } = req.body;
        const data = await UserSchema.findOne({ userCode: userCode, role: "DESIGNER" }).select("-password");
        return res.json({
            message: "Success",
            data: {
                data: data,
            }
        })
    },

    create_project_category: async (req, res) => {
        const data = req.body;
        const { listCategory } = req.body;
        const datasave = new ProjectSchema({
            ...data,
        })
        try {
            const dataCreate = await datasave.save();
            for (let index = 0; index < listCategory.length; index++) {
                const datasaveCategory = new CategoriesSchema({
                    categoriesName: listCategory[index].categoriesName,
                    images: listCategory[index].images,
                    projectIds: dataCreate._id,
                })
                await datasaveCategory.save();
            }
            return res.json({
                message: "Success",
                data: {
                    listProjectType: data,
                }
            })
        } catch (error) {
            console.log('====================================');
            console.log("error ", error);
            console.log('====================================');
        }

        return res.json({
            message: "Success",
            data: {
                listProjectType: data,
            }
        })
    },
    get_project_category: async (req, res) => {
        const data = await ProjectSchema.find({ _id: { $gt: "000000000000000000000000" } })
            .sort({ _id: -1 })
            .limit(24)
            .exec();

        return res.json({
            message: "Success",
            data: {
                listProject: data,
            }
        })
    },
    get_project_category_id: async (req, res) => {
        const { id } = req.params;
        // projectIds
        const data = await ProjectSchema.aggregate([
            {
                $match: {
                    _id: ObjectId(id),
                },
            },
            {
                $lookup: {
                    from: 'designers',
                    localField: 'designerId',
                    foreignField: 'designerId',
                    as: 'dataDesigner',
                },
            },
            {
                $unwind: "$dataDesigner" // Unwind the dataDesigner array
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'dataDesigner.designerId', // Assuming designerId is in each object within the dataDesigner array
                    foreignField: '_id',
                    as: 'userData',
                },
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: 'projectIds',
                    as: 'categoryData',
                },
            },
        ]);


        return res.json({
            message: "Success",
            data: {
                listProject: data,
            }
        })
    },
    post_get_project_type: async (req, res) => {
        const { id_type } = req.body;
        const data = await ProjectSchema.find({
            _id: { $gt: "000000000000000000000000" },
            projectIdType: id_type,
        })
            .sort({ _id: -1 })
            .limit(24)
            .exec();
        const projectTypeName = await ProjectTypeSchema.findById(id_type).select("nameProjectType")

        return res.json({
            message: "Success",
            data: {
                listProject: data,
                nameType: projectTypeName
            }
        })
    }

}

module.exports = project