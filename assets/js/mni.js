var _usdPrice = 1.13
var _transactionHistory
var _itemsPerPage = 50;
var _currentPage = 1;
var _currentAddress = '';
const ACCOUNT_LINK = '/?address=';
const DEFAULT_CURRENCY = 'USD';
let autoTimer = null;



/* Helpers for currency */
function get_saved_currency() {
    return localStorage.getItem('currency') || DEFAULT_CURRENCY;
}

function save_currency(currency) {
    localStorage.setItem('currency', currency);
}

/* set both selects if they exist (desktop + mobile) */
function sync_currency_selects(currency) {
    $('#currency').val(currency);
    $('#currencyMobile').val(currency);
}

/* origin must be the string 'desktop' or 'mobile' */
function btnSearch_Press(origin) {

    // Pick the right elements
    const formId = origin === 'mobile' ? '#formSearchMobile' : '#formSearch';
    const inputId = origin === 'mobile' ? '#inptSearchMobile' : '#inptSearch';

    const address = $(inputId).val().trim();

    // Native HTML-5 validation
    if ($(formId)[0].checkValidity()) {
        localStorage.setItem('address', address);
        get_address_data();

        $(inputId).val('');        
        $(inputId).blur();         

    } else {
        // Show the built-in validation message
        $(formId)[0].reportValidity();
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
            return '\u0024'
            break;
        case 'EUR':
            return '\u20AC'
            break;
        case 'CAD':
            return '\u0024'
            break;
        case 'GBP':
            return '\u00A3'
            break;
        case 'CNY':
            return '\u00A5'
            break;
        case 'JPY':
            return '\u00A5'
            break;
        case 'BTC':
            return '\u20BF'
            break;
        default:
            return '\u0024'
            break;
    }
}


/* ------------------------------------------------------------------
   Retrieve Nano price in the requested fiat, update both <select>s,
   update the price banner, then refresh the address data.
   origin must be the string 'desktop' or 'mobile'.
-------------------------------------------------------------------*/
function get_price_data(currency, origin) {

    /* 1.  Helper references
    ---------------------------------------------------------------*/
    const $desktopSelect = $('#currency');        // id in <header>
    const $mobileSelect = $('#currencyMobile');  // id in the slide-out bar

    /* 2.  Disable both selects while we are fetching data
    ---------------------------------------------------------------*/
    $desktopSelect.prop('disabled', true);
    $mobileSelect.prop('disabled', true);

    /* 3.  Build request url
    ---------------------------------------------------------------*/
    const apiUrl = 'https://api.coingecko.com/api/v3/coins/markets';
    const coinIds = 'nano';
    const url = `${apiUrl}?vs_currency=${currency}&ids=${coinIds}`;

    /* 4.  Ajax call
    ---------------------------------------------------------------*/
    $.ajax({
        url: url,
        method: 'GET',

        success: function (data) {

            // a. Re-enable the selects
            $desktopSelect.prop('disabled', false);
            $mobileSelect.prop('disabled', false);

            // b. Extract price or fall back to the cached USD price
            const price = data[0] && data[0].current_price != null
                ? data[0].current_price
                : _usdPrice;

            // c. Write price and symbol into the banner
            $('#fiatPrice').text(price);
            $('#fiatSymbol').text(get_currency_symbol(currency));

            // d. store choice and be sure both selects show it
            save_currency(currency);
            sync_currency_selects(currency);

            // e. Refresh the address display (if an address is loaded)
            get_address_data();
        },

        error: function () {

            // a. Show cached USD fallback
            $('#fiatPrice').text(_usdPrice);
            $('#fiatSymbol').text('$');
        }
    });
}

function get_price_data_on_date(date) {
    const apiUrl = 'https://api.coingecko.com/api/v3/coins/nano/history';
    var ret = date.split(', ')[0]
    const formattedDate = moment(ret, "M/D/YYYY").format("DD-MM-YYYY");
    const url = `${apiUrl}?date=${formattedDate}&localization=false`;
    

    $.ajax({
        url: url,
        method: 'GET',
        success: function (data) {
            console.log(data.market_data.current_price.usd);
        },
        error: function (error) {
            console.log(error);
            $('#txtLatestAmountFiat').text("Failed");
        }
    });
}

