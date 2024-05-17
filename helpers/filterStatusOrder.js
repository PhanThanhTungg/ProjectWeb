module.exports = (query)=>{
    let filterStatusOrder=[
        {
            name: "Tất cả",
            status: "",
            class: ""
        },
        {
            name: "Đang xác nhận",
            status: "xacNhan",
            class: ""
        },
        {
            name: "Đã xác nhận",
            status: "daXacNhan",
            class: ""
        },
        {
            name: "Đang vận chuyển",
            status: "dangVanChuyen",
            class: ""
        },
        {
            name: "Đã giao",
            status: "daGiao",
            class: ""
        },
        {
            name: "Đã thanh toán",
            status: "daThanhToan",
            class: ""
        },
        {
            name: "Đã hủy",
            status: "daHuy",
            class: ""
        },
        {
            name: "Bị bom",
            status: "biBom",
            class: ""
        }
        
    ]
    // query status
    if(query.status){
        const index = filterStatusOrder.findIndex(item => item.status == query.status)
        filterStatusOrder[index].class ="active"
    }
    else{
        const index = filterStatusOrder.findIndex(item => item.status == "")
        filterStatusOrder[index].class ="active"
    }
    return filterStatusOrder
}