
const ContractSchema = require("../models/contract.model");
const ProjectSchema = require("../models/project.model")
const CategoriesSchema = require("../models/categories.model")
const moment = require('moment')
const UserSchema = require('../models/user.model');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const emailQueue = require('../queue/sendEmailQueue');
const convertUtcToGmt7 = require("../helper/formatTimeZone");

const contract = {
    create_contract: async (req, res) => {
        const { codeContract } = req.body
        const findCodeContract = await ContractSchema.findOne({ codeContract: codeContract })
        if (findCodeContract) {
            return res.status(400).json({ message: "Mã hợp đồng đã tồn tại" });
        }
        const newContract = new ContractSchema({
            ...req.body
        })
        await newContract.save();
        return res.json({
            message: "Create success",
            data: {

            }
        })

    },
    delete_contract: async (req, res) => {
        const { id } = req.params;
        await ContractSchema.updateOne({ _id: id }, { $set: { isDelete: true } });
        return res.json({
            message: "Delete success",
            data: {

            }
        })

    },
    contract_persion: async (req, res) => {
        const custormerId = req.dataToken.id;
        const listContract = await ContractSchema.find({ custormerId: custormerId });
        return res.json({
            message: "get success",
            data: {
                listContract: listContract
            }
        })
    },
    list_contract: async (req, res) => {
        const listData = await ContractSchema.aggregate([
            {
                $match: {
                    isDelete: false
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: { custormerId: '$custormerId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$_id', '$$custormerId'] }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                fullName: 1,
                                email: 1 // Include other fields you want to retrieve
                            }
                        }
                    ],
                    as: 'customerData'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: { designerId: '$designerId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$_id', '$$designerId'] }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                fullName: 1,
                                email: 1 // Include other fields you want to retrieve
                            }
                        }
                    ],
                    as: 'designerData'
                }
            }
        ]);
        const yesterday = convertUtcToGmt7.getCreatedTimezone(new Date());
        console.log('yesterday == ', yesterday);
        console.log('today == ', new Date());
        const query = { createdAt: { $gte: yesterday, $lt: new Date() } };
        const countFind = await ContractSchema.countDocuments(query);

        return res.json({
            message: "get list success",
            data: {
                listContract: listData,
                count: countFind
            }
        })
    },
    list_contract_user: async (req, res) => {
        const custormerId = req.dataToken.id;
        console.log('custormerId == ', custormerId);
        const listData = await ContractSchema.aggregate([
            {
                $match: {
                    isDelete: false,
                    custormerId: ObjectId(custormerId)
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: { custormerId: '$custormerId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$_id', '$$custormerId'] }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                fullName: 1,
                                email: 1 // Include other fields you want to retrieve
                            }
                        }
                    ],
                    as: 'customerData'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: { designerId: '$designerId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$_id', '$$designerId'] }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                fullName: 1,
                                email: 1 // Include other fields you want to retrieve
                            }
                        }
                    ],
                    as: 'designerData'
                }
            }
        ]);

        return res.json({
            message: "get list success",
            data: {
                listContract: listData
            }
        })
    },
    check_contract: async (req, res) => {
        const { userCode } = req.body;
        const dataFind = await UserSchema.findOne({ userCode: userCode, isActive: true, isDelete: false }).select("_id fullName");
        if (!dataFind) {
            return res.status(400).json({ message: "Không tồn tại mã khách hàng" });
        }
        return res.json({
            message: "get list success",
            data: {
                dataCustomer: dataFind
            }
        })
    },

    email_consulation: async (req, res) => {
        const { emailCustomer, fullName, phone, note, address } = req.body
        const dataSendEamil = {
            emailCustomer, fullName, phone, note, address
        };
        await emailQueue.add('send-customer-consulation', dataSendEamil);
        return res.json({
            message: "Email thông báo cần tư vấn thành công",
            data: {

            }
        })
    },
    get_contract_detail: async (req, res) => {
        const dataFind = await ContractSchema.find({ _id: req.params.id });
        if (!dataFind) {
            return res.status(400).json({ message: "Không tồn tại hợp đồng" });
        }
        return res.json({
            message: "get contract success",
            data: {
                contract: dataFind
            }
        })
    },
    search_contract: async (req, res) => {
        const { startDate, endDate, codeContract, customerName, nameSignature } = req.body;
        const pipeline = [];

        pipeline.push({
            $match: {
                $and: [
                    { codeContract: { $regex: new RegExp(codeContract, 'i') } },
                    { nameSignature: { $regex: new RegExp(nameSignature, 'i') } },
                ]
            }
        });

        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'custormerId',
                foreignField: '_id',
                as: 'dataCustomer'
            }
        });

        pipeline.push({
            $unwind: {
                path: "$dataCustomer",
                preserveNullAndEmptyArrays: true
            }
        });

        pipeline.push({
            $match: {
                $and: [
                    { codeContract: { $regex: new RegExp(codeContract, 'i') } },
                    { nameSignature: { $regex: new RegExp(nameSignature, 'i') } },
                    { "dataCustomer.fullName": { $regex: new RegExp(customerName, 'i') } }
                ]
            }
        });


        if (startDate && endDate) {
            pipeline.push({
                $match: {
                    createdAt: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            });
        } else if (endDate) {
            pipeline.push({
                $match: {
                    createdAt: {
                        $lte: new Date(endDate)
                    }
                }
            });
        } else if (startDate) {
            pipeline.push({
                $match: {
                    createdAt: {
                        $gte: new Date(startDate)
                    }
                }
            });
        }

        const dataFind = await ContractSchema.aggregate(pipeline);

        return res.json({
            message: "get contract success",
            data: {
                contract: dataFind
            }
        })
    },


}

module.exports = contract