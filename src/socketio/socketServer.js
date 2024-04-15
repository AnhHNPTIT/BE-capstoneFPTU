
let listUserStaffAndAdminOnline = [];
// array = { id  : string and socketIds  : array }
let listUserCustomerOnline = [];

let roomChat = [];
// array  { id  : string and idCustomer  : array   , numberStaff : number}
const emailQueue = require('../queue/sendEmailQueue');

const SocketServer = (socket, io) => {
    socket.on('disconnect', () => {
        const { id, role } = socket.user;
        if (role == "ADMIN" || role == "STAFF") {
            listUserStaffAndAdminOnline.filter(item => item.id != id)
        } else {
            listUserCustomerOnline.filter(item => item.id != id)
        }
    });


    socket.on('online_user', () => {
        const { id, role } = socket.user;
        const socketId = socket.id;
        if (role == "ADMIN" || role == "STAFF") {
            const findIndexData = listUserStaffAndAdminOnline.findIndex(item => item.id == id);
            if (findIndexData > -1) {
                listUserStaffAndAdminOnline.socketId = socketId
            } else {
                listUserStaffAndAdminOnline.push({
                    id: id,
                    socketId: socketId
                })
            }
        } else {
            const findIndexData = listUserCustomerOnline.findIndex(item => item.id == id);
            if (findIndexData > -1) {
                listUserCustomerOnline.socketId = socketId
            } else {
                listUserCustomerOnline.push({
                    id: id,
                    socketId: socketId
                })
            }
        }
    });


    socket.on("message", async (dataClient) => {
        const { noUserOnline } = dataClient;
        let randomIndex = Math.floor(Math.random() * listUserStaffAndAdminOnline.length);
        let listUserChatOnline = listUserStaffAndAdminOnline[randomIndex];
        if (!noUserOnline) {
            io.to(listUserChatOnline.socketId).emit('message_chat', dataClient);
        }
        await emailQueue.add('update_message', dataClient);
    });


    socket.on("get_customer_online", () => {
        const socketId = socket.id;
        io.to(socketId).emit('list_customer_online', listUserCustomerOnline);
    });

};

module.exports = SocketServer;