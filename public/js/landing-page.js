var selectedNetworks = document.querySelectorAll(".SelectedNetwork");
var ercAbi = wnatAbi;
var flrAbi = flareAbi;
var ftsoRewardAbiLocal = ftsoRewardAbi;

var IP = "api.flare.network";
var PORT = 443;
var PROTOCOL = "https";
var NETWORK_ID

var flrRank = document.getElementById('flr-rank');
var flrAvailability = document.getElementById('flr-availability');
var flrFee = document.getElementById('flr-fee');
var sgbRank = document.getElementById('sgb-rank');
var sgbAvailability = document.getElementById('sgb-availability');
var sgbFee = document.getElementById('sgb-fee');
// var valDelegators = document.getElementById('val-delegators');
// var valAvailability = document.getElementById('val-availability');
// var valFee = document.getElementById('val-fee');

var isFlr = true
var words = document.querySelectorAll(".glitch-text")
var word
var INITIAL_WORDS = []
var interv = 'undefined'
var canChange = false
var globalCount = 0
var count = 0
var isGoing = false

function round(num) {
    return +(Math.round(num + "e+2") + "e-2");
}

function roundDec(num) {
    return +(Math.round(num + "e+4") + "e-4");
}

// Getting the key of a function by its name.
function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

// Is value a number?
function isNumber(value) {
    if (void 0 === value || null === value) {
        return false;
    }
    if (typeof value == "number") {
        return true;
    }
    return !isNaN(value - 0);
}

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomLetter() {
 var alphabet = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
 return alphabet[rand(0,alphabet.length - 1)]
}
function getRandomWord(word) {
  var text = word.innerHTML
  
  var finalWord = ''
  for(var i=0;i<text.length;i++) {
    finalWord += text[i] == ' ' ? ' ' : getRandomLetter()
  }
 
  return finalWord
}

for (var f = 0; f < words.length; f++) {
    INITIAL_WORDS[f] = words[f].innerHTML
}


words.forEach((element, index) => {
    var INITIAL_WORD = INITIAL_WORDS[index]

    element.addEventListener('mouseenter', () => {
        if(isGoing) return;
        
        isGoing = true
        var randomWord = getRandomWord(element)
        element.innerHTML = randomWord

        interv = setInterval(function() {
            var finalWord = ''
            for(var x=0;x<INITIAL_WORD.length;x++) {
            if(x <= count && canChange) {
                finalWord += INITIAL_WORD[x]
            } else {
                finalWord += getRandomLetter()
            }
            }
            element.innerHTML = finalWord
            if(canChange) {
                count++
            }
            if(globalCount >= 20) {
            canChange = true
            }
            if(count>=INITIAL_WORD.length) {
            clearInterval(interv)
            count = 0
            canChange = false
            globalCount = 0
            isGoing = false
            }
            globalCount++
        },50)
    });
});

console.log(selectedNetworks);

