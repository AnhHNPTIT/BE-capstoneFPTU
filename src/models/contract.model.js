

const mongoose = require('mongoose');
const { Schema } = mongoose;

const ContractSchema = new Schema({
    custormerId: { type: Schema.Types.ObjectId, ref: 'users', default: null }, // id khách hàng
    designerId: { type: Schema.Types.ObjectId, ref: 'users', default: null },
    nameContract: { type: String }, // tên hợp đồng
    codeContract: { type: String, default: "" }, // mã hợp đồng
    nameSignature: { type: String, default: "" },
    timeSigned: { type: Date },
    imageContract : { type: String, default: "" },
    isDelete :  {
        type: Boolean,
        default: false
    },
}, { timestamps: true })

module.exports = mongoose.model("contracts", ContractSchema)
