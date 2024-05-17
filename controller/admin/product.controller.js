const Product = require("../../model/product.model")
const systemConfig = require("../../config/system")

const filterStatusHelper = require("../../helpers/filterStatus")
const searchHelper = require("../../helpers/search")
const paginationHelper = require("../../helpers/pagination")

const createTreeHelper = require("../../helpers/createTree")
const ProductCategory = require("../../model/product-category.model")
const Account = require("../../model/account.model")

module.exports.index = async(req,res)=>{
    
    let find = {
        deleted: false,
    }

    //status
    if(req.query.status) find.status = req.query.status  // kiểm tra xem có yêu cầu request không, sau dấu ? trên url
    const filterStatus = filterStatusHelper(req.query)

    //search
    const objectSearch = searchHelper(req.query)
    if(objectSearch.regex){
        find.title = objectSearch.regex
    }

    //sort
    let sort = {}

    if(req.query.sortKey && req.query.sortValue){
        sort[req.query.sortKey] = req.query.sortValue
    }
    else{
        sort.position = "desc"
    }
    //end sort

    
    //Pagigation
    const countProduct = await Product.countDocuments(find) // đếm số sản phẩm theo bộ lọc find
    let objectPagination = paginationHelper(
        {
            currentPage : 1,
            limit : 6
        },
        req.query,
        countProduct
    )
    //End pagigation
    const products = await Product.find(find).limit(objectPagination.limit)
    .skip(objectPagination.skip)
    .sort(sort) // asc

    for(const product of products){
        const user = await Account.findOne({_id: product.createBy.account_id})

        if(user){
            product.accountFullName = user.fullName
        }

        const updateBy = product.updatedBy[product.updatedBy.length -1]
        if(updateBy){
            const userUpdated = await Account.findOne({
                _id : updateBy.account_id
            })

            updateBy.accountFullName = userUpdated.fullName
        }
    }
    

    //limit: giới hạn hiển thị // skip: bỏ qua sản phẩm hiển thị
    res.render("admin/pages/products/index.pug",{
        pageTitle: "Danh sách sản phẩm",
        products : products,
        filterStatus: filterStatus,
        keyword: objectSearch.keyword,
        pagination: objectPagination
    })
}

module.exports.changeStatus = async (req,res)=>{
    const status = req.params.status  //lay ra gia tri params dong ben route  // req.query: lay sau dau ?
    const id = req.params.id

    await Product.updateOne({_id: id}, {status: status})
    // Product.updateOne({id},{thuoc tinh muon thay doi})

    req.flash('success', 'Thay đổi trạng thái thành công!')

    res.redirect("back") // Quay lai trang truoc khi chuyen huong
}

module.exports.changeMulti = async (req,res)=>{
    const type = req.body.type
    const ids = req.body.ids.split(", ")
    switch(type){
        case "active":
            await Product.updateMany({_id:{$in: ids}}, {status: "active"})
            req.flash('success', 'Thay đổi trạng thái thành công!')
            break
        case "inactive":
            await Product.updateMany({_id:{$in: ids}}, {status: "inactive"})
            req.flash('success', 'Thay đổi trạng thái thành công!')
            break
        case "delete-all":
            await Product.updateMany(
                {_id:{$in: ids}},  // lay ra cac ban ghi co id thuoc ids da split 
                {
                    deleted: "true", 
                    deletedBy: {
                        account_id : res.locals.user.id,
                        deletedAt: new Date()
                    }
                })
            req.flash('success', 'Xóa thành công!')
            break
        case "change-position":
            for(const item of ids){
                let [id, position] = item.split("-")
                position = parseInt(position)

                await Product.updateOne({_id: id}, {position: position})
            }
            req.flash('success', 'Thay đổi vị trí thành công!')
            break
        default:
            break
    }
    res.redirect("back") // Quay lai trang truoc khi chuyen huong
     
}

module.exports.deleteItem = async (req,res)=>{
    const id = req.params.id

    // await Product.deleteOne({_id: id}) : xoa cung

    await Product.updateOne({_id: id}, 
        {
            deleted: true,
            deletedBy: {
                account_id : res.locals.user.id,
                deletedAt: new Date()
            }
        }
    )

    res.redirect("back") // Quay lai trang truoc khi chuyen huong
}

module.exports.create = async (req,res)=>{

    let find={
        deleted: false,
        status: "active"
    }

    const category = await ProductCategory.find(find)

    const newCategory = createTreeHelper.tree(category)

    res.render("admin/pages/products/create",{
        pageTitle: "Thêm mới sản phẩm",
        category : newCategory
    })
}

module.exports.createPost = async (req,res)=>{
    req.body.price = parseInt(req.body.price)
    req.body.discountPercentage = parseInt(req.body.discountPercentage)
    req.body.stock = parseInt(req.body.stock)

    if(req.body.position == "") {
        const countProducts = await Product.countDocuments()
        req.body.position = countProducts + 1
    } else {
        req.body.position = parseInt(req.body.position)
    }     

    req.body.createBy = {
        account_id : res.locals.user.id
    }

    const product = new Product(req.body)
    await product.save(); // save vao database

    res.redirect(`${systemConfig.prefixAdmin}/products`) //chuyen huong den url
}

module.exports.edit = async (req,res)=>{
    try {
        const find = {
            deleted: false,
            _id : req.params.id
        }
    
        const product = await Product.findOne(find)
    
        const category = await ProductCategory.find({deleted: false})
    
        const newCategory = createTreeHelper.tree(category)
    
        res.render("admin/pages/products/edit",{
            pageTitle: "Chỉnh sửa sản phẩm",
            product: product,
            category: newCategory
        })
    } catch (error) {
        res.redirect(`${systemConfig.prefixAdmin}/products`) //chuyen huong den url
    }
}

module.exports.editPatch = async (req,res)=>{
    req.body.price = parseInt(req.body.price)
    req.body.discountPercentage = parseInt(req.body.discountPercentage)
    req.body.stock = parseInt(req.body.stock)
    req.body.position = parseInt(req.body.position)

    // if(req.file){
    //     req.body.thumbnail = `/uploads/${req.file.filename}` // cap nhat anh o local
    // }
    // //req.file tra ve object file anh 
      
    
    try {
        const objectUpdatedBy = {
            account_id: res.locals.user.id,
            updatedAt: new Date()
          };
      
        await Product.updateOne({
            _id: req.params.id,
            deleted: false
        }, {
            ...req.body,
            $push: { updatedBy: objectUpdatedBy }
        });
        req.flash('success', 'Cập nhật thành công!')
    } catch (error) {
        req.flash('error', 'Cập nhật Thất bại!')
    }

    res.redirect(`back`) //chuyen huong den url
}

module.exports.detail = async (req,res)=>{
    try {
        const find = {
            deleted: false,
            _id : req.params.id
        }
    
        const product = await Product.findOne(find)
    
        res.render("admin/pages/products/detail",{
            pageTitle: product.title,
            product: product
        })
    } catch (error) {
        res.redirect(`${systemConfig.prefixAdmin}/products`) //chuyen huong den url
    }
}
