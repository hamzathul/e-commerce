var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { resolve, reject } = require('promise')
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
        return new Promise(async(resolve, reject)=>{
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({user:new objectId(userId)})
            if(userCart){
                db.get().collection(collection.CART_COLLECTION).updateOne({user:new objectId(userId)},{
                    $push:{products:new objectId(proId)}
                }).then((response)=>{
                    resolve()
                })
            } else{
                let cartObj = {
                    user:new objectId(userId),
                    products:[new objectId(proId)]
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
                    $lookup:{
                        from: collection.PRODUCT_COLLECTION,
                        let:{prodList:'$products'},
                        pipeline:[
                            {
                                $match:{
                                    $expr:{
                                        $in:['$_id', '$$prodList']
                                    }
                                }
                            }

                        ],
                        as:'cartItems'
                    }
                }
            ]).toArray()
            resolve(cartItems[0].cartItems)
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
    }
}