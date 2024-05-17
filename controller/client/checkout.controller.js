const Cart = require("../../model/cart.model");
const Product = require("../../model/product.model");
const Order = require("../../model/order.model");

module.exports.index = async (req, res) => {
  const cartId = req.cookies.cartId;

  const cart = await Cart.findOne({
    _id: cartId
  });

  cart.totalPrice = 0;

  if(cart.products.length > 0) {
    for (const item of cart.products) {
      const product = await Product.findOne({
        _id: item.product_id
      }).select("thumbnail title slug price discountPercentage");

      product.priceNew = (product.price * (100 - product.discountPercentage)/100).toFixed(0);

      item.productInfo = product;

      item.totalPrice = item.quantity * product.priceNew;

      cart.totalPrice += item.totalPrice;
    }
  }

  res.render("client/pages/checkout/index", {
    pageTitle: "Đặt hàng",
    cartDetail: cart
  });
};


module.exports.order = async (req, res) => {
  const cartId = req.cookies.cartId
  const userInfo = req.body

  const cart = await Cart.findOne({
    _id: cartId
  })

  const products = []

  for (const product of cart.products) {
    const objectProduct = {
      product_id: product.product_id,
      price: 0,
      discountPercentage: 0,
      quantity: product.quantity,
    }

    const productInfo = await Product.findOne({
      _id: product.product_id
    }).select("price discountPercentage")

    objectProduct.price = productInfo.price
    objectProduct.discountPercentage = productInfo.discountPercentage

    products.push(objectProduct)
  }

  const orderInfo = {
    tokenUser: req.cookies.tokenUser,
    cart_id: cartId,
    userInfo: userInfo,
    products: products,
  }


  const order = new Order(orderInfo)
  order.save()

  await Cart.updateOne({
    _id: cartId
  }, {
    products: []
  });

  res.redirect(`/checkout/success/${order.id}`)
}

module.exports.success = async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.orderId
  })
  var totalPrice = 0

  for (const product of order.products) {
    const infoProduct = await Product.findOne({
      _id: product.product_id
    })

    product.title = infoProduct.title
    product.thumbnail = infoProduct.thumbnail

    product.priceNew = (product.price * (100 - product.discountPercentage)/100).toFixed(0)

    product.totalPrice = product.priceNew * product.quantity
    const currentStock = infoProduct.stock-product.quantity
    await Product.updateOne({_id: product.product_id},{
      stock: currentStock,
      sales: infoProduct.sales + product.quantity
    })

    totalPrice += product.totalPrice
  }
  order.totalPrice = totalPrice

  res.render("client/pages/checkout/success", {
    pageTitle: "Đặt hàng thành công",
    order: order
  })
}