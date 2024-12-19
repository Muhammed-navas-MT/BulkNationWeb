const mongoose = require("mongoose");
const {Schema} = mongoose;

const reasonSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    orderId: {
        type: String,
        ref: 'Order',
        required:true,
    },
     reason:{
        type:String,
        required:true,
    },
    sendedAt:{
        type:Date,
        default:Date.now
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    returnStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
});

const Reason= mongoose.model("Reason",reasonSchema);
module.exports = Reason;