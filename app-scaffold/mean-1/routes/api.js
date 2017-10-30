var express = require('express');
var path = require('path');
var router = express.Router();
var Jimp = require("jimp");

/* require models */
var Receipt = require('../models/receipt');

// middleware to use for all requests
router.use(function(req,res,next){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

router.get('/', function(req, res, next) {
  res.json({message : 'API up and running'});
});

router.route('/receipts')
    .get(function(req,res){
      Receipt.find().exec(function(err, rs){
        res.json(rs);
      });
    });

router.route('/upload')
    .post(function(req,res){

        if (!req.files || !req.files.sampleFile) {
            return res.status(400).send('No files were uploaded.');
        } else {
            Receipt.find().sort({reference: -1}).limit(1).exec(function (err, rs) {
                //console.log(rs);
                var lastId = 0;
                if (rs[0]) {
                    //console.log('Found an id');
                    lastId = parseInt(rs[0].reference.replace('BEL', ''));
                    //console.log(lastId);
                }
                id = lastId + 1;
                //console.log('New Id: ' + id);

                var sId = "0000000" + id;
                sId = sId.substr(sId.length - 8);
                sId = 'BEL' + sId;

                var filePath = path.join(__dirname, '../public/uploads/' + sId + '.jpg');

                // Use the mv() method to place the file somewhere on your server
                req.files.sampleFile.mv(filePath, function (err) {
                    if (err)
                        return res.status(500).send(err);

                    var r = new Receipt();
                    r.reference = sId;
                    r.filepath = 'uploads/';
                    r.filetype = 'jpg';
                    r.receipient = '';
                    r.tx_ref = '';

                    r.save(function (err, r) {
                        if (err) {
                            res.send(err);
                        } else {
                            res.redirect('/#/receipts?ref=' + sId);
                        }
                    });

                });


            });

        }

       //console.log('end') ;
    });

router.route('/upload2')
    .post(function(req,res){

        if (!req.files) {
            return res.status(400).send('No files were uploaded.');
        } else {
            Receipt.find().sort({reference: -1}).limit(1).exec(function (err, rs) {
                //console.log(rs);
                var lastId = 0;
                if (rs[0]) {
                    //console.log('Found an id');
                    lastId = parseInt(rs[0].reference.replace('BEL', ''));
                    //console.log(lastId);
                }
                id = lastId + 1;
                //console.log('New Id: ' + id);

                var sId = "0000000" + id;
                sId = sId.substr(sId.length - 8);
                sId = 'BEL' + sId;

                var ext = 'jpg';  //default extension
                if (req.body.mimetype = 'application/pdf'){
                    ext = 'pdf';
                }

                var filePath = path.join(__dirname, '../public/uploads/' + sId + '.' + ext);

                var file = req.files.file;
                //console.log(file);


                // Use the mv() method to place the file somewhere on your server
                req.files.file.mv(filePath, function (err) {
                    if (err) {
                        return res.status(500).send(err);

                    } else {

                        var r = new Receipt();
                        r.reference = sId;
                        //console.log(req);


                        var fileObj = {
                            path : 'uploads/' + sId + '.' + ext,
                            mimetype : file.mimetype,
                            height: req.body.height,
                            width: req.body.width,
                            rotation: req.body.rotation
                        };
                        r.files.push(fileObj);
                        r.amount = '';
                        r.receipient = '';
                        r.ref_tx = [];

                        r.save(function (err, r) {
                            if (err) {
                                res.send(err);
                            } else {
                                res.json(r);
                            }
                        });
                    }
                });


            });

        }


        //console.log('uploading file') ;
        //res.send(req.files);
    });

router.route('/rotateImage')
    .post(function(req,res){
        if (!req.body.filepath){
            res.json({message: 'No filepath given!'});
        } else {
            Jimp.read(path.join(__dirname, '../public/' + req.body.filepath), function(err, img){
                img.rotate(req.body.deg)
                   .write(path.join(__dirname, '../public/' + req.body.filepath));

                res.statusCode = 200;
                res.json({filepath: req.body.filepath});
            });
        }
    });


router.route('/article')
    .post(function(req,res){
        var a = new Article(req.body);
        a.created = Date.now();
        a.created_by = req.connection.remoteAddress;
        a.updated = null;
        a.updated_by = null;
        a.save(function(err,a){
            if(err){
                res.send(err);
            } else {
                res.json(a);
            }
        });
    });


router.route('/receipt/:reference')
    .get(function(req,res){
      Receipt.findOne({reference:req.params.reference},function(err, r){
        if (err){
          res.send(err);
        } else {
          res.json(r);
        }
      });
    })
    .put(function(req,res){
      Receipt.findOne({reference:req.params.reference},function(err, r) {
        if (err) {
          res.send(err);
        } else {
          if (!r) {
            res.statusCode = 400;
            res.send('Receipt not found')
          } else {
            //updates
            if(req.body.amount)
                r.amount = req.body.amount;
            if(req.body.receipient)
                r.receipient = req.body.receipient;
            if(req.body.receipient_ref)
                r.receipient_ref = req.body.receipient_ref;
            if(req.body.date)
                r.date = req.body.date;
            if(req.body.type)
                r.type = req.body.type;

            if(req.body.ref_cftx)
                r.ref_cftx = req.body.ref_cftx;
            if(req.body.ref_atx)
                r.ref_atx = req.body.ref_atx;

            r.save(function (err, r) {
              if (err) {
                res.send(err);
              } else {
                res.json(r);
              }
            });
          }
        }
      });
    })
    .delete(function(req,res){
      Receipt.remove({reference:req.params.reference},function(err){
        if (err){
          res.send(err);
        } else {
          res.send('Receipt deleted');
        }
      });
    });

module.exports = router;
