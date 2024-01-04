USDPRICE = 1.15
function btnSearch_Press() {
    var address = $('#inptSearch').val();
    if ($("#formSearch")[0].checkValidity()) {
        localStorage.setItem('address', address);
        get_address_data();
    }
    else {
        $("#formSearch")[0].reportValidity();
    }
}

function log_error(err) {
    $('#errLog').text(err);
}

function convert_timestamp_to_date(timestamp) {
    var ts = timestamp * 1000;
    var date = new Date(ts);
    return date.toLocaleString();
}

function get_query_string() {
    var address = location.search.replace('?address=', '');
    var rx = new RegExp("^nano_[a-zA-Z0-9_]+$");
    if (rx.test(address)) {
        localStorage.setItem('address', address);
    }
}

function get_currency_symbol(currency) {

    switch (currency) {
        case 'USD':
            return '$'
            break;
        case 'EUR':
            return '\u20AC'
            break;
        case 'CAD':
            return '$'
            break;
        case 'GBP':
            return '\u00A3'
            break;
        case 'CNY':
            return '\u00A3'
            break;
        case 'JPY':
            return '\u00A3'
            break;
        case 'BTC':
            return '\u20BF'
            break;
        default:
            return '$'
            break;
    }
}


function get_price_data(currency) {
    const apiUrl = 'https://api.coingecko.com/api/v3/coins/markets';
    const vsCurrency = currency;
    const currencySymbol = get_currency_symbol(currency)
    const coinIds = 'nano';
    const apiKey = '';
    const url = `${apiUrl}?vs_currency=${vsCurrency}&ids=${coinIds}&x_cg_demo_api_key=${apiKey}`;

    $.ajax({
        url: url,
        method: 'GET',
        success: function (data) {
            
            if (data[0].current_price == null) {
                $('#fiatPrice').text(USDPRICE);
                $('#fiatSymbol').text("$");
            } else {
                $('#fiatPrice').text(data[0].current_price);
                $('#fiatSymbol').text(currencySymbol);
            }
                
            get_address_data();
        },
        error: function (error) {
            $('#fiatPrice').text('N/A');
        }
    });
}

function get_address_data() {
    var address = localStorage.getItem('address');
    if (address == null) {
        return;
    }
    RPC_SERVER = 'https://node.somenano.com/proxy';
    REQUEST_TIMEOUT = 10 * 1000; // 10 seconds
    HISTORY_COUNT = 10000;
    TABLE_COUNT = 10;
    NANO_DECIMAL = 6;
    FIATPRICE = $('#fiatPrice').text();
    FIATSYMBOL = $('#fiatSymbol').text();
    if (FIATPRICE == 'N/A') {
        FIATPRICE = USDPRICE
    }

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
                        log_error('Failed to parse response from node')
                        console.error('Failed to parse response from node');
                        console.error(this.responseText);
                        reject(e);
                        return;
                    }
                } else if (this.readyState == 4 && this.status != 200) {
                    log_error('Failed to connect to ' + url)
                    console.error('Failed to connect to ' + url);
                    reject();
                    return;
                }
            };
            xhttp.open("POST", url, true);
            xhttp.setRequestHeader("Content-Type", "application/json");
            xhttp.send(JSON.stringify(params));
        });
    }

    function account_balance(address) {
        input = {
            action: 'account_balance',
            account: address
        }
        return post(RPC_SERVER, input);
    }

    function account_history(address) {
        input = {
            action: 'account_history',
            account: address,
            "count": HISTORY_COUNT
        }
        return post(RPC_SERVER, input);
    }

    async function get_account_history(address) {
        let ret = await account_history(address);

        //First Transaction
        var firstTransaction = ret.history[ret.history.length - 1];
        var readableCreatedDate = convert_timestamp_to_date(firstTransaction.local_timestamp);
        $('#txtDateCreated').empty();
        $('#txtDateCreated').append('Created: ' + readableCreatedDate);
        $('#tblTransactions').empty();

        //Latest Transaction
        var latestTransaction = ret.history[0];
        var latestAmountNano = (latestTransaction.amount / 1e30).toFixed(NANO_DECIMAL);
        var latestAmountFiat = latestAmountNano * FIATPRICE;
        var latestDate = convert_timestamp_to_date(latestTransaction.local_timestamp);
        var latestAcct = '<a href="https://nanolooker.com/account/' + latestTransaction.account + '" target="_blank">' + latestTransaction.account + '</a>';
        var latestType = '';
        if (latestTransaction.type == 'send') {
            latestType = '<b style="color:#e04576">' + latestTransaction.type + '</b>'
        } else if (latestTransaction.type == 'receive') {
            latestType = '<b style="color:rgb(22, 199, 132)">' + latestTransaction.type + '</b>'
        } else {
            latestType = '<b style="color:blue">' + latestTransaction.type + '</b>'
        }
        $('#txtLatestType').empty();
        $('#txtLatestAccount').empty();
        $('#txtLatestType').append(latestType);
        $('#txtLatestAccount').append(latestAcct);
        $('#txtLatestAmountNano').text("\u04FE" + latestAmountNano);
        $('#txtLatestAmountFiat').text(FIATSYMBOL + latestAmountFiat.toFixed(2));
        $('#txtLatestDate').text(latestDate);
        $('#txtConfHeight').text(latestTransaction.height);


        //Latest 10 transactions
        ret.history.slice(0, TABLE_COUNT).forEach(transaction => {
            var formattedBalance = (transaction.amount / 1e30).toFixed(NANO_DECIMAL);
            var readableDate = convert_timestamp_to_date(transaction.local_timestamp);
            var acctLink = '<a href="https://nanolooker.com/account/' + transaction.account + '" target="_blank">' + transaction.account + '</a>';
            var transType = '';
            if (transaction.type == 'send') {
                transType = '<b style="color:#e04576">' + transaction.type + '</b>'
            } else if (transaction.type == 'receive') {
                transType = '<b style="color:rgb(22, 199, 132)">' + transaction.type + '</b>'
            } else {
                transType = '<b style="color:blue">' + transaction.type + '</b>'
            }
            var transactionRow = '<tr><td>' + readableDate + '</td><td>' + transType + '</td><td>' + acctLink + '</td><td>' + '\u04FE' + formattedBalance + '</td></tr>';
            $('#tblTransactions').append(transactionRow);
        });
  
    }

    async function get_account_balance(address) {
        let ret = await account_balance(address);
        var acctLink = '<a href="https://nanolooker.com/account/' + address + '" target="_blank">' + address + '</a>';
        $('#txtAddress').empty();
        $('#txtAddress').append(acctLink);
        var formattedBalance = (ret.balance / 1e30).toFixed(NANO_DECIMAL);
        var fiatBalance = formattedBalance * FIATPRICE;
        $('#txtBalanceNano').text("\u04FE" + formattedBalance + " (" + FIATSYMBOL + fiatBalance.toFixed(2) + ")");
    }
    get_account_balance(address);
    get_account_history(address);
}

$(function () {
    get_query_string();
    get_price_data($('#currency').val());  
});