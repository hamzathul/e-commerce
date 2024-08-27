var db = require('../config/connection')
var collection = require('../config/collections');
const { resolve, reject } = require('promise');
var objectId = require('mongodb').ObjectId


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
        return new Promise((resolve, reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:new objectId(proId)}).then((response)=>{
                resolve(response)
            })
        })
    }
};
