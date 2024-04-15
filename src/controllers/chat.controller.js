
const LastMeesageSchema = require("../models/lastmessage.model");
const MeesageChatSchema = require("../models/messagechat.model");

const Chat = {
    get_message_last: async (req, res) => {
        const { idStaff } = req.body
        const dataLastChat = await LastMeesageSchema.aggregate([
            {
                $match: {
                    idStaff: ObjectId(idStaff),

                },
            },
            {
                $lookup: {
                    from: 'users',
                    let: { idCustomer: '$idCustomer' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$_id', '$$idCustomer'] },
                                isDelete: false,
                                isActive: true
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                fullName: 1,
                                imageUser: 1,
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
                    let: { idStaff: '$idStaff' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$_id', '$$idStaff'] },
                                isDelete: false,
                                isActive: true
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                fullName: 1,
                                imageUser: 1,
                                email: 1 // Include other fields you want to retrieve
                            }
                        }
                    ],
                    as: 'staffData'
                }
            }
        ])
        return res.json({
            message: "Create success",
            data: {
                dataLastChat
            }
        })
    },
    item_message_chat: async (req, res) => {
        const { idCustomer, timeGet } = req.body
        let timeCheck = timeGet ? new Date(timeGet) : new Date();
        const dataLast = await MeesageChatSchema.aggregate([
            {
                $match: {
                    idCustomer: ObjectId(idCustomer),
                    time: {
                        $lt: timeCheck
                    },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    let: { idCustomer: '$idCustomer' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$_id', '$$idCustomer'] },
                                isDelete: false,
                                isActive: true
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                fullName: 1,
                                imageUser: 1,
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
                    let: { idStaff: '$idStaff' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$_id', '$$idStaff'] },
                                isDelete: false,
                                isActive: true
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                fullName: 1,
                                imageUser: 1,
                                email: 1 // Include other fields you want to retrieve
                            }
                        }
                    ],
                    as: 'staffData'
                }
            },
            {
                $sort: { time: -1 } // Sort by time in descending order
            },
            {
                $limit: 10 // Limit the number of results to 10
            }
        ])
        return res.json({
            message: "get list success",
            data: {
                dataLast
            }
        })
    },
    update_unread: async (req, res) => {
        const { id_last_message } = req.body;
        await LastMeesageSchema.findOneAndUpdate({ _id: ObjectId(id_last_message) }, {
            $set: {
                unread: 0
            }
        })
        return res.json({
            message: "update unread  success",
            data: {
                
            }
        })
    },
    search_data : async (req, res) => { 
      const { fullName } = req.body;
      const dataLastChat = await LastMeesageSchema.aggregate([
        {
            $match: {
                idStaff: ObjectId(idStaff),

            },
        },
        {
            $lookup: {
                from: 'users',
                let: { idCustomer: '$idCustomer' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$idCustomer'] },
                            isDelete: false,
                            isActive: true,
                            fullName: { $regex: new RegExp(fullName, 'i') } ,
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            fullName: 1,
                            imageUser: 1,
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
                let: { idStaff: '$idStaff' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$idStaff'] },
                            isDelete: false,
                            isActive: true
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            fullName: 1,
                            imageUser: 1,
                            email: 1 // Include other fields you want to retrieve
                        }
                    }
                ],
                as: 'staffData'
            }
        }
    ])
    return res.json({
        message: "Create success",
        data: {
            dataLastChat
        }
    })
    }
}



module.exports = Chat