var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');
var userHelpers = require('../helpers/user-helpers');
const { response } = require('../app');
const verifyLogin = (req, res, next)=>{  //session middleware
  if(req.session.userLoggedIn){
    next()
  } else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function (req, res, next) {
  let cartCount = null
  if(req.session.user){
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  
  let user = req.session.user
  console.log(user)
  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products', { products, user, cartCount })
  })
});

router.get('/login', (req, res)=>{
  if(req.session.user){

    res.redirect('/')
  } else{
    res.render('user/login', {"loginErr": req.session.userLoginErr})
    req.session.userLoginErr = false
  }
  
})

router.get('/signup',(req, res)=>{
  res.render('user/signup')
})

router.post('/signup', (req, res)=>{
  userHelpers.doSignup(req.body).then((response)=>{
    req.session.user = response
    req.session.userLoggedIn = true
    res.redirect('/')
  })
})

router.post('/login',(req, res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.user = response.user
      req.session.userLoggedIn = true
      res.redirect('/')
    } else{
      req.session.userLoginErr = "Invalid username or password"
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req, res)=>{
  // req.session.destroy()
  req.session.user = null
  res.redirect('/')
})

router.get('/cart', verifyLogin, async(req, res)=>{
  let products =await userHelpers.getCartProducts(req.session.user._id)
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  console.log(products)
  res.render('user/cart',{products, user:req.session.user._id, totalValue})
})

router.get('/add-to-cart/:id',verifyLogin, (req, res)=>{
  userHelpers.addToCart(req.params.id, req.session.user._id).then(()=>{
    res.json({status:true})
  })
})

router.post('/change-product-quantity/', (req, res, next)=>{
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    const totalAmount = await userHelpers.getTotalAmount(req.body.user)  
    console.log(totalAmount)
    if(totalAmount == -1){
      response.cartEmpty = true
    } else{
      response.total = totalAmount
    }
    res.json(response)
  })
})

router.get('/place-order', verifyLogin, async (req, res)=>{
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order', {total, user:req.session.user})
})

router.post('/place-order', async(req, res)=>{
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body, products, totalPrice).then((orderId)=>{
    if(req.body['payment-method']=='COD'){
      res.json({codSuccess:true})
    } else{
      userHelpers.generateRazorpay(orderId, totalPrice).then((response)=>{
        res.json(response)
      })
    }
  })
  console.log(req.body)
})

router.get('/order-success', (req, res)=>{
  res.render('user/order-success',{user:req.session.user})
})

router.get('/orders', verifyLogin,async(req, res)=>{
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders', {user:req.session.user, orders})
})

router.get('/view-order-products/:id', async(req, res)=>{
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/orders',{user:req.session.user, products})
})

router.post('/verify-payment',(req, res)=>{
  console.log(req.body)
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log("Payment Successful")
      res.json({status:true})
    })
  }).catch((err)=>{
    res.json({status:false, errMsg:'Payment failed'})
  })
}),

router.get('/remove-from-cart/:id', verifyLogin, (req, res) => {
  userHelpers.removeFromCart(req.session.user._id, req.params.id).then((response) => {
      if (response.status) {
          res.redirect('/cart');
      } else {
          // Handle failure case
          res.redirect('/cart');
      }
  }).catch((error) => {
      console.error('Error removing product from cart:', error);
      res.redirect('/cart');
  });
});


module.exports = router;
