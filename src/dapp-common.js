// Copyright 2024, Andrew Caya <andrewscaya@yahoo.ca>
// Copyright 2024, Jean-Thomas Caya

import {GetContract, MMSDK, showAccountAddress, showBalance, showTokenBalance, FlareAbis, FlareLogos } from "./flare-utils";
import { ethers } from './ethers.js';

// ALL MODULES.

var DappObject = {
    costonLogo: FlareLogos.costonLogo,
    flrLogo: FlareLogos.flrLogo,
    sgbLogo: FlareLogos.sgbLogo,
    ercAbi: FlareAbis.WNat,
    voterWhitelisterAbi: FlareAbis.VoterWhitelister,
    distributionAbiLocal: FlareAbis.DistributionToDelegators,
    ftsoRewardAbiLocal: FlareAbis.FtsoRewardManager,
    rewardManagerAbiLocal: FlareAbis.RewardManager,
    wrapBool: true,
    claimBool: false,
    fdClaimBool: false,
    hasV1Rewards: false,
    hasV2Rewards: false,
    isRealValue: false,
    isAmount2Active: false,
    metamaskInstalled: false,
}

const provider = window.ethereum;

async function getAccount(operation) {
    var accountAddr = document.getElementById("Accounts").getAttribute('data-address');

    if (operation === 'GET' || operation === 'POST') {
        if (accountAddr.trim().length === 0 || accountAddr.trim() === null) {
            const accounts = await provider.request({method: 'eth_accounts'});
            const account = accounts[0].trim();

            document.getElementById("Accounts").setAttribute('data-address', account);

            return account;
        } else {
            return accountAddr;
        }
    } else if (operation === 'SET') {
        const accounts = await provider.request({method: 'eth_accounts'});
        const account = accounts[0].trim();

        document.getElementById("Accounts").setAttribute('data-address', account);

        return account;
    }
}

async function showSpinner(doSomething) {
    $.confirm({
        escapeKey: false,
        backgroundDismiss: false,
        icon: 'fa fa-spinner fa-spin',
        title: 'Loading...',
        content: 'We are processing your transaction. <br />Please wait...',
        theme: 'material',
        type: 'dark',
        typeAnimated: true,
        draggable: false,
        buttons: {
            ok: {
                isHidden: true, // hide the button
            },
        },
        onContentReady: async function () {
            await doSomething();
            this.close();
        }
    });
}

async function showConfirmationSpinner(txHash, web32) {
    var spinner =
    $.confirm({
        escapeKey: false,
        backgroundDismiss: false,
        icon: 'fa fa-spinner fa-spin',
        title: 'Loading...',
        content: 'Waiting for network confirmation. <br />Please wait...',
        theme: 'material',
        type: 'orange',
        typeAnimated: true,
        draggable: false,
        buttons: {
            ok: {
                isHidden: true, // hide the button
            },
        },
        onContentReady: async function () {
            await checkTx(txHash, web32, this);
        }
    });
}

async function showConfirmationSpinnerv2(doSomething) {
    var spinner =
    $.confirm({
        escapeKey: false,
        backgroundDismiss: false,
        icon: 'fa fa-spinner fa-spin',
        title: 'Loading...',
        content: '<div id="v1Tx"><div id="v1TxIcon" class="fa fa-spinner fa-spin"></div> Old rewards claim status: <div id="v1TxStatus">Please check your Wallet...</div></div><br />' + '<div id="v2Tx"><div id="v2TxIcon" class="fa fa-spinner fa-spin"></div> New rewards claim status: <div id="v2TxStatus">Waiting for Old reward status...</div></div>',
        theme: 'material',
        type: 'orange',
        typeAnimated: true,
        draggable: false,
        buttons: {
            ok: {
                isHidden: true, // hide the button
            },
        },
        onContentReady: async function () {
            await doSomething(this);
        }
    });
}

async function showConfirm(txHash) {
    $.confirm({
        escapeKey: true,
        backgroundDismiss: true,
        icon: 'fa fa-solid fa-check green',
        title: 'Transaction confirmed!',
        content: 'Transaction hash: <br />',
        type: 'green',
        theme: 'material',
        typeAnimated: true,
        draggable: false,
        buttons: {
            ok: {
                action: function () {
                    document.getElementById("ConnectWallet").click();
                },
            }
        },
        onContentReady: async function () {
            this.setContentAppend(txHash);
            this.showLoading(true);
            this.hideLoading(true);
        }
    });
}

function showFail() {
    $.confirm({
        escapeKey: true,
        backgroundDismiss: true,
        icon: 'fa fa-warning red',
        title: 'Transaction declined!',
        content: '',
        type: 'red',
        theme: 'material',
        typeAnimated: true,
        draggable: false,
        buttons: {
            ok: {
                action: function () {
                    document.getElementById("ConnectWallet").click();
                },
            },
        },
        onContentReady: function () {
            this.showLoading(true);
            this.hideLoading(true);
        }
    });
}

async function handleAccountsChanged(accounts, pageIndex = 1) {
    if (pageIndex === 1 || pageIndex === '1') {
        if (accounts.length !== 0) {
            document.getElementById("ConnectWallet").click();
        } else {
            document.getElementById("ConnectWalletText").innerText = 'Connect Wallet';
            showBalance(0);
            showTokenBalance(0);
    
            await window.ethereum.request({
                "method": "wallet_revokePermissions",
                "params": [
                  {
                    "eth_accounts": {}
                  }
                ]
              });
        }
    } else if (pageIndex === 3 || pageIndex === '3') {
        if (accounts.length !== 0) {
            document.getElementById("ConnectWallet").click();
        } else {
            document.getElementById("ConnectWalletText").innerText = 'Connect Wallet';
            showTokenBalance(0);
            showConnectedAccountAddress('0x0');
    
            await window.ethereum.request({
                "method": "wallet_revokePermissions",
                "params": [
                  {
                    "eth_accounts": {}
                  }
                ]
              });
        }
    }
}

async function handleChainChanged() {
    try {
        var chainIdHexPromise = await provider.request({method: 'eth_chainId'}).then(async function(chainIdHex) {
            var realChainId;

            var changeEvent = new Event("change");

            var selectedNetwork = document.getElementById("SelectedNetwork");

            realChainId = selectedNetwork.options[0].getAttribute('data-chainidhex');

            for (var i = 0; i < selectedNetwork?.options.length; i++) {
                if (selectedNetwork?.options[i].getAttribute('data-chainidhex') === String(chainIdHex)) {
                    selectedNetwork.options[i].setAttribute('selected', 'selected');
                    selectedNetwork.options.selectedIndex = i;
                    realChainId = chainIdHex;
                    selectedNetwork.dispatchEvent(changeEvent);
                } else {
                    selectedNetwork.options[i].removeAttribute('selected');
                }
            }

            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [
                    {
                    "chainId": realChainId
                    }
                ]
                }).catch((error) => console.error(error));
        });

        document.getElementById("ConnectWallet").click();
    } catch (error) {
        // console.log(error);
    }
}

function downloadMetamask() {
    $.confirm({
        escapeKey: true,
        backgroundDismiss: false,
        icon: 'fa fa-warning red',
        title: '<br>Metamask is not installed!',
        content: 'Would you like to install Metamask in your browser?',
        type: 'red',
        theme: 'material',
        typeAnimated: true,
        draggable: false,
        buttons: {
            yes: {
                btnClass: 'btn-red',
                keys: ['enter'],
                action: function () {
                    var url = 'https://metamask.io/download/';

                    window.open(url, '_blank').focus();
                },
            },
            no: {}
        }
    });
}

