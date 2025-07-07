/// NANO RPC ///
RPC_SERVER = 'https://nanoslo.0x.no/proxy';
REQUEST_TIMEOUT = 10 * 1000;
TABLEBODY_ELEMENT = $('#tableBody');
ACCOUNT_LINK = '/?address=';

function post(url, params) {

    return new Promise((resolve, reject) => {
        let xhttp = new XMLHttpRequest();
        xhttp.timeout = REQUEST_TIMEOUT;
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                try {
                    resolve(JSON.parse(this.responseText));
                    return;
                } catch (e) {
                    console.log('Failed to parse response from node');
                    console.error(this.responseText);
                    reject(e);
                    return;
                }
            } else if (this.readyState == 4 && this.status != 200) {
                console.log('Failed to connect to ' + url);
                reject();
                return;
            }
        };
        xhttp.open("POST", url, true);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.send(JSON.stringify(params));
    });
}

async function find_representatives_online() {
    var list = await representatives_online();
    return list.representatives;
}

function representatives_online() {
    input = {
        action: 'representatives_online'
    }
    return post(RPC_SERVER, input);
}

async function find_reps() {
    var destination_addresses = await find_representatives_online()
    await $.when($.get('assets/txt/excluded_addresses.txt')).then(
        // Success callback
        function (data) {
            var addresses_to_exclude = data.split(/\r?\n/);

            destination_addresses = destination_addresses.filter(function (address) {
                return !addresses_to_exclude.includes(address);
            });

            var count = 0;
            for (let destination_address of destination_addresses) {
                count += 1;
                let link = ACCOUNT_LINK + destination_address
                TABLEBODY_ELEMENT.append('<tr><td><a href="' + ACCOUNT_LINK + destination_address + '">' + destination_address + '</a></td></tr>');
            }
            $("#count").append(count);
        },
        // Error callback
        function (jqXHR, textStatus, errorThrown) {
            console.error("Error loading excluded_addresses.txt:", textStatus, errorThrown);
        }
    );
}
/// NANO RPC ///


/// QR CODES ///
function toggle_protocol_qr() {
    if (PROTOCOL_HDN == true) {
        PROTOCOL_HDN = false;
        $('#protocolQR').show();
        $('#protocolBtn').val('Hide QR');
    } else {
        PROTOCOL_HDN = true;
        $('#protocolQR').hide();
        $('#protocolBtn').val('Show QR');
    }
}

function toggle_community_qr() {
    if (COMMUNITY_HDN == true) {
        COMMUNITY_HDN = false;
        $('#communityQR').show();
        $('#communityBtn').val('Hide QR');
    } else {
        COMMUNITY_HDN = true;
        $('#communityQR').hide();
        $('#communityBtn').val('Show QR');
    }
}

function toggle_rep_qr() {
    if (REP_HDN == true) {
        REP_HDN = false;
        $('#repQR').show();
        $('#repBtn').val('Hide QR');
    } else {
        REP_HDN = true;
        $('#repQR').hide();
        $('#repBtn').val('Show QR');
    }
}

function set_qr_codes() {
    PROTOCOL_HDN = true;
    COMMUNITY_HDN = true;
    REP_HDN = true;
    QR_SIZE = '150';

    $('#protocolQR a').qrcode({
        render: 'image',
        text: "nano_3fundme3zgwcezey4wo1auae1o16yjds7gw8f9bpke4hrzks966i5qpkycxw",
        ecLevel: 'L',
        size: QR_SIZE
    });

    $('#communityQR a').qrcode({
        render: 'image',
        text: "nano_1yap96nsw6jmotwfp913i6tgj1ky4hq8sntr8j7k1fatx8x319q44ft7e5r3",
        ecLevel: 'L',
        size: QR_SIZE
    });

    $('#repQR a').qrcode({
        render: 'image',
        text: "nano_3tipkghx86us41os5e1e15ywokynye4ekodd9b57bdy9jkrnghfskqt78m18",
        ecLevel: 'L',
        size: QR_SIZE
    });

    $('#protocolQR').hide();
    $('#communityQR').hide();
    $('#repQR').hide();
}

/// QR CODES ///


/// ON DOM LOAD ///

$(function () {
    ///set_qr_codes();
    ///find_reps();
});