function get_address_data() {
    var address = localStorage.getItem('address');
    if (address == null) {
        return;
    }
    RPC_SERVER = 'https://nanoslo.0x.no/proxy';
    REQUEST_TIMEOUT = 10 * 1000;
    HISTORY_COUNT = 1000;
    TABLE_COUNT = 10;
    NANO_DECIMAL = 6;
    FIATPRICE = $('#fiatPrice').text();
    FIATSYMBOL = $('#fiatSymbol').text();

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

    function account_representative(address) {
        input = {
            action: 'account_representative',
            account: address
        }
        return post(RPC_SERVER, input);
    }

    async function get_account_balance(address) {
        let ret = await account_balance(address);
        var acctLink = 'Account: <a href="' + ACCOUNT_LINK + address + '">' + address + '</a>';
        $('#txtAddress').empty();
        $('#txtAddress').append(acctLink);
        if (_currentAddress != address) {
            _currentAddress = address
            set_qr(address);
        }
        var formattedBalance = (ret.balance / 1e30).toFixed(NANO_DECIMAL);
        var fiatBalance = formattedBalance * FIATPRICE;
        $('#txtBalanceNano').text("\u04FE" + Number(formattedBalance).toLocaleString() + " (" + FIATSYMBOL + Number(fiatBalance.toFixed(2)).toLocaleString() + ")");
    }

    async function get_account_history(address) {
        let ret = await account_history(address);
        let retRep = await account_representative(address);
        _transactionHistory = ret;

        //First Transaction
        var firstTransaction = ret.history[ret.history.length - 1];
        var readableCreatedDate = convert_timestamp_to_date(firstTransaction.local_timestamp);
        $('#txtDateCreated').empty();
        $('#txtDateCreated').append('Created: ' + readableCreatedDate);
        $('#txtRep').empty();
        $('#txtRep').append('Representative: <a href="' + ACCOUNT_LINK + retRep.representative + '">' + retRep.representative + '</a>');
        $('#tblTransactions').empty();

        //Latest Transaction
        var latestTransaction = ret.history[0];
        var latestAmountNano = (latestTransaction.amount / 1e30).toFixed(NANO_DECIMAL);
        var latestAmountFiat = latestAmountNano * FIATPRICE;
        var latestDate = convert_timestamp_to_date(latestTransaction.local_timestamp);
        var latestHash = '<a href="https://blocklattice.io/block/' + latestTransaction.hash + '" target="_blank">' + latestTransaction.hash + '</a>';
        var latestAcct = '<a href="' + ACCOUNT_LINK + latestTransaction.account + '">' + latestTransaction.account + '</a>';
        var latestType = '';
        if (latestTransaction.type == 'send') {
            latestType = '<b style="color:#e04576">' + latestTransaction.type + '</b>'
        } else if (latestTransaction.type == 'receive') {
            latestType = '<b style="color:rgb(22, 199, 132)">' + latestTransaction.type + '</b>'
        } else {
            latestType = '<b style="color:blue">' + latestTransaction.type + '</b>'
        }
        $('#txtLatestType').empty();
        $('#txtHash').empty();
        $('#txtLatestAccount').empty(); 
        $('#txtLatestType').append(latestType);
        $('#txtHash').append(latestHash);
        $('#txtLatestAccount').append(latestAcct);
        $('#txtLatestAmountNano').text("\u04FE" + Number(latestAmountNano).toLocaleString());
        $('#txtLatestAmountFiat').text(FIATSYMBOL + Number(latestAmountFiat.toFixed(2)).toLocaleString());
        $('#txtLatestDate').text(latestDate);
        $('#txtConfHeight').text(latestTransaction.height);



        updateTable(_currentPage);
        updatePagination();
  
    }

    get_account_balance(address);
    get_account_history(address);
}

function updateTable(page) {
    $('#tblTransactions').empty();
    var startIndex = (page - 1) * _itemsPerPage;
    var endIndex = startIndex + _itemsPerPage;

    _transactionHistory.history.slice(startIndex, endIndex).forEach(transaction => {
        var ufAmt = (transaction.amount / 1e30).toFixed(NANO_DECIMAL);
        var formattedAmt = Number(ufAmt).toLocaleString();
        var ufBalance = (transaction.balance / 1e30).toFixed(NANO_DECIMAL);
        //var formattedBalance = Number(ufBalance).toLocaleString();
        var readableDate = convert_timestamp_to_date(transaction.local_timestamp);
        var acctLink = '<a href="' + ACCOUNT_LINK + transaction.account + '">' + transaction.account + '</a>';
        var transType = '';
        if (transaction.type == 'send') {
            transType = '<b style="color:#e04576">' + transaction.type + '</b>'
        } else if (transaction.type == 'receive') {
            transType = '<b style="color:rgb(22, 199, 132)">' + transaction.type + '</b>'
        } else {
            transType = '<b style="color:blue">' + transaction.type + '</b>'
        }
        var transactionRow = '<tr><td><a href="https://blocklattice.io/block/' + transaction.hash + '" target="_blank">' + readableDate + '</a></td><td>' + transType + '</td><td>' + acctLink + '</td><td>' + '\u04FE' + formattedAmt + '</td></tr>';
        //<td>' + '\u04FE' + formattedBalance + '</td>
        $('#tblTransactions').append(transactionRow);
    });
}

function updatePagination() {
    var totalPages = Math.ceil(_transactionHistory.history.length / _itemsPerPage);

    var paginationHTML = '';
    if (_currentPage > 1) {
        paginationHTML += `<span onclick="changePage(${_currentPage - 1})"><</span>`;
    }  
    for (var i = 1; i <= totalPages; i++) {
        if (i == _currentPage) {
            paginationHTML += `<p style="font-weight:bold">${i}</p>`;
        } else {
            paginationHTML += `<span onclick="changePage(${i})">${i}</span>`;
        }
        
    }
    if (_currentPage < totalPages) {
        paginationHTML += `<span onclick="changePage(${_currentPage + 1})">></span>`;
    }
    
    $('#pagination').html(paginationHTML);
}

function changePage(page) {
    _currentPage = page;
    updateTable(_currentPage);
    updatePagination();
}

function set_qr(address) {
    const $link = $('#addressQR a').empty()
    $link.empty()
        .attr({
            href: 'nano:' + address,
            'aria-label': 'Open address in wallet'   // link name
        });
    $link.qrcode({
        render: 'image',
        text: address,
        ecLevel: 'L',
        size: '140'
    });
    
    $link.find('img')
        .attr({
            width: 140,
            height: 140,
            alt: 'QR code of Nano address'
        })
        .css('display', 'block');   // avoid inline gap

}

/*
   Init
   */
$(function () {
    get_query_string();

    /* restore last currency or fallback to USD */
    const startCurrency = get_saved_currency();
    sync_currency_selects(startCurrency);

    get_price_data(startCurrency);

    $('#autoRefreshChk').on('change', function () {
        if (this.checked) {
            autoTimer = setInterval(() => {
                get_price_data($('#currency').val());
            }, 60000);               // every 60 s (or 300 000 for 5 min)
        } else {
            clearInterval(autoTimer);
        }
    });
    
});