// Simple math function.
function round(num) {
    return +(Math.round(num + "e+4") + "e-4");
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

async function getChainIdHex() {
    return await provider.request({method: 'eth_chainId'});
}

async function isConnected() {
    const accounts = await provider.request({method: 'eth_accounts'});

    if (accounts.length) {
        // console.log(`You're connected to: ${accounts[0]}`);
        return true;
    } else {
        // console.log("Metamask is not connected");
        return false;
    }
}

function checkConnection() {
    if (!navigator.onLine) {
        $.alert('Your Internet connection is unstable! Please make sure you can access the Internet.');
    }
}

function updateCall() {
    setInterval(function() {
        checkConnection();
    }, 20000);
}

function checkTx(hash, web32, spinner, isv2 = false) {
    return new Promise((resolve) => {
        var i = 0;
        
        // Set interval to regularly check if we can get a receipt
        let interval = setInterval(() => {
            i += 1;
            
            web32.eth.getTransactionReceipt(hash).then((receipt) => {
                // If we've got a receipt, check status and log / change text accordingly
                if (receipt) {
                    if (typeof spinner !== "undefined") {
                        spinner.close();
                    }
                    
                    if (Number(receipt.status) === 1) {

                        if (isv2 === false) {
                            showConfirm(receipt.transactionHash);
                        }

                        resolve("Success");

                        document.getElementById("ConnectWallet").click();

                    } else if (Number(receipt.status) === 0) {

                        if (typeof spinner !== "undefined") {
                            spinner.close();
                        }

                        if (isv2 === false) {
                            showFail();
                        }
                        resolve("Fail");
                        document.getElementById("ConnectWallet").click();
                    }

                    // Clear interval
                    clearInterval(interval);
                }
            });
            
            if (i === 20) {
                if (typeof spinner !== "undefined") {
                    spinner.close();
                }

                if (isv2 === false) {
                    showFail();
                }

                resolve("Unknown");

                document.getElementById("ConnectWallet").click();
                
                // Clear interval
                clearInterval(interval);
            }
        }, 6000)
    });
}

async function getSelectedNetwork(rpcUrl, chainidhex, networkValue, tokenIdentifier, wrappedTokenIdentifier, flrAddr) {
    return new Promise((resolve) => {
        setTimeout(() => {
            var selectedNetwork = document.getElementById("SelectedNetwork");
            rpcUrl = selectedNetwork?.options[selectedNetwork.selectedIndex].getAttribute('data-rpcurl');
            chainidhex = selectedNetwork?.options[selectedNetwork.selectedIndex].getAttribute('data-chainidhex');
            networkValue = selectedNetwork?.options[selectedNetwork.selectedIndex].value;
            flrAddr = selectedNetwork?.options[selectedNetwork.selectedIndex].getAttribute('data-registrycontract');
            tokenIdentifier = selectedNetwork?.options[selectedNetwork.selectedIndex].innerHTML;
            wrappedTokenIdentifier = "W" + tokenIdentifier;

            var object = {}

            object.selectedNetwork = selectedNetwork;
            object.rpcUrl = rpcUrl;
            object.chainIdHex = chainidhex;
            object.networkValue = networkValue;
            object.tokenIdentifier = tokenIdentifier;
            object.wrappedTokenIdentifier = wrappedTokenIdentifier;
            object.flrAddr = flrAddr

            resolve(object);
        }, 200);
    })
}

async function createSelectedNetwork(DappObject) {
    return new Promise((resolve) => {
        setTimeout(async () => {
            var networkSelectBox = document.getElementById('SelectedNetwork');

            for (const property in dappNetworks) {
                var option = document.createElement("option");
                option.value = dappNetworks[property].id;
                option.text = dappNetworks[property].chainidentifier;
                option.setAttribute('data-chainidhex', '0x' + dappNetworks[property].chainid.toString(16));
                option.setAttribute('data-rpcurl', dappNetworks[property].rpcurl);
                option.setAttribute('data-registrycontract', dappNetworks[property].registrycontract);

                networkSelectBox.appendChild(option);
            }

            networkSelectBox.options[0].setAttribute('selected', 'selected');
            networkSelectBox.options.selectedIndex = 0;
            
            await provider.request({method: 'eth_requestAccounts'}).then(async function () {
                if (!provider) {
                    DappObject.metamaskInstalled = false;
                    downloadMetamask();
                } else {
                    DappObject.metamaskInstalled = true;
                    isConnected()
                        .then(async function () {
                            var chainIdHexPromise = await provider.request({method: 'eth_chainId'}).then(async function(chainIdHex) {
                                var realChainId;

                                realChainId = networkSelectBox.options[0].getAttribute('data-chainidhex');

                                for (var i = 0; i < networkSelectBox.options.length; i++) {
                                    if (networkSelectBox.options[i].getAttribute('data-chainidhex') === chainIdHex) {
                                        networkSelectBox.options[i].setAttribute('selected', 'selected');
                                        networkSelectBox.options.selectedIndex = i;
                                        realChainId = chainIdHex;
                                    } else {
                                        networkSelectBox.options[i].removeAttribute('selected');
                                    }
                                }
            
                                if (DappObject.metamaskInstalled === true) {
                                    try {
                                        await window.ethereum.request({
                                            method: "wallet_switchEthereumChain",
                                            params: [
                                                {
                                                "chainId": realChainId
                                                }
                                            ]
                                            }).catch((error) => console.error(error));
                                    } catch (error) {
                                        // console.log(error);

                                        if (error.code === 4902) {
                                            try {
                                                await ethereum.request({
                                                    method: 'wallet_addEthereumChain',
                                                    params: [
                                                        {
                                                            "chainId": realChainId,
                                                            "rpcUrls": [networkSelectBox.options[networkSelectBox.selectedIndex].getAttribute('data-rpcurl')],
                                                            "chainName": `${networkSelectBox.options[networkSelectBox.selectedIndex].innerText} Mainnet`,
                                                            "iconUrls": [
                                                                `https://portal.flare.network/token-logos/${networkSelectBox.options[networkSelectBox.selectedIndex].innerText}.svg`
                                                            ],
                                                            "nativeCurrency": {
                                                                "name": `${networkSelectBox.options[networkSelectBox.selectedIndex].innerText}`,
                                                                "symbol": `${networkSelectBox.options[networkSelectBox.selectedIndex].innerText}`,
                                                                "decimals": 18
                                                            }
                                                        },
                                                    ],
                                                });
                                            } catch (error) {
                                                throw(error);
                                            }
                                        }
                                    }
                                }
                                resolve();
                            });        
                        });
                }
            })
        }, 200);
    })
}

async function isWalletConnected(ProviderObject) {
    if (ProviderObject instanceof MetaMaskSDK.MetaMaskSDK) {
        const accounts = await ProviderObject.request({method: 'eth_accounts'});

        if (accounts.length) {
            // console.log(`You're connected to: ${accounts[0]}`);
            return true;
        } else {
            // console.log("Metamask is not connected");
            return false;
        }
    }
}

// Show the current token identifiers.
function showTokenIdentifiers(token, wrappedToken) {
    if (typeof token !== 'undefined' && token !== null) {
        document.getElementById("tokenIdentifier").innerText = token;
    }

    document.getElementById("wrappedTokenIdentifier").innerText = wrappedToken;
}

async function getDelegatedProviders(account, web32, rpcUrl, flrAddr, DappObject) {
    var delegatedFtsoElement = document.getElementById('delegate-wrapbox');

    const wrappedTokenAddr = await GetContract("WNat", rpcUrl, flrAddr);
    let tokenContract = new web32.eth.Contract(DappObject.ercAbi, wrappedTokenAddr);
    let voterWhitelistAddr = await GetContract("VoterWhitelister", rpcUrl, flrAddr);
    let voterWhitelistContract = new web32.eth.Contract(DappObject.voterWhitelisterAbi, voterWhitelistAddr);

    // Getting which FTSO(s) the user has delegated to, the percentage of WNat he has
    // delegated,and the logo of said FTSO(s).
    const ftsoList = await voterWhitelistContract.methods.getFtsoWhitelistedPriceProviders(0).call();
    const ftsoJsonList = JSON.stringify(ftsoList);
    const delegatesOfUser = await tokenContract.methods.delegatesOf(account).call();
    const delegatedFtsos = delegatesOfUser[0];
    const BipsJson = delegatesOfUser[1];
    let Bips = [];

    if (typeof BipsJson[0] !== 'undefined' && BipsJson[0] != 0) {
        Bips = BipsJson[0] / 100n;
    } else {
        Bips = 0;
    }

    let insert1 = '';
    let insert2 = '';

    // Origin: https://raw.githubusercontent.com/TowoLabs/ftso-signal-providers/next/bifrost-wallet.providerlist.json
    fetch(dappUrlBaseAddr + 'bifrost-wallet.providerlist.json')
        .then(res => res.json())
        .then(FtsoInfo => {
                FtsoInfo.providers.sort((a, b) => a.name > b.name ? 1 : -1);

                var indexNumber;

                for (var f = 0; f < FtsoInfo.providers.length; f++) {
                    indexNumber = f;

                    for (var i = 0; i < delegatedFtsos.length; i++) {
                        if (FtsoInfo.providers[f].address === delegatedFtsos[i]) {
                            if (ftsoJsonList.includes(delegatedFtsos[i])) {
                                if (FtsoInfo.providers[indexNumber].name === "FTSOCAN") {
                                    // Origin: https://raw.githubusercontent.com/TowoLabs/ftso-signal-providers/master/assets.
                                    insert1 = `<div class="wrap-box-ftso" data-addr="${delegatedFtsos[i]}">
                                                    <div class="row">
                                                        <div class="wrap-box-content">
                                                            <img src="${dappUrlBaseAddr}assets/${delegatedFtsos[i]}.png" alt="${FtsoInfo.providers[indexNumber].name}" class="delegated-icon" id="delegatedIcon"/>
                                                            <div class="ftso-identifier">
                                                                <span id="delegatedName">${FtsoInfo.providers[indexNumber].name}</span>
                                                            </div>
                                                            <div class="wrapper-ftso">
                                                                <span id="delegatedBips1">${Bips}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="row">
                                                        <div class="wrapper-claim">
                                                            <span>Provider:</span>
                                                            <span class="address-claim">${delegatedFtsos[i]}</span>
                                                        </div>
                                                    </div>
                                                </div>`;
                                } else {
                                    // Origin: https://raw.githubusercontent.com/TowoLabs/ftso-signal-providers/master/assets.
                                    insert2 += `<div class="wrap-box-ftso" data-addr="${delegatedFtsos[i]}">
                                                    <div class="row">
                                                        <div class="wrap-box-content">
                                                            <img src="${dappUrlBaseAddr}assets/${delegatedFtsos[i]}.png" alt="${FtsoInfo.providers[indexNumber].name}" class="delegated-icon" id="delegatedIcon"/>
                                                            <div class="ftso-identifier">
                                                                <span id="delegatedName">${FtsoInfo.providers[indexNumber].name}</span>
                                                            </div>
                                                            <div class="wrapper-ftso">
                                                                <span id="delegatedBips2">${Bips}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="row">
                                                        <div class="wrapper-claim">
                                                            <span>Provider:</span>
                                                            <span class="address-claim">${delegatedFtsos[i]}</span>
                                                        </div>
                                                    </div>
                                                </div>`;
                                }
                            } else {
                                $.alert('The FTSO you have delegated to is invalid!');
                            }
                        }
                    }
                }

                let delegatedFtsoElementChildren = delegatedFtsoElement.getElementsByClassName('wrap-box-ftso');

                while (delegatedFtsoElementChildren[0]) {
                    delegatedFtsoElementChildren[0].parentNode.removeChild(delegatedFtsoElementChildren[0]);
                }

                delegatedFtsoElement.insertAdjacentHTML('afterbegin', insert1 + insert2);

                isDelegateInput1(DappObject);
            }
        );
}

// WRAP MODULE

async function ConnectWalletClickWrap(rpcUrl, flrAddr, DappObject) {
    document.getElementById("ConnectWalletText").innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
    
    let web32 = new Web3(rpcUrl);

    try {
        const wrappedTokenAddr = await GetContract("WNat", rpcUrl, flrAddr);
        let tokenContract = new web32.eth.Contract(DappObject.ercAbi, wrappedTokenAddr);
        const accounts = await provider.request({method: 'eth_requestAccounts'});
        const account = accounts[0];
        showAccountAddress(account);
        const balance = await web32.eth.getBalance(account);
        const tokenBalance = await tokenContract.methods.balanceOf(account).call();

        DappObject.wrapBool = (document.getElementById("wrapUnwrap").value === 'true');

        if (DappObject.wrapBool === true) {
            showBalance(round(web32.utils.fromWei(balance, "ether")));
            showTokenBalance(round(web32.utils.fromWei(tokenBalance, "ether")));
        } else {
            showBalance(round(web32.utils.fromWei(tokenBalance, "ether")));
            showTokenBalance(round(web32.utils.fromWei(balance, "ether")));
        }
    } catch (error) {
        // console.log(error);
    }
}

async function toggleWrapButton(DappObject, tokenIdentifier, wrappedTokenIdentifier, rpcUrl, flrAddr) {
    // Switching wrap/unwrap.
    if (DappObject.wrapBool === true) {
        DappObject.wrapBool = false;
        document.getElementById("wrapUnwrap").value = "false";
        document.getElementById("FromIcon").style.color = "#000";
        document.getElementById("ToIcon").style.color = "#fd000f";
        document.getElementById("Wrap").style.color = "#383a3b";
        document.getElementById("Unwrap").style.color = "#fd000f";
        showTokenIdentifiers(wrappedTokenIdentifier, tokenIdentifier);
        setWrapButton(DappObject);
    } else {
        DappObject.wrapBool = true;
        document.getElementById("wrapUnwrap").value = "true";
        document.getElementById("FromIcon").style.color = "#fd000f";
        document.getElementById("ToIcon").style.color = "#000";
        document.getElementById("Wrap").style.color = "#fd000f";
        document.getElementById("Unwrap").style.color = "#383a3b";
        showTokenIdentifiers(tokenIdentifier, wrappedTokenIdentifier);
        setWrapButton(DappObject);
    }

    document.getElementById("ConnectWallet").click();
}

// Is there a valid input?
function setWrapButton(DappObject) {
    var wrapButton = document.getElementById("WrapButton");
    var wrapButtonText = document.getElementById("WrapButtonText");

    if (Number(document.getElementById("AmountFrom").value.replace(/[^0-9]/g, '')) < 1) {
        wrapButton.style.backgroundColor = "rgba(143, 143, 143, 0.8)";
        wrapButton.style.cursor = "auto";
        wrapButtonText.innerText = "Enter Amount";
        DappObject.isRealValue = false;
    } else {
        wrapButton.style.backgroundColor = "rgba(253, 0, 15, 0.8)";
        wrapButton.style.cursor = "pointer";
        DappObject.isRealValue = true;

        if (DappObject.wrapBool === true) {
            wrapButtonText.innerText = "Wrap";
        } else {
            wrapButtonText.innerText = "Unwrap";
        }
    }
}

// Copy the input.
function copyWrapInput() {
    let amountFrom = document.getElementById("AmountFrom");
    let amountTo = document.getElementById("AmountTo");
    let newValue = ''
    
    if (isNumber(amountFrom.value)) {
        newValue = amountFrom.value;
    }

    amountTo.value = newValue;
}

// DELEGATE MODULE

async function ConnectWalletClickDelegate(rpcUrl, flrAddr, DappObject, ftso1) {
    document.getElementById("ConnectWalletText").innerHTML = '<i class="fa fa-spinner fa-spin"></i>';

    let delegatedIcon1 = document.getElementById("delegatedIcon1");
    delegatedIcon1.src = dappUrlBaseAddr + 'img/FLR.svg';

    isDelegateInput1(DappObject);

    await populateFtsos(ftso1, rpcUrl, flrAddr);

    let web32 = new Web3(rpcUrl);

    try {
        const accounts = await provider.request({method: 'eth_requestAccounts'});
        const account = accounts[0];
        showAccountAddress(account);
        await getDelegatedProviders(account, web32, rpcUrl, flrAddr, DappObject);
    } catch (error) {
        // console.log(error);
    }
};

// Switch claim button to claimable.
function switchDelegateButtonColor(claimBool) {
    document.getElementById('ClaimButton').style.backgroundColor = "rgba(253, 0, 15, 0.8)";
    claimBool = true;
    document.getElementById('ClaimButton').style.cursor = "pointer";
}

function switchDelegateButtonColorBack(claimBool) {
    document.getElementById('ClaimButton').style.backgroundColor = "rgba(143, 143, 143, 0.8)";
    claimBool = false;
    document.getElementById('ClaimButton').style.cursor = "auto";
}

function getDelegatedBips() {
    let delegatedBips = 0;
    let delegatedBips1 = document.getElementById('delegatedBips1');
    let delegatedBips2 = document.getElementById('delegatedBips2');
    let delegatedBips1Value = 0;
    let delegatedBips2Value = 0;

    if (typeof delegatedBips1 !== 'undefined' && delegatedBips1 !== null) {
        delegatedBips1Value = Number(delegatedBips1?.innerText.replace(/[^0-9]/g, ''));

        delegatedBips = delegatedBips1Value;
    }

    if (typeof delegatedBips2 !== 'undefined' && delegatedBips2 !== null) {
        delegatedBips2Value = Number(delegatedBips2?.innerText.replace(/[^0-9]/g, ''));

        delegatedBips += delegatedBips2Value;
    }

    return delegatedBips;
}

function isDelegateInput1(DappObject) {
    let delegatedBips = getDelegatedBips();

    let claimButton = document.getElementById("ClaimButton");

    let wrapbox1 = document.getElementById('wrapbox-1');

    if (delegatedBips === 100) {
        if (typeof wrapbox1 !== 'undefined' && wrapbox1 !== null) {
            wrapbox1.style.display = "none";
            claimButton.style.backgroundColor = "rgba(253, 0, 15, 0.8)";
            claimButton.style.cursor = "pointer";
            DappObject.isRealValue = true;
            document.getElementById("ClaimButtonText").innerText = "Undelegate all";
        }
    } else {
        if (typeof wrapbox1 !== 'undefined' && wrapbox1 !== null) {
            wrapbox1.removeAttribute('style');
        }

        let amount1 = document.getElementById("Amount1");

        if (delegatedBips === 0 && (Number(amount1.value.replace(/[^0-9]/g, '')) === 50 || Number(amount1.value.replace(/[^0-9]/g, '')) === 100)) {
            claimButton.style.backgroundColor = "rgba(253, 0, 15, 0.8)";
            claimButton.style.cursor = "pointer";
            DappObject.isRealValue = true;
            document.getElementById("ClaimButtonText").innerText = "Delegate";
        } else if (delegatedBips === 50 && Number(amount1.value.replace(/[^0-9]/g, '')) === 50) {
            claimButton.style.backgroundColor = "rgba(253, 0, 15, 0.8)";
            claimButton.style.cursor = "pointer";
            DappObject.isRealValue = true;
            document.getElementById("ClaimButtonText").innerText = "Delegate";
        } else {
            claimButton.style.backgroundColor = "rgba(143, 143, 143, 0.8)";
            claimButton.style.cursor = "auto";
            document.getElementById("ClaimButtonText").innerText = "Enter Amount";
            DappObject.isRealValue = false;
        }
    }
}

// Populate select elements.
async function populateFtsos(ftso1, rpcUrl, flrAddr) {
    return new Promise((resolve) => {
        setTimeout(async () => {
            var insert = '<option value="" data-ftso="0" disabled selected hidden>Select FTSO</option>';
            var insert1 = '';
            var insert2 = '';
            let web32 = new Web3(rpcUrl);
            let selectedNetwork = document.getElementById('SelectedNetwork');
            let chainIdHex = selectedNetwork?.options[selectedNetwork.selectedIndex].getAttribute('data-chainidhex');

            try {
                const voterWhitelistAddr = await GetContract("VoterWhitelister", rpcUrl, flrAddr);
                let voterWhitelistContract = new web32.eth.Contract(DappObject.voterWhitelisterAbi, voterWhitelistAddr);

                const ftsoList = await voterWhitelistContract.methods.getFtsoWhitelistedPriceProviders("0").call();

                const ftsoJsonList = JSON.stringify(ftsoList);

                // Origin: https://raw.githubusercontent.com/TowoLabs/ftso-signal-providers/next/bifrost-wallet.providerlist.json
                fetch(dappUrlBaseAddr + 'bifrost-wallet.providerlist.json')
                    .then(res => res.json())
                    .then(FtsoInfo => {
                        FtsoInfo.providers.sort((a, b) => a.name > b.name ? 1 : -1);

                        let indexNumber;

                        for (var f = 0; f < FtsoInfo.providers.length; f++) {
                            if ((FtsoInfo.providers[f].chainId === parseInt(chainIdHex, 16)) && (FtsoInfo.providers[f].listed === true)) {
                                for (var i = 0; i < ftsoList.length; i++) {
                                    if (FtsoInfo.providers[f].address === ftsoList[i]) {
                                        indexNumber = f;

                                        //<img src="https://raw.githubusercontent.com/TowoLabs/ftso-signal-providers/master/assets/${delegatedFtsos[i]}.png" class="delegatedIcon" id="delegatedIcon"/>
                                        if (ftsoJsonList.includes(ftsoList[i])) {
                                            if (FtsoInfo.providers[indexNumber].name === "FTSOCAN") {
                                                // Origin: https://raw.githubusercontent.com/TowoLabs/ftso-signal-providers/master/assets.
                                                insert1 += `<option value="${i}" data-img="${dappUrlBaseAddr}assets/${ftsoList[i]}.png" data-addr="${ftsoList[i]}" data-ftso="1">${FtsoInfo.providers[indexNumber].name}</option>`;
                                            } else {
                                                // Origin: https://raw.githubusercontent.com/TowoLabs/ftso-signal-providers/master/assets.
                                                insert2 += `<option value="${i}" data-img="${dappUrlBaseAddr}assets/${ftsoList[i]}.png" data-addr="${ftsoList[i]}" data-ftso="1">${FtsoInfo.providers[indexNumber].name}</option>`;
                                            }
    
                                            ftso1.innerHTML = insert + insert1 + insert2;
                                        } else {
                                            $.alert('The FTSO you are delegated to is invalid!');
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    });
            } catch (error) {
                // console.log(error)
            }

            resolve();
        }, 200);
    })
}

// CLAIM MODULE

async function ConnectWalletClickClaim(rpcUrl, flrAddr, DappObject) {
    document.getElementById("ConnectWalletText").innerHTML = '<i class="fa fa-spinner fa-spin"></i>';

    var networkSelectBox = document.getElementById('SelectedNetwork');

    let web32 = new Web3(rpcUrl);

    try {
        const wrappedTokenAddr = await GetContract("WNat", rpcUrl, flrAddr);
        const DistributionDelegatorsAddr = await GetContract("DistributionToDelegators", rpcUrl, flrAddr);
        const ftsoRewardAddr = await GetContract("FtsoRewardManager", rpcUrl, flrAddr);
        const rewardManagerAddr = await GetContract("RewardManager", rpcUrl, flrAddr);
        let tokenContract = new web32.eth.Contract(DappObject.ercAbi, wrappedTokenAddr);
        let DistributionDelegatorsContract = new web32.eth.Contract(DappObject.distributionAbiLocal, DistributionDelegatorsAddr);
        let ftsoRewardContract = new web32.eth.Contract(DappObject.ftsoRewardAbiLocal, ftsoRewardAddr);
        let rewardManagerContract;
        console.log("rewardManagerAddr: ");
        console.log(rewardManagerAddr);
        if (rewardManagerAddr) {
            rewardManagerContract = new web32.eth.Contract(DappObject.rewardManagerAbiLocal, rewardManagerAddr);
        }
        const accounts = await provider.request({method: 'eth_requestAccounts'});
        const account = accounts[0];
        const tokenBalance = await tokenContract.methods.balanceOf(account).call();

        showAccountAddress(account);
        showTokenBalance(round(web32.utils.fromWei(tokenBalance, "ether")));
        showFdRewards(0);
        showClaimRewards(0);
        showConnectedAccountAddress(account);

        // Changing the color of Claim button.
        if (Number(document.getElementById('ClaimButtonText').innerText) >= 1) {
            switchClaimButtonColor();
            
            DappObject.claimBool = true;
        } else {
            switchClaimButtonColorBack();

            DappObject.claimBool = false;
        }

        if (Number(document.getElementById('ClaimFdButtonText').innerText) > 0) {
            switchClaimFdButtonColor();
            
            DappObject.fdClaimBool = true;
        } else {
            switchClaimFdButtonColorBack();

            DappObject.fdClaimBool = false;
        }

        remove(".wrap-box-ftso");

        await getDelegatedProviders(account, web32, rpcUrl, flrAddr, DappObject);

        // Getting the unclaimed Rewards and affecting the Claim button.
        const epochsUnclaimedv1 = await ftsoRewardContract.methods.getEpochsWithUnclaimedRewards(account).call();
        let unclaimedAmount = BigInt(0);
        let unclaimedAmountv2;
        let l;

        for (var k = 0; k < epochsUnclaimedv1.length; k++) {
            l = await ftsoRewardContract.methods.getStateOfRewards(account, epochsUnclaimedv1[k]).call();
            
            if (typeof l[1][0] === "bigint") {
                unclaimedAmount += l[1][0];
            } else {
                unclaimedAmount += BigInt(l[1][0]);
            }
        }

        if (unclaimedAmount > BigInt(0)) {
            DappObject.hasV1Rewards = true;
        }

        if (rewardManagerContract) {
            unclaimedAmountv2 = await rewardManagerContract.methods.getStateOfRewards(account).call();

            console.log("unclaimedAmountv2: ");
            console.log(unclaimedAmountv2);
            console.log("unclaimedAmount: ");
            console.log(unclaimedAmount);

            if (unclaimedAmountv2.length > 0) {
                DappObject.hasV2Rewards = true;

                for (var i = 0; i < unclaimedAmountv2.length; i++) {
                    unclaimedAmount += BigInt(unclaimedAmountv2[i][0].amount);
                }
            }
        }
        
        const convertedRewards = String(Number.parseFloat(web32.utils.fromWei(unclaimedAmount, "ether")).toFixed(2));
        
        // Changing the color of Claim button.
        showClaimRewards(convertedRewards);

        if (networkSelectBox.options[networkSelectBox.selectedIndex].innerText === "FLR") {
            let claimableAmountFd = BigInt(0);
            let month;
            const claimableMonths = await DistributionDelegatorsContract.methods.getClaimableMonths().call();

            for (const property in claimableMonths) {
                month = !property.includes("_") && typeof claimableMonths[property] !== 'undefined' ? claimableMonths[property] : null;

                if (month && typeof month !== 'undefined' && isNumber(Number(month))) {
                    let claimableAmountMonth = await DistributionDelegatorsContract.methods.getClaimableAmountOf(account, month).call();
                    
                    if (typeof claimableAmountMonth === "bigint") {
                        claimableAmountFd += claimableAmountMonth;
                    } else {
                        claimableAmountFd += BigInt(claimableAmountMonth);
                    }
                }
            }
            
            const convertedRewardsFd = String(Number.parseFloat(web32.utils.fromWei(claimableAmountFd, "ether")).toFixed(2));

            // Changing the color of FlareDrop Claim button.
            showFdRewards(convertedRewardsFd);

            if (Number(document.getElementById('ClaimFdButtonText').innerText) > 0) {
                switchClaimFdButtonColor();

                DappObject.fdClaimBool = true;
            } else {
                switchClaimFdButtonColorBack();

                DappObject.fdClaimBool = false;
            }
        }

        if (Number(document.getElementById('ClaimButtonText').innerText) > 0) {
            switchClaimButtonColor();

            DappObject.claimBool = true;
        } else {
            showClaimRewards(0);
            switchClaimButtonColorBack();

            DappObject.claimBool = false;
        }
    } catch (error) {
        console.error(error);
    }
}

function showConnectedAccountAddress(address) {
    document.getElementById('AccountAddress').innerText = address;
}

// Function to remove by id or class name.
const remove = (sel) => document.querySelectorAll(sel).forEach(el => el.remove());

// Switch claim button to claimable.
function switchClaimButtonColor() {
    document.getElementById('ClaimButton').style.backgroundColor = "rgba(253, 0, 15, 0.8)";
    document.getElementById('ClaimButton').style.cursor = "pointer";
}

function switchClaimButtonColorBack() {
    document.getElementById('ClaimButton').style.backgroundColor = "rgba(143, 143, 143, 0.8)";
    document.getElementById('ClaimButton').style.cursor = "auto";
}

function switchClaimFdButtonColor() {
    document.getElementById('ClaimFdButton').style.backgroundColor = "rgba(253, 0, 15, 0.8)";
    document.getElementById('ClaimFdButton').style.cursor = "pointer";
}

function switchClaimFdButtonColorBack() {
    document.getElementById('ClaimFdButton').style.backgroundColor = "rgba(143, 143, 143, 0.8)";
    document.getElementById('ClaimFdButton').style.cursor = "auto";
}

// Show current rewards.
function showClaimRewards(rewards) {
    document.getElementById('ClaimButtonText').innerText = rewards == 0 ? '0' : rewards;
}

// Show current rewards.
 function showFdRewards(rewards) {
    document.getElementById('ClaimFdButtonText').innerText = rewards == 0 ? '0' : rewards;
}

async function delegate(object, DappObject) {
    if (DappObject.isRealValue === false) {
        $.alert("Please enter valid value. (50% or 100%)");
    } else {
        let amount1 = document.getElementById("Amount1");
        let ftso1 = document.getElementById("ftso-1");

        let web32 = new Web3(object.rpcUrl);

        web32.setProvider(provider);

        const value1 = amount1.value;

        const percent1 = value1.replace(/[^0-9]/g, '');

        const bips1 = Number(percent1) * 100;

        var addr1 = ftso1?.options[ftso1.selectedIndex]?.getAttribute('data-addr');

        try {
            const wrappedTokenAddr = await GetContract("WNat", object.rpcUrl, object.flrAddr);
            let tokenContract = new web32.eth.Contract(DappObject.ercAbi, wrappedTokenAddr);
            const accounts = await provider.request({method: 'eth_requestAccounts'});
            const account = accounts[0];

            const transactionParameters2 = {
                from: account,
                to: wrappedTokenAddr,
                data: tokenContract.methods.delegate(addr1, bips1).encodeABI(),
            };

            showSpinner(async () => {
                await provider.request({
                    method: 'eth_sendTransaction',
                    params: [transactionParameters2],
                })
                .then(txHash => showConfirmationSpinner(txHash, web32))
                .catch((error) => showFail());
            });

            isDelegateInput1(DappObject);
        } catch (error) {
            console.log(error);
        }
    }
}

async function undelegate(object) {
    let web32 = new Web3(object.rpcUrl);

    web32.setProvider(provider);

    try {
        const wrappedTokenAddr = await GetContract("WNat", object.rpcUrl, object.flrAddr);
        let tokenContract = new web32.eth.Contract(DappObject.ercAbi, wrappedTokenAddr);
        const accounts = await provider.request({method: 'eth_requestAccounts'});
        const account = accounts[0];

        const transactionParameters = {
            from: account,
            to: wrappedTokenAddr,
            data: tokenContract.methods.undelegateAll().encodeABI(),
        };

        showSpinner(async () => {
            await provider.request({
                method: 'eth_sendTransaction',
                params: [transactionParameters],
            })
            .then(txHash => showConfirmationSpinner(txHash, web32))
            .catch((error) => showFail());
        });
    } catch(error) {

    }
}

async function showAlreadyDelegated(DelegatedFtsos, object) {    
    $.confirm({
        escapeKey: false,
        backgroundDismiss: false,
        icon: 'fa fa-solid fa-flag red',
        title: 'Already delegated!',
        content: 'You have already delegated to ',
        type: 'red',
        theme: 'material',
        typeAnimated: true,
        draggable: false,
        buttons: {
            undelegate: {
                btnClass: 'btn-red',
                action: function () {
                    undelegate(object);
                },
            },
            cancel: function () {
            }
        },
        onContentReady: function () {
            if (DelegatedFtsos.length > 1) {
                this.setContentAppend(DelegatedFtsos[0] + " and " + DelegatedFtsos[1] + ". <br />");
            } else {
                this.setContentAppend(DelegatedFtsos[0] + ". <br />");
            }
            this.setContentAppend("You MUST undelegate before you can delegate to another provider. <br />");
            this.showLoading(true);
            this.hideLoading(true);
        }
    });
}

// INIT

window.dappInit = async (option) => {
    if (!provider) {
        downloadMetamask();
    } else {
        await MMSDK.init();
        if (option === 1 || option === '1') {
            let selectedNetwork = document.getElementById("SelectedNetwork");
            let chainidhex;
            let rpcUrl;
            let networkValue;
            let tokenIdentifier;
            let wrappedTokenIdentifier;
            var wrapUnwrapButton = document.getElementById("wrapUnwrap");
            var fromIcon = document.getElementById("FromIcon");
            var toIcon = document.getElementById("ToIcon");
            document.getElementById("layer2").innerHTML = DappObject.flrLogo;
            document.getElementById("layer3").innerHTML = DappObject.flrLogo;

            await createSelectedNetwork(DappObject).then( async () => {
                getSelectedNetwork(rpcUrl, chainidhex, networkValue, tokenIdentifier, wrappedTokenIdentifier).then(async (object) => {

                    showTokenIdentifiers(object.tokenIdentifier, object.wrappedTokenIdentifier);

                    document.getElementById("ConnectWallet").addEventListener("click", async () => {
                        ConnectWalletClickWrap(object.rpcUrl, object.flrAddr, DappObject);
                    });
                
                    // We check if the input is valid, then copy it to the wrapped tokens section.
                    document.querySelector("#AmountFrom").addEventListener("input", function () {
                        setWrapButton(DappObject);
                        copyWrapInput();
                    });
                
                    document.getElementById("wrapUnwrap").addEventListener("click", async () => {
                        toggleWrapButton(DappObject, object.tokenIdentifier, object.wrappedTokenIdentifier, object.rpcUrl, object.flrAddr);
                    });
                
                    // If the input is valid, we wrap on click of "WrapButton".
                    document.getElementById("WrapButton").addEventListener("click", async () => {
                        if (DappObject.isRealValue === false) {
                            $.alert("Please enter a valid value");
                        } else {
                            var web32 = new Web3(object.rpcUrl);
                
                            try {
                                const wrappedTokenAddr = await GetContract("WNat", object.rpcUrl, object.flrAddr);
                                let tokenContract = new web32.eth.Contract(DappObject.ercAbi, wrappedTokenAddr);
                                const accounts = await provider.request({method: 'eth_accounts'});
                                const account = accounts[0];
                                let balance = await web32.eth.getBalance(account);
                                let tokenBalance = await tokenContract.methods.balanceOf(account).call();
                                var amountFrom = document.getElementById("AmountFrom");
                                var amountTo = document.getElementById("AmountTo");
                                const amountFromValue = parseFloat(amountFrom.value);

                                if (Number.isNaN(amountFromValue)) {
                                    $.alert("Invalid number of tokens!");
                                } else {
                                    const amountFromValueWei = web32.utils.toWei(amountFromValue, "ether");
                                    const amountFromValueWeiBN = BigInt(amountFromValueWei);
                                    const amountFromValueWeiHex = web32.utils.toHex(amountFromValueWeiBN);

                                    let txPayload = {};

                                    if (DappObject.wrapBool === true) {
                                        txPayload = {
                                            from: account,
                                            to: wrappedTokenAddr,
                                            data: tokenContract.methods.deposit(amountFromValueWeiHex).encodeABI(),
                                            value: amountFromValueWeiHex
                                        };
                                    } else {
                                        txPayload = {
                                            from: account,
                                            to: wrappedTokenAddr,
                                            data: tokenContract.methods.withdraw(amountFromValueWeiBN).encodeABI()
                                        };
                                    }

                                    const transactionParameters = txPayload;

                                    if (DappObject.wrapBool === true && amountFromValueWeiBN > balance) {
                                        $.alert("Insufficient balance!");
                                    } else if (DappObject.wrapBool === false && amountFromValueWeiBN > tokenBalance) {
                                        $.alert("Insufficient balance!");
                                    } else {
                                        if (typeof amountFrom !== 'undefined' && amountFrom != null && typeof amountTo !== 'undefined' && amountTo != null) {
                                            amountFrom.value = "";
                                            amountTo.value = "";
                                        }

                                        showSpinner(async () => {
                                            await provider.request({
                                                method: 'eth_sendTransaction',
                                                params: [transactionParameters],
                                            })
                                                .then(txHash => showConfirmationSpinner(txHash, web32))
                                                .catch((error) => showFail());
                                        });

                                        setWrapButton(DappObject);
                                    }
                                }
                            } catch (error) {
                                // console.log(error);
                                // showFail();
                            }
                        }
                    });

                    document.getElementById("ConnectWallet").click();

                    // When the Connect Wallet button is clicked, we connect the wallet, and if it
                    // has already been clicked, we copy the public address to the clipboard.
                    if (object.networkValue === '1') {
                        document.getElementById("layer2").innerHTML = DappObject.flrLogo;
                        document.getElementById("layer3").innerHTML = DappObject.flrLogo;
                    } else if (object.networkValue === '2') {
                        document.getElementById("layer2").innerHTML = DappObject.sgbLogo;
                        document.getElementById("layer3").innerHTML = DappObject.sgbLogo;
                    } else {
                        document.getElementById("layer2").innerHTML = DappObject.costonLogo;
                        document.getElementById("layer3").innerHTML = DappObject.costonLogo;
                    }

                    object.rpcUrl = selectedNetwork?.options[selectedNetwork.selectedIndex]?.getAttribute('data-rpcurl');
                    object.tokenIdentifier = selectedNetwork?.options[selectedNetwork.selectedIndex].innerHTML;
                    object.wrappedTokenIdentifier = "W" + object.tokenIdentifier;
                    showTokenIdentifiers(object.tokenIdentifier, object.wrappedTokenIdentifier);
                    setWrapButton(DappObject);

                    //When Selected Network Changes, alert Metamask
                    selectedNetwork.onchange = async () => {
                        object.rpcUrl = selectedNetwork?.options[selectedNetwork.selectedIndex].getAttribute('data-rpcurl');
                        object.chainIdHex = selectedNetwork?.options[selectedNetwork.selectedIndex].getAttribute('data-chainidhex');
                        object.networkValue = selectedNetwork?.options[selectedNetwork.selectedIndex].value;

                        if (object.networkValue === '1') {
                            document.getElementById("layer2").innerHTML = DappObject.flrLogo;
                            document.getElementById("layer3").innerHTML = DappObject.flrLogo;
                        } else if (object.networkValue === '2') {
                            document.getElementById("layer2").innerHTML = DappObject.sgbLogo;
                            document.getElementById("layer3").innerHTML = DappObject.sgbLogo;
                        } else {
                            document.getElementById("layer2").innerHTML = DappObject.costonLogo;
                            document.getElementById("layer3").innerHTML = DappObject.costonLogo;
                        }

                        object.tokenIdentifier = selectedNetwork?.options[selectedNetwork.selectedIndex].innerHTML;
                        object.wrappedTokenIdentifier = "W" + object.tokenIdentifier;
                        showTokenIdentifiers(object.tokenIdentifier, object.wrappedTokenIdentifier);
                        DappObject.wrapBool = false;
                        wrapUnwrapButton.value = "false";
                        fromIcon.style.color = "#fd000f";
                        toIcon.style.color = "#000";
                        document.getElementById("Wrap").style.color = "#fd000f";
                        document.getElementById("Unwrap").style.color = "#383a3b";
                        document.getElementById("wrapUnwrap").click();

                        // Alert Metamask to switch.
                        try {
                            await window.ethereum.request({
                                method: "wallet_switchEthereumChain",
                                params: [
                                    {
                                    "chainId": object.chainIdHex
                                    }
                                ]
                                }).catch((error) => console.error(error));

                            document.getElementById("ConnectWallet").click();
                        } catch (error) {
                            // console.log(error);
                        }
                        
                        setWrapButton(DappObject);
                    }

                    window.ethereum.on("accountsChanged", async (accounts) => {
                        handleAccountsChanged(accounts);
                    });

                    window.ethereum.on("chainChanged", async () => {
                        handleChainChanged();
                    });
                });
            });

            updateCall();
        } else if (option === 2 || option === '2') {
            let selectedNetwork = document.getElementById("SelectedNetwork");
            let rpcUrl;
            let chainidhex;
            let networkValue;
            let ftso1 = document.getElementById("ftso-1");

            await createSelectedNetwork(DappObject).then( async () => {
                getSelectedNetwork(rpcUrl, chainidhex, networkValue).then(async (object) => {

                    document.getElementById("ConnectWallet").addEventListener("click", async () => {
                        ConnectWalletClickDelegate(object.rpcUrl, object.flrAddr, DappObject, ftso1);
                    });
                
                    document.getElementById("Amount1").addEventListener('input', function () {
                        isDelegateInput1(DappObject);
                
                        var str = this.value;
                        var suffix = "%";
                
                        if (str.search(suffix) === -1) {
                            str += suffix;
                        }
                
                        var actualLength = str.length - suffix.length;
                
                        if (actualLength === 0) {
                            this.value = str.substring(0, actualLength);
                
                            this.setSelectionRange(actualLength, actualLength);
                        } else {
                            this.value = str.substring(0, actualLength) + suffix;
                
                            // Set cursor position.
                            this.setSelectionRange(actualLength, actualLength);
                        }
                    });
                
                    document.getElementById("ClaimButton").addEventListener("click", async () => {
                        let web32 = new Web3(object.rpcUrl);
                
                        try {
                            const wrappedTokenAddr = await GetContract("WNat", object.rpcUrl, object.flrAddr);
                            let tokenContract = new web32.eth.Contract(DappObject.ercAbi, wrappedTokenAddr);
                            const account = await getAccount('GET');
                
                            const delegatesOfUser = await tokenContract.methods.delegatesOf(account).call();
                            const delegatedFtsos = delegatesOfUser[0];
                
                            let ftsoNames = [];
                
                            fetch(dappUrlBaseAddr + 'bifrost-wallet.providerlist.json')
                            .then(res => res.json())
                            .then(FtsoInfo => {
                                FtsoInfo.providers.sort((a, b) => a.name > b.name ? 1 : -1);
                
                                var indexNumber;
                
                                for (var f = 0; f < FtsoInfo.providers.length; f++) {
                                    indexNumber = f;
                
                                    for (var i = 0; i < delegatedFtsos.length; i++) {
                                        if (FtsoInfo.providers[f].address === delegatedFtsos[i]) {
                                            if (typeof ftsoNames[0] !== "undefined" && ftsoNames[0] !== null) {
                                                ftsoNames[1] = FtsoInfo.providers[indexNumber].name;
                                            } else {
                                                ftsoNames[0] = FtsoInfo.providers[indexNumber].name;
                                            }
                                        }
                                    }
                                }

                                let delegatedBips = getDelegatedBips();
                
                                if (delegatedFtsos.length === 2 || delegatedBips === 100) {
                                    showAlreadyDelegated(ftsoNames, object);
                                } else {
                                    delegate(object, DappObject);
                                }
                            });
                        } catch(error) {
                            //console.log(error);
                        }
                    });

                    document.getElementById("ConnectWallet").click();

                    isDelegateInput1(DappObject);

                    ftso1.onchange = async () => {
                        let img = ftso1?.options[ftso1.selectedIndex]?.getAttribute('data-img');
                        let delegatedicon = document.getElementById("delegatedIcon1");
                        delegatedicon.src = img;
                        isDelegateInput1(DappObject);
                    }

                    selectedNetwork.onchange = async () => {
                        object.rpcUrl = selectedNetwork?.options[selectedNetwork.selectedIndex]?.getAttribute('data-rpcurl');
                        object.chainIdHex = selectedNetwork?.options[selectedNetwork.selectedIndex]?.getAttribute('data-chainidhex');
                        object.networkValue = selectedNetwork?.options[selectedNetwork.selectedIndex]?.value;

                        // Alert Metamask to switch.
                        try {
                            await window.ethereum.request({
                                method: "wallet_switchEthereumChain",
                                params: [
                                    {
                                    "chainId": object.chainIdHex
                                    }
                                ]
                            }).catch((error) => console.error(error));
                        } catch (error) {
                            // console.log(error);
                        }
                    };

                    window.ethereum.on("accountsChanged", async (accounts) => {
                        handleAccountsChanged(accounts);
                    });

                    window.ethereum.on("chainChanged", async () => {
                        handleChainChanged();
                    });
                });
            });
        } else if (option === 3 || option === '3') {
            let selectedNetwork = document.getElementById("SelectedNetwork");
            let chainidhex;
            let rpcUrl;
            let networkValue;
            let tokenIdentifier;
            let wrappedTokenIdentifier;
            document.getElementById('layer3').innerHTML = DappObject.flrLogo;

            await createSelectedNetwork(DappObject).then( async () => {
                getSelectedNetwork(rpcUrl, chainidhex, networkValue, tokenIdentifier, wrappedTokenIdentifier).then(async (object) => {

                    showTokenIdentifiers(null, object.wrappedTokenIdentifier);

                    document.getElementById("ConnectWallet").addEventListener("click", async () => {
                        ConnectWalletClickClaim(object.rpcUrl, object.flrAddr, DappObject);
                    });
                
                    document.getElementById("ClaimButton").addEventListener("click", async () => {
                        if (DappObject.claimBool === true) {
                            let web32 = new Web3(object.rpcUrl);
                            var checkBox = document.getElementById("RewardsCheck");
                
                            try {
                                const accounts = await provider.request({method: 'eth_requestAccounts'});
                                const account = accounts[0];
                                const wrappedTokenAddr = await GetContract("WNat", object.rpcUrl, object.flrAddr);
                                let tokenContract = new web32.eth.Contract(DappObject.ercAbi, wrappedTokenAddr);
                                const ftsoRewardAddr = await GetContract("FtsoRewardManager", object.rpcUrl, object.flrAddr);
                                let ftsoRewardContract = new web32.eth.Contract(DappObject.ftsoRewardAbiLocal, ftsoRewardAddr);
                                const rewardManagerAddr = await GetContract("RewardManager", object.rpcUrl, object.flrAddr);
                                let rewardManagerContract;
                                let unclaimedEpochsv2;

                                if (rewardManagerAddr) {
                                    rewardManagerContract = new web32.eth.Contract(DappObject.rewardManagerAbiLocal, rewardManagerAddr);

                                    unclaimedEpochsv2 = await rewardManagerContract.methods.getStateOfRewards(account).call();
                                }

                                const epochsUnclaimed = await ftsoRewardContract.methods.getEpochsWithUnclaimedRewards(account).call();
                                let txPayload = {};
                                let txPayloadV2 = {};

                                var bucketTotal = await web32.eth.getBalance(ftsoRewardAddr);

                                if ((Number(document.getElementById('ClaimButtonText').innerText) > 0) && (Number(document.getElementById('ClaimButtonText').innerText) < bucketTotal)) {
                                    if (checkBox.checked) {
                                        if (DappObject.hasV1Rewards === true) {
                                            txPayload = {
                                                from: account,
                                                to: ftsoRewardAddr,
                                                data: ftsoRewardContract.methods.claim(account, account, String(epochsUnclaimed[epochsUnclaimed.length - 1]), true).encodeABI(),
                                            };
                                        }

                                        if (DappObject.hasV2Rewards === true) {
                                            if (rewardManagerContract) {
                                                txPayloadV2 = {
                                                    from: account,
                                                    to: rewardManagerAddr,
                                                    data: rewardManagerContract.methods.claim(account, account, String(unclaimedEpochsv2.at(-1)[0].rewardEpochId), true, []).encodeABI(),
                                                };
                                            }
                                        }
                                    } else {
                                        if (DappObject.hasV1Rewards === true) {
                                            txPayload = {
                                                from: account,
                                                to: ftsoRewardAddr,
                                                data: ftsoRewardContract.methods.claim(account, account, String(epochsUnclaimed[epochsUnclaimed.length - 1]), false).encodeABI(),
                                            };
                                        }

                                        if (DappObject.hasV2Rewards === true) {
                                            if (rewardManagerContract) {
                                                txPayloadV2 = {
                                                    from: account,
                                                    to: rewardManagerAddr,
                                                    data: rewardManagerContract.methods.claim(account, account, String(unclaimedEpochsv2.at(-1)[0].rewardEpochId), false, []).encodeABI(),
                                                };
                                            }
                                        }
                                    }

                                    console.log(txPayloadV2);
                                    
                                    const transactionParameters = txPayload;

                                    let txHashes = [];

                                    if (DappObject.hasV1Rewards === true && DappObject.hasV2Rewards === true) {
                                        const transactionParametersV2 = txPayloadV2;

                                        showConfirmationSpinnerv2(async (v2Spinner) => {
                                            try {
                                                await provider.request({
                                                    method: 'eth_sendTransaction',
                                                    params: [transactionParameters],
                                                })
                                                .then(txHash => {
                                                    txHashes[0] = txHash;
                                                    checkTx(txHash, web32, undefined, true).then(result => {
                                                        return new Promise((resolve, reject) => {
                                                            switch (result) {
                                                                case "Success":
                                                                    v2Spinner.$content.find('#v1TxStatus').html('Confirmed');
                                                                    v2Spinner.$content.find('#v1TxIcon').removeClass();
                                                                    v2Spinner.$content.find('#v1TxIcon').addClass("fa fa-solid fa-check");
                                                                    v2Spinner.$content.find('#v2TxStatus').html('Please check your Wallet...');
                                                                    setTimeout(() => {
                                                                        resolve("Success");
                                                                    }, 1500);
                                                                    break
                                                                case "Fail":
                                                                    v2Spinner.$content.find('#v1TxStatus').html('Failed');
                                                                    v2Spinner.$content.find('#v1TxIcon').removeClass();
                                                                    v2Spinner.$content.find('#v1TxIcon').addClass("fa fa-warning");
                                                                    resolve("Failed");
                                                                    v2Spinner.close();
                                                                    showFail();
                                                                    break
                                                                case "Unknown":
                                                                    v2Spinner.$content.find('#v1TxStatus').html('Unknown');
                                                                    v2Spinner.$content.find('#v1TxIcon').removeClass();
                                                                    v2Spinner.$content.find('#v1TxIcon').addClass("fa fa-warning");
                                                                    v2Spinner.$content.find('#v2TxStatus').html('Please check your Wallet...');
                                                                    setTimeout(() => {
                                                                        resolve("Unknown");
                                                                    }, 1500);
                                                                    break
                                                            }
                                                        });
                                                    }).then(async value => {
                                                        if (value === "Success" || value === "Unknown") {
                                                            await provider.request({
                                                                method: 'eth_sendTransaction',
                                                                params: [transactionParametersV2],
                                                            }).then(txHashV2 => {
                                                                txHashes[1] = txHashV2;
                                                                checkTx(txHashV2, web32, undefined, true).then(receipt => {
                                                                    switch (receipt) {
                                                                        case "Success":
                                                                            v2Spinner.$content.find('#v2TxStatus').html('Confirmed');
                                                                            v2Spinner.$content.find('#v2TxIcon').removeClass();
                                                                            v2Spinner.$content.find('#v2TxIcon').addClass("fa fa-solid fa-check");
                                                                            v2Spinner.close();
                                                                            showConfirm(txHashes[0] + "<br/>" + txHashes[1]);
                                                                            break
                                                                        case "Fail":
                                                                            v2Spinner.$content.find('#v2TxStatus').html('Failed');
                                                                            v2Spinner.$content.find('#v2TxIcon').removeClass();
                                                                            v2Spinner.$content.find('#v2TxIcon').addClass("fa fa-warning");
                                                                            v2Spinner.close();
                                                                            showFail();
                                                                            break
                                                                        case "Unknown":
                                                                            v2Spinner.$content.find('#v2TxStatus').html('Unknown');
                                                                            v2Spinner.$content.find('#v2TxIcon').removeClass();
                                                                            v2Spinner.$content.find('#v2TxIcon').addClass("fa fa-warning");
                                                                            v2Spinner.close();
                                                                            showFail();
                                                                            break
                                                                    }
                                                                });
                                                            });
                                                        }
                                                    })
                                                });
                                            } catch (error) {
                                                showFail();
                                            }
                                        });
                                    } else if (DappObject.hasV1Rewards === true && DappObject.hasV2Rewards === false) {
                                        showSpinner(async () => {
                                            await provider.request({
                                                method: 'eth_sendTransaction',
                                                params: [transactionParameters],
                                            })
                                            .then(txHash => showConfirmationSpinner(txHash, web32))
                                            .catch((error) => showFail());
                                        });
                                    } else {
                                        const transactionParametersV2 = txPayloadV2;

                                        showSpinner(async () => {
                                            await provider.request({
                                                method: 'eth_sendTransaction',
                                                params: [transactionParametersV2],
                                            })
                                            .then(txHash => showConfirmationSpinner(txHash, web32))
                                            .catch((error) => showFail());
                                        });
                                    }

                                    DappObject.hasV1Rewards = false;

                                    DappObject.hasV2Rewards = false;

                                    const tokenBalance = await tokenContract.methods.balanceOf(account).call();
                                    
                                    showClaimRewards(0);
                                    switchClaimButtonColorBack(DappObject.claimBool);
                                    showTokenBalance(round(web32.utils.fromWei(tokenBalance, "ether")));
                                } else {
                                    $.alert("The Rewards Bucket is empty! Please try again later.")
                                }
                            } catch (error) {
                                console.log(error);
                            }
                        }
                    });
                
                    document.getElementById("ClaimFdButton").addEventListener("click", async () => {
                        if (DappObject.fdClaimBool === true) {
                            let web32 = new Web3(object.rpcUrl);
                            var checkBox = document.getElementById("RewardsCheck");
                
                            try {
                                const accounts = await provider.request({method: 'eth_requestAccounts'});
                                const account = accounts[0];
                                const wrappedTokenAddr = await GetContract("WNat", object.rpcUrl, object.flrAddr);
                                let tokenContract = new web32.eth.Contract(DappObject.ercAbi, wrappedTokenAddr);
                                const DistributionDelegatorsAddr = await GetContract("DistributionToDelegators", object.rpcUrl, object.flrAddr);
                                let DistributionDelegatorsContract = new web32.eth.Contract(DappObject.distributionAbiLocal, DistributionDelegatorsAddr);
                                let month;
                                let currentMonth = 0;
                                const claimableMonths = await DistributionDelegatorsContract.methods.getClaimableMonths().call();

                                for (const property in claimableMonths) {
                                    month = !property.includes("_") && typeof claimableMonths[property] !== 'undefined' ? claimableMonths[property] : null;

                                    if (month && typeof month !== 'undefined' && isNumber(Number(month))) {
                                        if (month > currentMonth) {
                                            currentMonth = month;
                                        }
                                    }
                                }
                                
                                let txPayload = {};
                                
                                if (Number(document.getElementById('ClaimFdButtonText').innerText) > 0) {
                                    if (checkBox.checked) {
                                        txPayload = {
                                            from: account,
                                            to: DistributionDelegatorsAddr,
                                            data: DistributionDelegatorsContract.methods.claim(account, account, currentMonth, true).encodeABI(),
                                        };
                                    } else {
                                        txPayload = {
                                            from: account,
                                            to: DistributionDelegatorsAddr,
                                            data: DistributionDelegatorsContract.methods.claim(account, account, currentMonth, false).encodeABI(),
                                        };
                                    }
                                    
                                    const transactionParameters = txPayload;
            
                                    showSpinner(async () => {
                                        await provider.request({
                                            method: 'eth_sendTransaction',
                                            params: [transactionParameters],
                                        })
                                        .then(txHash => showConfirmationSpinner(txHash, web32))
                                        .catch((error) => showFail());
                                    });
                                    
                                    const tokenBalance = await tokenContract.methods.balanceOf(account).call();
                                    
                                    showFdRewards(0);
                                    switchClaimFdButtonColorBack(DappObject.fdClaimBool);
                                    showTokenBalance(round(web32.utils.fromWei(tokenBalance, "ether")));
                                }
                            } catch (error) {
                                // console.log(error);
                            }
                        }
                    });

                    document.getElementById("ConnectWallet").click();

                    if (object.networkValue === '1') {
                        document.getElementById("layer3").innerHTML = DappObject.flrLogo;
                    } else if (object.networkValue === '2') {
                        document.getElementById("layer3").innerHTML = DappObject.sgbLogo;
                    } else {
                        document.getElementById("layer3").innerHTML = DappObject.costonLogo;
                    }

                    selectedNetwork.onchange = async () => {
                        object.rpcUrl = selectedNetwork?.options[selectedNetwork.selectedIndex]?.getAttribute('data-rpcurl');
                        object.chainIdHex = selectedNetwork?.options[selectedNetwork.selectedIndex]?.getAttribute('data-chainidhex');
                        object.networkValue = selectedNetwork?.options[selectedNetwork.selectedIndex]?.value;

                        if (object.networkValue === '1') {
                            document.getElementById("layer3").innerHTML = DappObject.flrLogo;
                        } else if (object.networkValue === '2') {
                            document.getElementById("layer3").innerHTML = DappObject.sgbLogo;
                        } else {
                            document.getElementById("layer3").innerHTML = DappObject.costonLogo;
                        }
                        
                        object.tokenIdentifier = selectedNetwork?.options[selectedNetwork.selectedIndex].innerHTML;
                        object.wrappedTokenIdentifier = "W" + object.tokenIdentifier;
                        showTokenIdentifiers(null, object.wrappedTokenIdentifier);

                        // Alert Metamask to switch.
                        try {
                            await window.ethereum.request({
                                method: "wallet_switchEthereumChain",
                                params: [
                                    {
                                    "chainId": object.chainIdHex
                                    }
                                ]
                            }).catch((error) => console.error(error));
                        } catch (error) {
                            // console.log(error);
                        }
                    };

                    window.ethereum.on("accountsChanged", async (accounts) => {
                        remove(".wrap-box-ftso");
                        handleAccountsChanged(accounts, 3);
                    });

                    window.ethereum.on("chainChanged", async () => {
                        handleChainChanged();
                    });
                });
            });
        }
    }
};
