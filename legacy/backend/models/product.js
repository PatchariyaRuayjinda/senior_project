const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  productName: { type: String },
  quantity: { type: Number },
  productStatus: { type: String },
  price: { type: Number },
  group: { type: String },
  box: {type: String}
});
module.exports = product = mongoose.model("products", ProductSchema);
