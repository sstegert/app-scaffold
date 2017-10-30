var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ReceiptSchema = new Schema({
    reference: String,

    files : [{
        path: String,
        mimetype : String,
        height: String,
        width: String,
        rotation : {type: Number, default : 0}
    }],
    //filepath: String,
    //filetype:  String,
    
    amount: {type : Number, default : null},
    date: {type: Date, default: ''},
    receipient: {type: String, default : ''},
    //receipient_ref: String,
    type: String,

    ref_cftx : [String],
    ref_atx : [String],


});

module.exports = mongoose.model('Receipt',ReceiptSchema);