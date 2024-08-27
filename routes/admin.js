var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helpers');
const productHelpers = require('../helpers/product-helpers');
const multer  = require('multer')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/product-images')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix+'.jpg')
  }
})
const upload = multer({ storage: storage })

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
    res.render('admin/view-products', {admin:true, products})
  })
  
});

router.get('/add-product', function(req, res){
  res.render('admin/add-product')
})

router.post('/add-product', upload.single('image'), (req, res) => {
  const product = req.body;
  if (req.file) {
    product.image = req.file.filename; // Adding image filename to product object
  }
  productHelpers.addProduct(product, (result) => {
    res.render('admin/add-product');
  });
});

router.get('/delete-product/:id',(req, res)=>{
  let proId = req.params.id  //to get the id from the get method
  productHelper.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/')
  })
})

module.exports = router;
