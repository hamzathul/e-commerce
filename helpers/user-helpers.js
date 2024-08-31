var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { resolve, reject } = require('promise')
const { ObjectId } = require('mongodb')
const { promise } = require('bcrypt/promises')
const collections = require('../config/collections')
const { response } = require('../app')
var objectId = require('mongodb').ObjectId

module.exports = {
    doSignup:(userData)=>{
        return new Promise(async(resolve, reject)=>{
            userData.Password =await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data)
            })
        })
        
    },

    doLogin:(userData)=>{
        return new Promise(async(resolve, reject)=>{
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
                bcrypt.compare(userData.Password, user.Password).then((status)=>{
                    if(status){
                        console.log("Login Success!")
                        response.user = user
                        response.status=true
                        resolve(response)
                    } else{
                        console.log("Login failed!")
                        resolve({status:false})
                    }
                })
            } else{
                console.log('login failed')
                resolve({status:false})
            }

        })
    },
    addToCart:(proId, userId)=>{
        let proObj = {
            item: new ObjectId(proId),
            quantity:1,
        }
        return new Promise(async(resolve, reject)=>{
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({user:new objectId(userId)})
            if(userCart){
                let proExist = userCart.products.findIndex(product=> product.item==proId)
                console.log(proExist)
                if(proExist!=-1){
                    db.get().collection(collection.CART_COLLECTION).updateOne({user:new objectId(userId), 'products.item': new objectId(proId) },
                    {
                        $inc:{'products.$.quantity':1}
                    }
                    ).then(()=>{
                        resolve()
                    })
                    } else{
                    db.get().collection(collection.CART_COLLECTION).updateOne({user:new objectId(userId)},{
                        $push:{products:proObj}
                    }).then((response)=>{
                        resolve()
                    })
                }


                
            } else{
                let cartObj = {
                    user:new objectId(userId),
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve, reject)=>{
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:new objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product', 0]}
                    }
                }
            ]).toArray()
            resolve(cartItems)
        })
    },
    getCartCount:(userId)=>{
        let count = 0
        return new Promise(async(resolve, reject)=>{
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:new objectId(userId)})
            if(cart){
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity:(details)=>{
        details.count = parseInt(details.count)
        return new Promise((resolve, reject)=>{
            if(details.count==-1 && details.quantity==1){
                db.get().collection(collections.CART_COLLECTION).updateOne({_id: new objectId(details.cart)},
                {
                    $pull:{products:{item:new objectId(details.product)}}
                }
                ).then((response)=>{
                resolve({removeProduct:true})
                })
            } else{
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:new objectId(details.cart), 'products.item': new objectId(details.product) },
                    {
                       $inc:{'products.$.quantity':details.count}
                    }
                    ).then((response)=>{
                        resolve({status:true})
                    })
            }
        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async(resolve, reject)=>{
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:new objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product', 0]}
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$product.price']}}
                    }
                }


            ]).toArray()
            console.log(total[0].total)
            resolve(total[0].total)
        })       
    },
    placeOrder:(order, products, total)=>{
        return new Promise((resolve, reject)=>{
            let status = order['payment-method']==='COD'?'placed':'pending'
            let orderObj = {
                deliveryDetails:{
                    mobile:order.mobile,
                    address:order.address,
                    pincode:order.pincode
                },
                userId: new objectId(order.userId),
                paymentMethod:order['payment-method'],
                totalAmount:total,
                products:products,
                status:status,
                date:new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).deleteOne({user: new ObjectId(order.userId)})
                resolve()
            })
        })
    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve, reject)=>{
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user: new objectId(userId)})
            resolve(cart.products)
        })
    }
}