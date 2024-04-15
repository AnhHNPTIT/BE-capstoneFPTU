// export const updateChat = async (data) => {
//     const { id_last_message, idCustomer, idStaff, message, image, file, time, noUserOnline } = data;
//     const filter = { _id: ObjectId(id_last_message) };
//     const update = {
//         $set: {
//             idCustomer: idCustomer,
//             idStaff: noUserOnline ? await findStaffId() : idStaff,
//             message: message,
//             image: image,
//             file: file,
//             time: new Date(time),
//         },
//         $inc: { unread: 1 }
//     };
    
//     const messageData = {
//         ...data,
//         idStaff: noUserOnline ? await findStaffId() : idStaff,
//         time: new Date(time),
//     };

//     const newData = new MessageChatSchema(messageData);
//     await newData.save();
//     await LastMessageSchema.findOneAndUpdate(filter, update, { upsert: true, new: true }).exec();
// }
