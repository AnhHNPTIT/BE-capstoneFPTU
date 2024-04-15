const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const UserSchema = require('../models/user.model');
const CustomerSchema = require('../models/customer.model')
const DesignerSchema = require("../models/designer.model")
const ScheduleSchema = require("../models/schedule.model")
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const emailQueue = require('../queue/sendEmailQueue');
const convertUtcToGmt7 = require('../helper/formatTimeZone');

const user = {
    register_user: async (req, res) => {
        const resultValidator = validationResult(req);
        if (!resultValidator.isEmpty()) {
            return res.status(402).send({ errors: resultValidator.array() })
        }
        const data = req.body;
        const { email, password, role, phoneNumber, dob } = data;
        const checkHaveEmail = await UserSchema.findOne({ email });
        if (checkHaveEmail) {
            return res.status(400).json({ message: "Email đã tồn tại trong hệ thống" })
        }
        const checkHavephone = await UserSchema.findOne({ phoneNumber });
        if (checkHavephone) {
            return res.status(400).json({ message: "phoneNumber đã tồn tại trong hệ thống" })
        }

        const hasspassword = bcrypt.hashSync(password, 10);
        let userCode = "";
        while (userCode.length == 0) {
            if (role === "DESIGNER") {
                userCode = randomUserCode("DE");
            } else if (role === "CUSTOMER") {
                userCode = randomUserCode("KH");
            } else if (role === "STAFF") {
                userCode = randomUserCode("ST");
            }
            const findData = await UserSchema.findOne({ userCode: userCode });
            if (findData != null) {
                userCode = ""
            } else {
                break;
            }
        }

        const datasave = new UserSchema({
            ...data,
            userCode: userCode.toUpperCase(),
            dob: new Date(dob),
            password: hasspassword
        })
        const userCreate = await datasave.save();
        if (role == "CUSTOMER") {
            const { businessName, customerType } = req.body
            const datasaveCustomer = new CustomerSchema({
                customerId: userCreate._id,
                businessName: businessName,
                customerType: customerType
            })
            await datasaveCustomer.save();
        }
        let datasaveDesigner;
        if (role == "DESIGNER") {
            const { cv } = req.body
            datasaveDesigner = new DesignerSchema({
                designerId: userCreate._id,
                cv: cv,
            })
            await datasaveDesigner.save();
            if (datasaveDesigner) {
                const datasaveSchedule = new ScheduleSchema({
                    designerId: datasaveDesigner._id
                })
                await datasaveSchedule.save();
            }
        }
        const accesstoken = createAccessToken({ id: userCreate._id, role: userCreate.role })
        return res.json({
            message: "Tạo tài khoản thành công", data: {
                informationuser: { email, role, designerId: datasaveDesigner ? datasaveDesigner._id : '' },
                cookie: accesstoken
            }
        })
    },
    login_email: async (req, res) => {

        const { email, password } = req.body

        const userdata = await UserSchema.findOne({ email: email });
        if (!userdata) {
            return res.status(400).json({ message: "Tài khoản của bạn sai " })
        }

        if (userdata.isDelete || !userdata.isActive) {
            return res.status(400).json({ message: "Tài khoản của bạn bị xóa hoặc bị chặn login " })
        }
        const isMatch = bcrypt.compareSync(password, userdata.password)
        if (!isMatch) {
            return res.status(400).json({ message: "Mật khẩu của bạn không đúng " })
        }
        const accesstoken = createAccessToken({ id: userdata._id, role: userdata.role })
        const designerInfo = await DesignerSchema.find({ designerId: userdata._id });
        console.log("designerInfo == ", designerInfo);
        return res.status(200).json({
            message: "",
            data: {
                informationuser: { email: email, role: userdata.role, designerId: designerInfo.length > 0 ? designerInfo[0]._id : '' },
                cookie: accesstoken
            }
        });

    },
    login_phone: async (req, res) => {
        const { phoneNumber, password } = req.body

        const userdata = await UserSchema.findOne({ phoneNumber });
        if (!userdata) {
            return res.status(400).json({ message: "phoneNumber của bạn sai " })
        }

        if (userdata.isDelete || !userdata.isActive) {
            return res.status(400).json({ message: "Tài khoản của bạn bị xóa hoặc bị chặn login " })
        }

        const isMatch = await bcrypt.compare(password, userdata.password)
        if (!isMatch) {
            return res.status(400).json({ message: "Mật khẩu của bạn không đúng " })
        }
        const accesstoken = createAccessToken({ id: userdata._id, role: userdata.role })
        const designerInfo = await DesignerSchema.find({ designerId: userdata._id });

        return res.status(200).json({
            message: "",
            data: {
                informationuser: { email: userdata.email, role: userdata.role, designerId: designerInfo.length > 0 ? designerInfo[0]._id : '' },
                cookie: accesstoken
            }
        })
    },
    get_list_user: async (req, res) => {
        const idUser = req.dataToken.id;
        const listUser = await UserSchema.aggregate([
            {
                $project: { password: 0 }
            },
            {
                $match: {
                    _id: { $ne: ObjectId(idUser) },
                    isDelete: false,
                    role: { $ne: "ADMIN" }
                }
            },

        ])
        return res.json({ message: "", data: listUser })
    },
    search_list_user: async (req, res) => {
        const { userCode, fullName, role, startDate, endDate } = req.body;

        const idUser = req.dataToken.id;

        const pipeline = [
            {
                $project: { password: 0 }
            },
            {
                $match: {
                    _id: { $ne: ObjectId(idUser) },
                    role: { $ne: "ADMIN" }
                }
            },
            {
                $match: {
                    $and: [
                        { userCode: { $regex: new RegExp(userCode, 'i') } },
                        { fullName: { $regex: new RegExp(fullName, 'i') } },
                        { role: { $regex: new RegExp(role, 'i') } },
                    ]
                }
            }
        ]
        if (startDate && endDate) {
            pipeline.push({
                $match: {
                    createdAt: {
                        $gte: convertUtcToGmt7(startDate, true),
                        $lte: convertUtcToGmt7(endDate, true, true)
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
                        $gte: new Date(startDate),
                    }
                }
            });
        }
        const listUser = await UserSchema.aggregate(pipeline);
        return res.json({ message: "", data: listUser })
    },

    delete_user: async (req, res) => {
        try {
            const idDelete = req.params.id;
            await UserSchema.findOneAndUpdate({ _id: ObjectId(idDelete) }, {
                $set: {
                    isDelete: true
                }
            })
            return res.json({ message: "Xóa thành công" })
        } catch (error) {
            return res.status(500).json({ message: "Xóa error" })
        }

    },
    change_password: async (req, res) => {
        try {
            const resultValidator = validationResult(req);
            if (!resultValidator.isEmpty()) {
                return res.status(400).send({ errors: resultValidator.array() })
            }
            const idUser = req.dataToken.id;
            const { passwordNew, passwordOld } = req.body;
            const dataUser = await UserSchema.findOne({ _id: ObjectId(idUser) })
            if (dataUser) {
                const isMatch = bcrypt.compareSync(passwordOld, dataUser.password);
                if (isMatch) {
                    const hasspassword = bcrypt.hashSync(passwordNew, 10);
                    const result = await UserSchema.updateOne(
                        { _id: ObjectId(idUser) },
                        { $set: { password: hasspassword } }
                    );
                    return res.status(200).json({ message: "Mật khẩu đã được thay đổi" })
                } else {
                    return res.status(400).json({ message: "Mật khẩu cũ không đúng" })
                }

            } else {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }

        } catch (error) {
            return res.status(500).json({ message: "Server error" })
        }

    },
    send_otp: async (req, res) => {
        const { email } = req.body;
        try {
            const userdata = await UserSchema.findOne({ email: email });
            if (userdata) {
                const getOtp = randomOTP();
                await UserSchema.updateOne(
                    { email: email },
                    { $set: { code_change_password: getOtp } }
                );
                const dataSendEamil = {
                    OTP: getOtp,
                    emailTo: email
                };
                await emailQueue.add('send-email', dataSendEamil);
            } else {
                return res.json({ message: "Tài khoản của bạn không chính xác" })
            }
            return res.json({ message: "Mã OTP đã được gửi tới email" })
        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Error error" })
        }

    },
    change_password_otp: async (req, res) => {
        const { code_change_password, email, passwordNew } = req.body;
        try {
            const userdata = await UserSchema.findOne({ email: email, code_change_password: code_change_password });
            if (userdata) {
                const hasspassword = bcrypt.hashSync(passwordNew, 10);
                await UserSchema.updateOne(
                    { email: email },
                    { $set: { password: hasspassword, code_change_password: "" } }
                );
            } else {
                return res.status(400).json({ message: "Tài khoản  hoặc mã otp của bạn không chính xác" })
            }
            return res.json({ message: "Thay đổi mật khẩu thành công" })
        } catch (error) {
            return res.status(500).json({ message: "Error error" })
        }

    },
    uploadFile: async (req, res) => {
        if (req.file) {
            res.json({ success: true, filename: req.file.filename });
        } else {
            res.json({ success: false, message: 'File upload failed' });
        }
    },
    uploadMultiFile: async (req, res) => {
        if (req.files) {
            res.json({ success: true, fileNames: req.files });
        } else {
            res.json({ success: false, message: 'File upload failed' });
        }
    },

    informationController: async (req, res) => {
        const idUser = req.dataToken.id;
        const data = await UserSchema.findOne({ _id: idUser }).select('-password');
        return res.json({ message: data })
    },

    updateUser: async (req, res) => {
        const { email, password, isActive, role } = req.body;
        const hasspassword = bcrypt.hashSync(password, 10);
        await UserSchema.findOneAndUpdate({ email: email }, { $set: { password: hasspassword, isActive: isActive, role: role } });
        res.json({ success: false, message: 'Update success' });
    },
    get_list_for_role: async (req, res) => {
        const { userCode, fullName, email, phoneNumber, flagGetUser, address, designfile } = req.body;
        const { role } = req.dataToken;
        let roleSeach = '';


        if ((role === "ADMIN" || role === "DESIGNER" || role === "STAFF") && flagGetUser == "CUSTOMER") {
            roleSeach = "CUSTOMER"
        }

        // when role admin filter role staff
        if (role === "ADMIN" && flagGetUser == "STAFF") {
            roleSeach = "STAFF"
        }

        if ((role === "ADMIN" || role === "CUSTOMER" || role === "STAFF" || role === "DESIGNER") && flagGetUser == "DESIGNER") {
            roleSeach = "DESIGNER"
        }

        const pipeline = [
            {
                $project: { password: 0 }
            },
            {
                $match: {
                    role: { $eq: roleSeach }
                }
            },
            {
                $match: {
                    $and: [
                        { userCode: { $regex: new RegExp(userCode, 'i') } },
                        { fullName: { $regex: new RegExp(fullName, 'i') } },

                    ]
                }
            }
        ]

        if ((role === "ADMIN" || role === "STAFF" || role === "DESIGNER" || role === "CUSTOMER") && flagGetUser === "DESIGNER") {
            pipeline.push({
                $lookup: {
                    from: 'designers',
                    localField: '_id',
                    foreignField: 'designerId',
                    as: 'dataDesigner'
                }
            });

            pipeline.push({
                $unwind: {
                    path: "$dataDesigner",
                    preserveNullAndEmptyArrays: true
                }
            });
        }

        if ((role === "ADMIN" || role === "STAFF" || role === "CUSTOMER") && flagGetUser === "DESIGNER") {
            if (!!designfile && designfile.length > 0) {
                pipeline.push({
                    $match: {
                        $and: [
                            { address: { $regex: new RegExp(address, 'i') } },
                            { "dataDesigner.designfile": { $exists: true, $ne: null } },
                            { "dataDesigner.designfile": ObjectId(designfile) } // Thay đổi ở đây, chỉ lấy những documents có "dataDesigner.designfile" giống với designfile
                        ]
                    }
                });
            } else {
                pipeline.push({
                    $match: {
                        $and: [
                            { address: { $regex: new RegExp(address, 'i') } },
                            { "dataDesigner.designfile": { $exists: true, $ne: null } },
                        ]
                    }
                });
            }


            // pipeline.push({
            //     $unwind: {
            //         path: "$dataDesigner_check",
            //         preserveNullAndEmptyArrays: true
            //     }
            // });

            // pipeline.push({
            //     $lookup: {
            //         from: 'projectType',
            //         localField: '_id',
            //         foreignField: 'dataDesigner_check.designfile',
            //         as: 'nameType'
            //     }
            // });
        }
        if ((role === "ADMIN" || role === "STAFF") && (flagGetUser === "STAFF" || flagGetUser == "CUSTOMER")) {
            pipeline.push({
                $match: {
                    $and: [
                        { email: { $regex: new RegExp(email, 'i') } },
                        { phoneNumber: { $regex: new RegExp(phoneNumber, 'i') } }
                    ]
                }
            });
        }
        console.log('====================================');
        console.log(pipeline);
        console.log('====================================');
        const listUser = await UserSchema.aggregate(pipeline);
        return res.json({ message: "", data: listUser })
    },

    updateInformationDESIGNER: async (req, res) => {
        const { id } = req.dataToken;
        const { imageDesigner, listImageProject, skill, designfile, experience, description } = req.body;
        let updateUser = { description };
        if (imageDesigner) updateUser.imageUser = imageDesigner;

        await UserSchema.findOneAndUpdate(
            { _id: id },
            { $set: updateUser },
            { new: true }
        )
        let updateObject = { skill, designfile, experience };

        if (listImageProject.length > 0) updateObject.listImageProject = listImageProject;

        await DesignerSchema.findOneAndUpdate(
            { designerId: id },
            { $set: updateObject },
            { new: true }
        );


        res.json({ success: true, message: 'Update success' });
    },
    getDesignerInfo: async (req, res) => {
        const { designerId } = req.params;
        const userInfo = await DesignerSchema.find({ designerId: designerId });
        res.json({ success: true, message: 'Get user info successfully', userInfo: userInfo[0] });
    },
    getInformationDESIGNER: async (req, res) => {
        const { id } = req.params;
        const idUser = req.dataToken.id;

        const userInfo = await UserSchema.find({ _id: idUser });
        const data = await DesignerSchema.aggregate([
            {
                $match: {
                    _id: ObjectId(id),
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'designerId',
                    foreignField: '_id',
                    as: 'dataDesigner'
                }
            }
        ]);

        res.json({ success: true, message: data, userInfo: userInfo[0] });
    },
    get_profile: async (req, res) => {
        const { id, role } = req.dataToken;
        let dataProfile = await UserSchema.aggregate([
            {
                $match: {
                    _id: ObjectId(id),
                }

            },
            {
                $project: { password: 0 }
            }

        ])
        res.json({ message: " ", data: dataProfile });
    },
    update_user: async (req, res) => {
        let { id } = req.dataToken;
        const { image, fullName, dob, phoneNumber, email } = req.body
        await UserSchema.findOneAndUpdate({ _id: id }, { $set: { imageUser: image, fullName: fullName, dob: dob, phoneNumber: phoneNumber, email: email } })
        res.json({ message: "update thành công", data: {} });
    }
}


const createAccessToken = (data) => {
    return jwt.sign(data, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '11h' })
}

const randomUserCode = (data) => {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomString = data;
    for (let i = 0; i < 6; i++) {
        let random = "";
        random = characters.charAt(Math.floor(Math.random() * characters.length));
        randomString += random;
    }
    return randomString;
}


const randomOTP = () => {
    const length = Math.floor(Math.random() * 3) + 5;
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomString = '';
    for (let i = 0; i < length; i++) {
        random = Math.floor(Math.random() * characters.length)
        randomString += random;
    }

    return randomString;
}

module.exports = user