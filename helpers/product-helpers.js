var db = require('../config/connection')
var collection = require('../config/collections');
const { resolve, reject } = require('promise');
var objectId = require('mongodb').ObjectId
const fs = require('fs')


module.exports = {
    addProduct: (product, callback) => {
        console.log(product);
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
            console.log(data);
            callback(data);
        });
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray();
            resolve(products);
        });
    },
    deleteProduct:(proId)=>{
        return new Promise(async(resolve, reject)=>{
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id: new objectId(proId)});
            const imagePath = './public/product-images/' + product.image;
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error("Failed to delete image file:", err);
                    reject(err);
                } else {
                    console.log("Image file deleted:", imagePath);
                }
            });
            //
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:new objectId(proId)}).then((response)=>{
                resolve(response)
            })
        })
    }
};
