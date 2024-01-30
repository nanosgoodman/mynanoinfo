RPC_SERVER = 'https://nanoslo.0x.no/proxy';
REQUEST_TIMEOUT = 10 * 1000;	// 10 seconds
TABLEBODY_ELEMENT = $('#tableBody');

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

async function RUN_find_online_reps() {
    var list = await representatives_online();
    return list.representatives;
}

function representatives_online() {
    input = {
        action: 'representatives_online'
    }
    return post(RPC_SERVER, input);
}

async function RUN_distribute() {
    var destination_addresses = await RUN_find_online_reps()
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
                let link = 'https://nanolooker.com/account/' + destination_address
                TABLEBODY_ELEMENT.append('<tr><td><a href="https://nanolooker.com/account/' + destination_address + '">' + destination_address + '</a></td></tr>');
            }
            $("#count").append(count);
        },
        // Error callback
        function (jqXHR, textStatus, errorThrown) {
            console.error("Error loading excluded_addresses.txt:", textStatus, errorThrown);
        }
    );
}

$(function () {
    RUN_distribute();
    
});