selectedNetworks.forEach(async (element) => {
    console.log(element);
    var flrAddr = element?.getAttribute('data-registrycontract');
    var rpcUrl = element?.getAttribute('data-rpcurl');
    var ftsoCanAddr = element?.getAttribute('data-ftsocanaddr');
    var web32 = new Web3(rpcUrl);
    var flareContract = new web32.eth.Contract(flrAbi, flrAddr);
    try {
        const SmartContracts = await flareContract.methods.getAllContracts().call();
        const ftsoRewardIndex = getKeyByValue(Object.values(SmartContracts)[0], "FtsoRewardManager");
        const ftsoRewardAddr = SmartContracts[1][ftsoRewardIndex];

        let ftsoRewardContract = new web32.eth.Contract(ftsoRewardAbiLocal, ftsoRewardAddr)

        const currentEpoch = await ftsoRewardContract.methods.getCurrentRewardEpoch().call();

        const currentFee = await ftsoRewardContract.methods.getDataProviderCurrentFeePercentage(ftsoCanAddr).call();

        const currentFeePercent = Number(currentFee) / 100

        const currentPerformance = await ftsoRewardContract.methods.getDataProviderPerformanceInfo(currentEpoch, ftsoCanAddr).call();

        var totalSupply

        var VotePowerPercent

        const date = new Date();
        const minTimestamp = parseInt((date.setHours(date.getHours() - 6) / 1000).toFixed(0));

        var FLRAvailability = 0

        var SGBAvailability = 0

        var allFLRFtsoCanTransactionsCall

        var allSGBFtsoCanTransactionsCall

        var date1

        var date2

        // const pChainAddr = 'KzPd2Vx5WomGtur91B9K9R7to3mYyYga'
        //
        // const pChainAddrBytes32 = web32.utils.padLeft(web32.utils.utf8ToHex(pChainAddr), 32);
        //
        // console.log(pChainAddrBytes32)

        if (isFlr === true) {
            isFlr = false

            // NETWORK_ID = 14
            //
            // var avalanche = new Avalanche(IP, PORT, PROTOCOL, NETWORK_ID);
            //
            // const validators = avalanche.PChain().getCurrentValidators();
            //
            // console.log(validators);

            totalSupply = 1927121.63636

            VotePowerPercent = Number(round(web32.utils.fromWei(currentPerformance[1], "ether"))) / totalSupply / 100

            FLRAvailability = roundDec(Number(web32.utils.fromWei(currentPerformance[0], "ether")) / Number(web32.utils.fromWei(currentPerformance[1], "ether")) * (100 - currentFeePercent))
            //
            // allFLRFtsoCanTransactionsCall = await fetch('https://flare-explorer.flare.network/api' +
            //     '?module=account' +
            //     '&action=txlist' +
            //     `&address=${ftsoCanAddr}` +
            //     '&startblock=0' +
            //     '&endblock=99999999' +
            //     '&page=1' +
            //     '&offset=360' +
            //     '&sort=desc' +
            //     '&apikey=QJWFNP8NGBWDXTV6YT23JFYYGUYM3ZG34T');
            //
            // const allFLRFtsoCanTransactions = await allFLRFtsoCanTransactionsCall.json();
            //
            // console.log(allFLRFtsoCanTransactions.result);
            //
            // allFLRFtsoCanTransactions.result.forEach((element) => {
            //     date1 = new Date(Number(element.timestamp) * 1000);
            //
            //     date2 = new Date(minTimestamp * 1000);
            //
            //     if (date1 > date2) {
            //         if (Number(element.isError) === 0) {
            //             FLRAvailability++;
            //         }
            //     } else {
            //         return false;
            //     }
            //     return true;
            // })

            flrRank.innerText = String(round(VotePowerPercent));
            flrAvailability.innerText = String(FLRAvailability);
            flrFee.innerText = String(currentFeePercent);
        } else {
            NETWORK_ID = 19

            // var avalanche = new Avalanche(IP, PORT, PROTOCOL, NETWORK_ID);
            //
            // const validators = avalanche.PChain().getCurrentValidators();
            //
            // console.log(validators);

            totalSupply = 796774.248237

            VotePowerPercent = Number(round(web32.utils.fromWei(currentPerformance[1], "ether"))) / totalSupply / 100

            SGBAvailability = roundDec(Number(web32.utils.fromWei(currentPerformance[0], "ether")) / Number(web32.utils.fromWei(currentPerformance[1], "ether")) * (100 - currentFeePercent))

            // allSGBFtsoCanTransactionsCall = await fetch('https://songbird-explorer.flare.network/api' +
            //     '?module=account' +
            //     '&action=txlist' +
            //     `&address=${ftsoCanAddr}` +
            //     '&startblock=0' +
            //     '&endblock=99999999' +
            //     '&page=1' +
            //     '&offset=360' +
            //     '&sort=desc' +
            //     '&apikey=QJWFNP8NGBWDXTV6YT23JFYYGUYM3ZG34T');
            //
            // const allSGBFtsoCanTransactions = await allSGBFtsoCanTransactionsCall.json();
            //
            // console.log(allSGBFtsoCanTransactions.result);
            //
            // allSGBFtsoCanTransactions.result.every((element) => {
            //     date1 = new Date(Number(element.timestamp) * 1000);
            //
            //     date2 = new Date(minTimestamp * 1000);
            //
            //     if (date1 > date2) {
            //         if (Number(element.isError) === 0) {
            //             SGBAvailability++;
            //         }
            //     } else {
            //         return false;
            //     }
            //     return true;
            // })

            sgbRank.innerText = String(round(VotePowerPercent));
            sgbAvailability.innerText = String(SGBAvailability);
            sgbFee.innerText = String(currentFeePercent);
        }
    } catch (error) {
        console.log(error)
    }
});