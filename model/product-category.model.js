const mongoose = require("mongoose")
const slug = require("mongoose-slug-updater")   // slug de seo // vd: tu dong chuyen sản phẩm 1 thành san-pham-1

mongoose.plugin(slug)

const productCategorySchema = new mongoose.Schema(
    { 
        title: String,
        parent_id:{
            type: String,
            default: ""
        },
        description: String,
        thumbnail: String,
        status: String,
        position: Number,
        slug:{
            type: String,
            slug: "title",   // slug: chuyen title thanh dang chuan seo 
            unique: true    // unique tranh trung title
        },
        deleted:{
            type: Boolean,
            default: false // nếu không truyền vào thì mặc định là false
        },
        deletedAt: Date
    },
    {
        timestamps: true
    }
)

const ProductCategory = mongoose.model('ProductCategory'/*ten model */, productCategorySchema, "products-category" /*ten collection*/)

module.exports = ProductCategory