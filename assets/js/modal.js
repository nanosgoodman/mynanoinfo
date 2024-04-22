function open_modal(_address) {
    $('#modal').show()
    set_modal_qr(_address)
}

function close_modal() {
    $('#modal').hide()
    $('#modalQR a').empty()
}

function set_modal_qr(_address) {

    $('#modalQR a').qrcode({
        render: 'image',
        text: _address,
        ecLevel: 'L',
        size: '150'
    });

    $('#modalAddress').text(_address)

}