// Copyright 2024, Andrew Caya <andrewscaya@yahoo.ca>
// Copyright 2024, Jean-Thomas Caya

import {GetContract, MMSDK, showAccountAddress, showBalance, showTokenBalance, FlareAbis, FlareLogos } from "./flare-utils";
import { ethers } from "./ethers.js";

// ALL MODULES.

window.DappObject = {
    // Network index (1 = flare, 2 = songbird, other = coston)
    selectedNetworkIndex: 1,
    // Handling VA popups
    latestPopupTimeoutId: undefined,
    // Handling Accounts
    isHandlingOperation: false,
    isAccountConnected: false,
    // Logos
    costonLogo: FlareLogos.costonLogo,
    flrLogo: FlareLogos.flrLogo,
    sgbLogo: FlareLogos.sgbLogo,
    // FLR ABis
    ercAbi: FlareAbis.WNat,
    voterWhitelisterAbi: FlareAbis.VoterWhitelister,
    distributionAbiLocal: FlareAbis.DistributionToDelegators,
    ftsoRewardAbiLocal: FlareAbis.FtsoRewardManager,
    rewardManagerAbiLocal: FlareAbis.RewardManager,
    addressBinderAbiLocal: FlareAbis.AddressBinder,
    validatorRewardAbiLocal: FlareAbis.ValidatorRewardManager,
    systemsManagerAbiLocal: FlareAbis.FlareSystemsManager,
    // Bools that determine whether or not we should let the user proceed
    wrapBool: true,
    claimBool: false,
    fdClaimBool: false,
    isRealValue: false,
    isAmount2Active: false,
    transferBool: true,
    hasV1Rewards: false,
	hasV2Rewards: false,
    hasFtsoRewards: false,
    metamaskInstalled: false,
    // Chosen Wallet (-1 = null, 0 = Metamask, 1 = Ledger, 2 = WalletConnect)
    walletIndex: -1,
    // Signature used for non-EVM transactions
    signatureStaking: "",
    // Injected Providers
    providerList: [],
    // Ledger Variables
    unPrefixedAddr: "",
    ledgerAddrArray: [],
    ledgerSelectedIndex: "",
    isAvax: true,
    // WalletConnect Variables
    walletConnectEVMProvider: undefined,
    // Staking Variables
    selectedAddress: "",
    selectedDateTime: "",
    StakeMaxDate: "",
    StakeMinDate: "",
}

let injectedProviderDropdown;

const walletConnectEVMParams = {
    projectId: '89353513e21086611c5118bd063aae5b',
    metadata: {
        name: 'FTSOCAN DApp',
        description: "The FTSOCAN DApp allows you to manage your $FLR and $SGB tokens in a secure, lightweight, and intuitive way. Wrap, delegate and claim your token rewards, using the DApp's fully responsive, and mobile-friendly interface.",
        url: 'https://ftsocan.com/dapp/index', // origin must match your domain & subdomain
        icons: ['https://avatars.githubusercontent.com/u/37784886']
    },
    showQrModal: true,
    qrModalOptions: {
        themeMode: "light",
        explorerRecommendedWalletIds: [
            // Bifrost Wallet
            "37a686ab6223cd42e2886ed6e5477fce100a4fb565dcd57ed4f81f7c12e93053",
            // Metamask
            "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
            // Web3AUTH
            "78aaedfb74f2f4737134f2aaa78871f15ff0a2828ecb0ddc5b068a1f57bb4213",
            // Ledger
            '19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927',
        ],
        explorerExcludedWalletIds: [
            // Ledger
            //'19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927'
        ],
        themeVariables: {
            '--wcm-z-index': 9998,
            '--wcm-font-family': "'Poppins', sans-serif",
            '--wcm-accent-color': "rgba(255, 49, 32, 0.8)",
            '--wcm-background-color': "rgba(255, 49, 32, 0.8)",
            '--wcm-overlay-background-color': "rgba(0, 0, 0, 0.5)",
        },
    },

    optionalChains: [14, 19],
    methods: ['eth_sign'],

    /*Optional - Add custom RPCs for each supported chain*/
    rpcMap: {
        14: 'https://sbi.flr.ftsocan.com',
        19: 'https://sbi.sgb.ftsocan.com'
    }
}

const ledgerAppList = [{
    id: 0,
    title: "Flare App"
},{
    id: 1,
    title: "Avalanche App"
}];

let injectedProvider = window.ethereum;

function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function unPrefix0x (input) {
    return input.startsWith("0x") ? input.slice(2) : input;
}

function decimalToInteger(dec, offset) {
    let ret = dec;
    if (ret.includes(".")) {
      const split = ret.split(".");
      ret = split[0] + split[1].slice(0, offset).padEnd(offset, "0");
    } else {
      ret = ret + "0".repeat(offset);
    }
    return ret;
}

async function showSpinner(doSomething) {
    $.confirm({
        escapeKey: false,
        backgroundDismiss: false,
        icon: 'fa fa-spinner fa-spin',
        title: 'Loading...',
        content: 'To continue, you must approve the transaction. <br />Please check your Wallet...',
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

async function showConfirmationSpinner(txHash, web32, object, DappObject, pageIndex) {
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
            await checkTx(txHash, web32, this, object, DappObject, pageIndex);
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
        content: '<div id="v1Tx"><div id="v1TxIcon" class="fa fa-spinner fa-spin"></div> V1 rewards claim status: <div id="v1TxStatus">Please check your Wallet...</div></div><br />' + '<div id="v2Tx"><div id="v2TxIcon" class="fa fa-spinner fa-spin"></div> V2 rewards claim status: <div id="v2TxStatus">Waiting for V1 reward status...</div></div>',
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

async function showConfirmationSpinnerTransfer(doSomething) {
    var spinner =
    $.confirm({
        escapeKey: false,
        backgroundDismiss: false,
        icon: 'fa fa-spinner fa-spin',
        title: 'Loading...',
        content: '<div id="ExportTx"><div id="ExportTxIcon" class="fa fa-spinner fa-spin"></div> Export Transaction status: <div id="ExportTxStatus">Please check your Wallet...</div></div><br />' + '<div id="ImportTx"><div id="ImportTxIcon" class="fa fa-spinner fa-spin"></div> Import Transaction status: <div id="ImportTxStatus">Waiting for Export status...</div></div>',
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

async function showConfirmationSpinnerStake(doSomething) {
    var spinner =
    $.confirm({
        escapeKey: false,
        backgroundDismiss: false,
        icon: 'fa fa-spinner fa-spin',
        title: 'Loading...',
        content: 'To continue, you must approve the transaction. <br />Please check your Wallet...',
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

async function showConfirm(txHash, object, DappObject, pageIndex) {
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
                    ConnectWalletClick(object.rpcUrl, object.flrAddr, DappObject, pageIndex, undefined, undefined, DappObject.selectedAddress, DappObject.ledgerSelectedIndex);
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

async function showConfirmStake(DappObject, stakingOption, txHashes) {
    $.confirm({
        escapeKey: true,
        backgroundDismiss: true,
        icon: 'fa fa-solid fa-check green',
        title: 'Transaction confirmed!',
        content: '',
        type: 'green',
        theme: 'material',
        typeAnimated: true,
        draggable: false,
        buttons: {
            ok: {
                action: function () {
                    RefreshStakingPage(DappObject, stakingOption);
                },
            }
        },
        onContentReady: async function () {
            for (let i = 0; i < txHashes.length; i++) {
                this.setContentAppend(txHashes[i] + "<br />");
            }

            this.showLoading(true);
            this.hideLoading(true);
        }
    });
}

function showFail(object, DappObject, pageIndex) {
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
                    ConnectWalletClick(object.rpcUrl, object.flrAddr, DappObject, pageIndex, undefined, undefined, DappObject.selectedAddress, DappObject.ledgerSelectedIndex);
                },
            },
        },
        onContentReady: function () {
            this.showLoading(true);
            this.hideLoading(true);
        }
    });
}

function showFailStake(DappObject, stakingOption) {
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
                    RefreshStakingPage(DappObject, stakingOption);
                },
            },
        },
        onContentReady: function () {
            this.showLoading(true);
            this.hideLoading(true);
        }
    });
}

async function showBindPAddress(contract, web32, address, publicKey, addressPchainEncoded, DappObject, stakingOption) {
    $.confirm({
        escapeKey: false,
        backgroundDismiss: false,
        icon: 'fa fa-warning',
        title: 'P-Address Invalid!',
        content: 'Your P-Chain address is not bound to your C-Chain address! <br /> If you do not bind them, you will not be able to stake. <br /> Do you wish to bind them?',
        type: 'orange',
        theme: 'material',
        typeAnimated: true,
        draggable: false,
        buttons: {
            yes: {
                action: async function () {
                    const transactionParameters = {
                        from: address,
                        to: contract.options.address,
                        data: contract.methods.registerAddresses(publicKey, addressPchainEncoded, address).encodeABI(),
                    };
        
                    if (DappObject.walletIndex === 1) {
                        await LedgerEVMSingleSign(transactionParameters, DappObject, stakingOption, true);
                    } else {
                        showSpinner(async () => {
                            await injectedProvider.request({
                                method: 'eth_sendTransaction',
                                params: [transactionParameters],
                            })
                            .then(txHash => showConfirmationSpinnerStake(async (spinner) => {
                                checkTxStake(txHash, web32, spinner, DappObject);
                            }))
                            .catch((error) => showFailStake(DappObject, stakingOption));
                        });
                    }
                    ;
                },
            },
            no: {
                action: function () {
                    this.close();
                },
            }
        },
        onContentReady: async function () {
            this.showLoading(true);
            this.hideLoading(true);
        }
    });
}

async function handleAccountsChanged(accounts, DappObject, pageIndex = 1, stakingOption, rpcUrl, flrAddr, autoRefresh) {
    DappObject.signatureStaking = "";

    if (pageIndex === 1 || pageIndex === '1') {
        if ((isNumber(accounts.length) && accounts.length > 0) || autoRefresh === true) {
            ConnectWalletClick(rpcUrl, flrAddr, DappObject, 0);
        } else {
            document.getElementById("ConnectWalletText").innerText = 'Connect Wallet';
            showBalance(0);
            showTokenBalance(0);

            setCurrentAppState("Null");
        }
    } else if (pageIndex === 2 || pageIndex === '2') {
        if ((isNumber(accounts.length) && accounts.length > 0) || autoRefresh === true) {
            ConnectWalletClick(rpcUrl, flrAddr, DappObject, 1);
        } else {
            document.getElementById("ConnectWalletText").innerText = 'Connect Wallet';
            document.getElementById("ClaimButton").style.backgroundColor = "rgba(143, 143, 143, 0.8)";
            document.getElementById("ClaimButton").style.cursor = "auto";
            document.getElementById("ClaimButtonText").innerText = "Enter Amount";
            DappObject.isRealValue = false;

            setCurrentAppState("Null");
        }
    } else if (pageIndex === 3 || pageIndex === '3') {
        remove(".wrap-box-ftso");

        if ((isNumber(accounts.length) && accounts.length > 0) || autoRefresh === true) {
            ConnectWalletClick(rpcUrl, flrAddr, DappObject, 2);
        } else {
            document.getElementById("ConnectWalletText").innerText = 'Connect Wallet';
            showTokenBalance(0);
            showConnectedAccountAddress('0x0');
            showFdRewards(0);
            switchClaimFdButtonColorBack();
            showClaimRewards(0);
            switchClaimButtonColorBack();

            setCurrentAppState("Null");
        }
    } else if (pageIndex === 4 && stakingOption !== 5) {
        if ((isNumber(accounts.length) && accounts.length > 0) || autoRefresh === true) {
            RefreshStakingPage(DappObject);
        } else {
            document.getElementById("ConnectWalletText").innerText = 'Connect Wallet';

            showBalance(0);
            showTokenBalance(0);

            setCurrentAppState("Null");
        }
    } else if (pageIndex === 4 && stakingOption === 5) {
        await setCurrentAppState("Connected");

        await setCurrentPopup("Connected!", false);

        document.getElementById("ContinueAnyway")?.classList.add("connect-wallet");

        document.getElementById("ContinueAnyway")?.classList.remove("claim-button");

        document.getElementById("ContinueAnyway")?.addEventListener("click", async () => {
            DappObject.walletIndex = 1;
            getDappPage(1);
        });

        DappObject.isHandlingOperation = false;
    }
}

async function handleChainChanged(DappObject) {
    try {
        if (DappObject.walletIndex === 0) {
            var chainIdHexPromise = await injectedProvider.request({method: 'eth_chainId'}).then(async function(chainIdHex) {
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
                if (DappObject.walletIndex === 0 && realChainId != chainIdHex) {
                    await injectedProvider.request({
                        method: "wallet_switchEthereumChain",
                        params: [
                            {
                            "chainId": realChainId
                            }
                        ]
                        }).catch((error) => console.error(error));
                }
            });
        } else if (DappObject.walletIndex === 2) {
            var chainIdHexPromise = await DappObject.walletConnectEVMProvider.request({method: 'eth_chainId'}).then(async function(chainIdHex) {
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
                if (DappObject.walletIndex === 2 && realChainId != chainIdHex) {
                    await DappObject.walletConnectEVMProvider.request({
                        method: "wallet_switchEthereumChain",
                        params: [
                            {
                            "chainId": realChainId
                            }
                        ]
                        }).catch((error) => console.error(error));
                }
            });
        }

        document.getElementById("ConnectWallet")?.click();
    } catch (error) {
        // console.log(error);
    }
}

async function handleChainChangedStake(DappObject) {
    if (DappObject.walletIndex === 0) {
        await injectedProvider.request({
            method: "wallet_switchEthereumChain",
            params: [
                {
                "chainId": "0xe"
                }
            ]
            }).catch((error) => console.error(error));
    } else if (DappObject.walletIndex === 2) {
        await DappObject.walletConnectEVMProvider.request({
            method: "wallet_switchEthereumChain",
            params: [
                {
                "chainId": "0xe"
                }
            ]
            }).catch((error) => console.error(error));
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

function checkConnection() {
    if (!navigator.onLine) {
        setCurrentAppState("Alert");

        setCurrentPopup('Your Internet connection is unstable! Please make sure you can access the Internet.', true);

        throw new Error("No Internet!");
    }
}

async function checkTx(hash, web32, spinner, object, DappObject, pageIndex, isV2 = false) {
    return new Promise((resolve) => {
        try {
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
                            if (isV2 === false) {
                                showConfirm(receipt.transactionHash, object, DappObject, pageIndex);
                            }
    
                            resolve("Success");
                        } else if (Number(receipt.status) === 0) {
                            if (isV2 === false) {
                                showFail(object, DappObject, pageIndex);
                            }
    
                            resolve("Fail");
                        }
    
                        // Clear interval
                        clearInterval(interval);
                    }
                });
                
                if (i === 20) {
                    throw new Error("Transaction Dropped.");
                }
            }, 6000)
        } catch (error) {
            if (typeof spinner !== "undefined") {
                spinner.close();
            }

            if (isV2 === false) {
                showFail(object, DappObject, pageIndex);
            }
            
            // Clear interval
            clearInterval(interval);
        }
    });
}

async function checkTxStake(hash, web32, spinner, DappObject) {
    try {
        var i = 0;
        
        // Set interval to regularly check if we can get a receipt
        let interval = setInterval(() => {
            i += 1;
            
            web32.eth.getTransactionReceipt(hash).then((receipt) => {
                // If we've got a receipt, check status and log / change text accordingly
                if (receipt) {
                    spinner.close();
                    
                    if (Number(receipt.status) === 1) {
                        showConfirmStake(DappObject, 3, [receipt.transactionHash]);
                    } else if (Number(receipt.status) === 0) {
                        showFailStake(DappObject, 3);
                    }

                    // Clear interval
                    clearInterval(interval);
                }
            });
            
            if (i === 20) {
                throw new Error("Transaction dropped.");
            }
        }, 6000)
    } catch (error) {
        spinner.close();

        showFailStake(DappObject, 3);
        
        // Clear interval
        clearInterval(interval);
    }
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

            networkSelectBox.options[DappObject.selectedNetworkIndex - 1].setAttribute('selected', 'selected');
            networkSelectBox.options.selectedIndex = DappObject.selectedNetworkIndex - 1;

            if (DappObject.walletIndex === 0) {    
                if (!injectedProvider) {
                    DappObject.metamaskInstalled = false;
                    downloadMetamask();
                } else {
                    DappObject.metamaskInstalled = true;
                    
                    var chainIdHexPromise = await injectedProvider.request({method: 'eth_chainId'}).then(async function(chainIdHex) {
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
                                if (DappObject.walletIndex === 0 && realChainId != chainIdHex) {
                                    await injectedProvider.request({
                                        method: "wallet_switchEthereumChain",
                                        params: [
                                            {
                                            "chainId": realChainId
                                            }
                                        ]
                                        }).catch((error) => {
                                            throw error
                                        });
                                }
                            } catch (error) {
                                // console.log(error);

                                if (error.code === 4902) {
                                    try {
                                        await injectedProvider.request({
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
                }
            } else if (DappObject.walletIndex === 1) {
                resolve();
            } else if (DappObject.walletIndex === 2) {
                if (DappObject.walletConnectEVMProvider === undefined) {
                    DappObject.walletConnectEVMProvider = await walletConnectProvider.init(walletConnectEVMParams);
                }

                if (!DappObject.walletConnectEVMProvider.session) {
                    try {
                        await DappObject.walletConnectEVMProvider.connect();

                        DappObject.isAccountConnected = true;
                    } catch (error) {
                        networkSelectBox.options[0].setAttribute('selected', 'selected');
                        networkSelectBox.options[1].removeAttribute('selected');
                        networkSelectBox.options.selectedIndex = 0;
                        resolve();
                    }
                }

                var chainIdHexPromise = await DappObject.walletConnectEVMProvider.request({method: 'eth_chainId'}).then(async function(chainIdHex) {
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

                    try {
                        await DappObject.walletConnectEVMProvider.request({
                            method: "wallet_switchEthereumChain",
                            params: [
                                {
                                "chainId": realChainId
                                }
                            ]
                            }).catch((error) => {
                                throw error
                            });
                    } catch (error) {
                        // console.log(error);

                        if (error.code === 4902) {
                            try {
                                await DappObject.walletConnectEVMProvider.request({
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

                    resolve();
                });
            }
        }, 200);
    })
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

    let bipsText = "";

    // Origin: https://raw.githubusercontent.com/TowoLabs/ftso-signal-providers/next/bifrost-wallet.providerlist.json
    fetch(dappUrlBaseAddr + 'bifrost-wallet.providerlist.json')
        .then(res => res.json())
        .then(async FtsoInfo => {
                FtsoInfo.providers.sort((a, b) => a.name > b.name ? 1 : -1);

                var indexNumber;

                for (var f = 0; f < FtsoInfo.providers.length; f++) {
                    indexNumber = f;

                    for (var i = 0; i < delegatedFtsos.length; i++) {
                        if (FtsoInfo.providers[f].address === delegatedFtsos[i]) {
                            if (ftsoJsonList.includes(delegatedFtsos[i])) {
                                bipsText = "delegatedBips" + String(i + 1);
                                // Origin: https://raw.githubusercontent.com/TowoLabs/ftso-signal-providers/master/assets.
                                insert1 += `<div class="wrap-box-ftso" data-addr="${delegatedFtsos[i]}">
                                                <div class="row">
                                                    <div class="wrap-box-content">
                                                        <img src="${dappUrlBaseAddr}assets/${delegatedFtsos[i]}.png" alt="${FtsoInfo.providers[indexNumber].name}" class="delegated-icon" id="delegatedIcon"/>
                                                        <div class="ftso-identifier">
                                                            <span id="delegatedName">${FtsoInfo.providers[indexNumber].name}</span>
                                                        </div>
                                                        <div class="wrapper-ftso">
                                                            <span id=${bipsText}>${Bips}%</span>
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
                                await setCurrentPopup('The FTSO that you have delegated to is invalid!', true);

                                document.getElementById("ClaimButton").style.backgroundColor = "rgba(253, 0, 15, 0.8)";
                                document.getElementById("ClaimButton").style.cursor = "pointer";
                                DappObject.isRealValue = true;
                                document.getElementById("ClaimButtonText").innerText = "Undelegate all";
                            }
                        }
                    }
                }

                let delegatedFtsoElementChildren = delegatedFtsoElement.getElementsByClassName('wrap-box-ftso');

                while (delegatedFtsoElementChildren[0]) {
                    delegatedFtsoElementChildren[0].parentNode.removeChild(delegatedFtsoElementChildren[0]);
                }

                delegatedFtsoElement.insertAdjacentHTML('afterbegin', insert1);

                if (dappOption === 2) {
                    isDelegateInput1(DappObject);
                }
            }
        );
}

async function getRewardEpochIdsWithClaimableRewards(flareSystemsManager, rewardManager, account) {
    try {
        const startRewardEpochId = await rewardManager.methods.getNextClaimableRewardEpochId(account).call();
        const epochIds = await rewardManager.methods.getRewardEpochIdsWithClaimableRewards().call();

        const endRewardEpochId = epochIds._endEpochId;

        if (endRewardEpochId < startRewardEpochId) {
            return null;
        }
        const claimableRewardEpochIds = [];

        for ( let epochId = startRewardEpochId; epochId <= endRewardEpochId; epochId++ ) {
            const rewardsHash = await flareSystemsManager.methods.rewardsHash(epochId).call();
            const rewardHashSigned = Boolean(rewardsHash) && rewardsHash !== "0x0000000000000000000000000000000000000000000000000000000000000000";
            if (rewardHashSigned) {
                // console.log(epochId + " is claimable!");
                claimableRewardEpochIds.push(Number(epochId));
            }
        }
        if (claimableRewardEpochIds.length === 0) {
            return null;
        }
        return claimableRewardEpochIds;
    } catch (error) {
        // console.log(error);
        return null;
    }
}

async function getRewardClaimWithProofStructs(network, address, amountWei, flareSystemsManager, rewardManager) {
    const claimableRewardEpochIds = await getRewardEpochIdsWithClaimableRewards(flareSystemsManager, rewardManager, address);

    if (!claimableRewardEpochIds?.length) {
      return;
    }

    let hasFtsoRewards = false;

    let rewardClaimWithProofStructs = [];

    for (const epochId of claimableRewardEpochIds) {
        const rewardClaimData = await getRewardClaimData(epochId, network, address);

        if (amountWei !== undefined && typeof amountWei === "bigint" && rewardClaimData) {
            hasFtsoRewards = true;

            amountWei += rewardClaimData.body.amount;
        }

        if (!rewardClaimData) {
            break;
        }

        rewardClaimWithProofStructs.push(rewardClaimData);
    }

    if (amountWei !== undefined) {
        return {
            amountWei,
            hasFtsoRewards
        };
    } else {
        return rewardClaimWithProofStructs;
    }
}

async function getRewardClaimData(rewardEpochId, network, account) {

    let merkleProof;
    let id;
    let address;
    let sum;
    let claimType;

    return fetch(`${fetchTupleConfig.url}/${network}/${rewardEpochId}/${fetchTupleConfig.jsonfile}`, { signal: AbortSignal.timeout(Number(fetchTupleConfig.timeout)) })
        .then((res) => {
            if (res.ok) {
                return res.json();
            }

            throw new Error('Something went wrong');
        })
        .then(async rewardsData => {
            if (!rewardsData) {
                return null;
            }
            const rewardClaims = rewardsData.rewardClaims.find(([_, [id, address, sum, claimType]]) => address.toLowerCase() === account.toLowerCase() && claimType === 1);
            if (!rewardClaims) {
                return null;
            }
            [merkleProof, [id, address, sum, claimType]] = rewardClaims;

            return {
                merkleProof, 
                body: {
                    rewardEpochId: BigInt(id),
                    beneficiary: address,
                    amount: BigInt(sum),
                    claimType: BigInt(claimType)
                }
            };
        }).catch((error) => {
            // console.log(error);
            return null;
        });
}

// WRAP MODULE

async function ConnectWalletClick(rpcUrl, flrAddr, DappObject, pageIndex, HandleClick, PassedPublicKey, PassedEthAddr, addressIndex) {
    DappObject.isHandlingOperation = true;

    clearTimeout(DappObject.latestPopupTimeoutId);

    checkConnection();

    await setCurrentAppState("Connecting");

    await setCurrentPopup("Connecting...", true);

    DappObject.isAccountConnected = false;

    if (typeof addressIndex === "undefined" || addressIndex === "") {
        document.getElementById("ConnectWalletText").innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
    }
    
    let web32 = new Web3(rpcUrl);

    try {
        let flrPublicKey;

        let account;

        let selectize;

        if (typeof addressIndex !== "undefined" && addressIndex !== "") {
            DappObject.ledgerSelectedIndex = addressIndex;
        }

        let requiredApp;

        if (DappObject.isAvax === true) {
            requiredApp = "Avalanche";
        } else {
            requiredApp = "Flare Network";
        }

        if (DappObject.walletIndex === 1 && (typeof addressIndex === "undefined" || addressIndex === "")) {
            await getLedgerApp(requiredApp).then(async result => {
                switch (result) {
                    case "Success":
                        await wait(3000);

                        if (!Array.isArray(DappObject.ledgerAddrArray) || !DappObject.ledgerAddrArray.length) {
                            let addresses;

                            // console.log("Fetching Addresses... ETH");

                            if (rpcUrl.includes("flr")) {
                                addresses = await getLedgerAddresses("flare", DappObject.isAvax);
                            } else if (rpcUrl.includes("sgb")) {
                                addresses = await getLedgerAddresses("songbird", DappObject.isAvax);
                            }

                            let insert = [];

                            for (let i = 0; i < addresses.length; i++) {
                                insert[i] = {
                                    id: i,
                                    title: addresses[i].ethAddress,
                                    pubkey: addresses[i].publicKey,
                                };
                            }

                            DappObject.ledgerAddrArray = insert;
                        }

                        // console.log(DappObject.ledgerAddrArray);

                        document.getElementById("ConnectWalletText").innerHTML = '<select id="select-account" class="connect-wallet-text" placeholder="Select Account"></select>'

                        var onInputChange = async (value) => {
                            let addressBox = document.querySelector("span.connect-wallet-text");
                            let ethaddr = addressBox.getAttribute('data-ethkey');
                            let pubKey = addressBox.getAttribute('data-pubkey');
                            
                            flrPublicKey = pubKey;

                            account = ethaddr;

                            DappObject.selectedAddress = account;

                            DappObject.ledgerSelectedIndex = value;

                            connectChainsAndKeys(flrPublicKey);

                            let unprefixed;

                            if (rpcUrl.includes("flr")) {
                                unprefixed = await publicKeyToBech32AddressString(flrPublicKey, "flare");
                            } else if (rpcUrl.includes("sgb")) {
                                unprefixed = await publicKeyToBech32AddressString(flrPublicKey, "songbird");
                            }

                            DappObject.unPrefixedAddr = unprefixed;

                            ConnectWalletClick(rpcUrl, flrAddr, DappObject, pageIndex, HandleClick, flrPublicKey, ethaddr, value);
                        }

                        var $select = $('#select-account').selectize({
                            maxItems: 1,
                            valueField: 'id',
                            labelField: 'title',
                            searchField: ["title"],
                            options: DappObject.ledgerAddrArray,
                            render: {
                                item: function (item, escape) {
                                    return (
                                    "<div>" +
                                    (item.title
                                        ? `<span class="title connect-wallet-text" data-pubkey=${item.pubkey} data-ethkey=${item.title}>` + escape(item.title) + "</span>"
                                        : "") +
                                    "</div>"
                                    );
                                },
                                option: function (item, escape) {
                                    var label = item.title;
                                    return (
                                    "<div>" +
                                    '<span class="connect-wallet-text">' +
                                    escape(label) +
                                    "</span>" +
                                    "</div>"
                                    );
                                },
                            },
                            onChange: function(value) {
                                onInputChange(value);
                            },
                            create: false,
                            dropdownParent: "body",
                        });

                        selectize = $select[0].selectize;

                        if (typeof HandleClick !== "undefined") {
                            document.getElementById("ConnectWallet").removeEventListener("click", HandleClick);
                        }

                        if (DappObject.ledgerSelectedIndex !== "") {
                            selectize.setValue([Number(DappObject.ledgerSelectedIndex)]);
                        } else {
                            await setCurrentPopup("Please select an account.", true);
                        }

                        let addressDropdown = document.querySelector(".selectize-input");
                        let publicKey = addressDropdown?.childNodes[0]?.childNodes[0]?.getAttribute('data-pubkey');
                            
                        flrPublicKey = publicKey;
                        break
                    case "Failed: App not Installed":
                        await setCurrentAppState("Alert");

                        clearTimeout(DappObject.latestPopupTimeoutId);

                        DappObject.latestPopupTimeoutId = setTimeout( async () => {
                            await setCurrentPopup("Whoops! Looks like you do not have the Avalanche App installed on your Ledger device! Please install it and come back again later!", true);
                        }, 1000);

                        throw new Error("Ledger Avalanche App not installed!");
                        break
                    case "Failed: User Rejected":
                        ConnectWalletClick(rpcUrl, flrAddr, DappObject, pageIndex, HandleClick);
                        break
                }
            });
        } else if (DappObject.walletIndex === 0 && (typeof PassedPublicKey === "undefined" || PassedPublicKey === "")) {
            const accounts = await injectedProvider.request({method: 'eth_requestAccounts'});
            
            account = accounts[0];

            await setCurrentAppState("Connected");

            closeCurrentPopup();

            // await setCurrentPopup("Connected to account: " + account.slice(0, 17));

            DappObject.isAccountConnected = true;

        } else if (DappObject.walletIndex === 2 && (typeof PassedPublicKey === "undefined" || PassedPublicKey === "")) {
            if (DappObject.walletConnectEVMProvider === undefined) {
                DappObject.walletConnectEVMProvider = await walletConnectProvider.init(walletConnectEVMParams);
            }

            if (!DappObject.walletConnectEVMProvider.session) {
                await DappObject.walletConnectEVMProvider.connect();
            }

            const accounts = await DappObject.walletConnectEVMProvider.request({method: 'eth_requestAccounts'});
            
            account = accounts[0];

            await setCurrentAppState("Connected");

            closeCurrentPopup();

            // await setCurrentPopup("Connected to account: " + account.slice(0, 17));

            DappObject.isAccountConnected = true;

        } else if (typeof addressIndex !== "undefined" && addressIndex !== "") {
            account = PassedEthAddr;
            if (typeof HandleClick !== "undefined") {
                document.getElementById("ConnectWallet").removeEventListener("click", HandleClick);
            }

            await setCurrentAppState("Connected");

            closeCurrentPopup();

            // await setCurrentPopup("Connected to account: " + account.slice(0, 17));

            DappObject.isAccountConnected = true;
        }

        if (DappObject.walletIndex === 1 && (typeof addressIndex == "undefined" || addressIndex === "")) {
            DappObject.isHandlingOperation = false;
        } else if ((DappObject.walletIndex === 1 && (typeof addressIndex !== "undefined" && addressIndex !== "")) || DappObject.walletIndex === 0 || DappObject.walletIndex === 2) {
            DappObject.selectedAddress = account;

            try {
                if (pageIndex === 0) {
                    const wrappedTokenAddr = await GetContract("WNat", rpcUrl, flrAddr);
                    let tokenContract = new web32.eth.Contract(DappObject.ercAbi, wrappedTokenAddr);
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

                    await setCurrentPopup("This is the 'Wrap' page, where you can convert your FLR or SGB into WFLR and WSGB respectively. This will allow you to delegate to an FTSO and earn passive income!", true);

                    clearTimeout(DappObject.latestPopupTimeoutId);

                    DappObject.latestPopupTimeoutId = setTimeout( async () => {
                        await setCurrentPopup("First, choose if you would like to Wrap, or Unwrap your tokens by clicking on the top left button. Then, input the amount of tokens you would like to transfer. Don't forget to keep some FLR or SGB for gas fees!", true);
                    }, 15000);
                } else if (pageIndex === 1) {
                    let delegatedIcon1 = document.getElementById("delegatedIcon1");
                    delegatedIcon1.src = dappUrlBaseAddr + 'img/FLR.svg';
    
                    await isDelegateInput1(DappObject);
    
                    await populateFtsos(rpcUrl, flrAddr);

                    await setCurrentPopup("This is the 'Delegate' page, where you can delegate a percentage of your WFLR or WSGB to an FTSO and earn passive income!", true);

                    clearTimeout(DappObject.latestPopupTimeoutId);

                    DappObject.latestPopupTimeoutId = setTimeout( async () => {
                        await setCurrentPopup("First, choose an FTSO from the dropdown list. Then, enter the percentage you would like to delegate to that FTSO, either 50% or 100%!", true);
                    }, 15000);
    
                    try {
                        showAccountAddress(account);
                        await getDelegatedProviders(account, web32, rpcUrl, flrAddr, DappObject);
                    } catch (error) {
                        throw error;
                    }
                } else if (pageIndex === 2) {
                    var networkSelectBox = document.getElementById('SelectedNetwork');
    
                    try {
                        const wrappedTokenAddr = await GetContract("WNat", rpcUrl, flrAddr);
                        const DistributionDelegatorsAddr = await GetContract("DistributionToDelegators", rpcUrl, flrAddr);
                        const ftsoRewardAddr = await GetContract("FtsoRewardManager", rpcUrl, flrAddr);
                        let rewardManagerAddr = await GetContract("RewardManager", rpcUrl, flrAddr);

                        // @TODO TO BE REMOVED - PATCH RewardManager address not updated in Registry Contract 2024-10-20.
                        if (rpcUrl.includes("sgb")) {
                            rewardManagerAddr = "0x8A80583BD5A5Cd8f68De585163259D61Ea8dc904"
                        }

                        const systemsManagerAddr = await GetContract("FlareSystemsManager", rpcUrl, flrAddr);
                        let tokenContract = new web32.eth.Contract(DappObject.ercAbi, wrappedTokenAddr);
                        let DistributionDelegatorsContract = new web32.eth.Contract(DappObject.distributionAbiLocal, DistributionDelegatorsAddr);
                        let ftsoRewardContract = new web32.eth.Contract(DappObject.ftsoRewardAbiLocal, ftsoRewardAddr);
                        let flareSystemsManagerContract = new web32.eth.Contract(DappObject.systemsManagerAbiLocal, systemsManagerAddr);

                        let rewardManagerContract;

                        if (rewardManagerAddr) {
                            rewardManagerContract = new web32.eth.Contract(DappObject.rewardManagerAbiLocal, rewardManagerAddr);
                        }

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
                        const epochsUnclaimed = await ftsoRewardContract.methods.getEpochsWithUnclaimedRewards(account).call();
                        let unclaimedAmount = BigInt(0);
                        let unclaimedAmountv2;
                        let l;
    
                        for (var k = 0; k < epochsUnclaimed.length; k++) {
                            l = await ftsoRewardContract.methods.getStateOfRewards(account, epochsUnclaimed[k]).call();
                            
                            if (typeof l[1][0] === "bigint") {
                                unclaimedAmount += l[1][0];
                            } else {
                                unclaimedAmount += BigInt(l[1][0]);
                            }
                        }

                        if (unclaimedAmount > BigInt(0)) {
                            DappObject.hasV1Rewards = true;
                        } else {
                            DappObject.hasV1Rewards = false;
                        }

                        if (rewardManagerContract) {
                            unclaimedAmountv2 = await rewardManagerContract.methods.getStateOfRewards(account).call();
                
                            // console.log("unclaimedAmountv2: ");
                            // console.log(unclaimedAmountv2);
                            // console.log("unclaimedAmount: ");
                            // console.log(unclaimedAmount);
                
                            if (unclaimedAmountv2.length > 0) {
                                DappObject.hasV2Rewards = true;
                
                                for (var i = 0; i < unclaimedAmountv2.length; i++) {
                                    if (unclaimedAmountv2[i][0] !== undefined) {
                                        unclaimedAmount += BigInt(unclaimedAmountv2[i][0].amount);
                                    }
                                }
                            } else {
                                DappObject.hasV2Rewards = false;
                            }

                            let network;

                            if (rpcUrl.includes("flr")) {
                                network = "flare";
                            } else if (rpcUrl.includes("sgb")) {
                                network = "songbird";
                            }

                            const ftsoRewardInfo = await getRewardClaimWithProofStructs(network, account, unclaimedAmount, flareSystemsManagerContract, rewardManagerContract);

                            if (ftsoRewardInfo !== undefined && ftsoRewardInfo?.hasFtsoRewards === true) {
                                unclaimedAmount += ftsoRewardInfo.amountWei;

                                DappObject.hasFtsoRewards = true;
                            } else {
                                DappObject.hasFtsoRewards = false;
                            }
                        } else {
                            DappObject.hasV2Rewards = false;

                            DappObject.hasFtsoRewards = false;
                        }
                        
                        const convertedRewards = web32.utils.fromWei(unclaimedAmount, "ether").split('.');
                        
                        // Changing the color of Claim button.
                        showClaimRewards(convertedRewards[0] + "." + convertedRewards[1].slice(0, 2));
    
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
                            
                            const convertedRewardsFd = web32.utils.fromWei(claimableAmountFd, "ether").split('.');
    
                            // Changing the color of FlareDrop Claim button.
                            showFdRewards(convertedRewardsFd[0] + "." + convertedRewardsFd[1].slice(0, 2));
    
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

                        await setCurrentPopup("This is the 'Rewards' page, where you can claim your FLR or SGB tokens that you have earned by delegating to an FTSO!", true);

                        clearTimeout(DappObject.latestPopupTimeoutId);

                        DappObject.latestPopupTimeoutId = setTimeout( async () => {
                            await setCurrentPopup("If you have any rewards, one of the bottom buttons will become red and contain the amount of rewards you have earned. You only need to click it to begin the claiming process!", true);
                        }, 15000);
                    } catch (error) {
                        throw error;
                    }
                }

                DappObject.isHandlingOperation = false;
            } catch (error) {
                throw error
            }
        }
    } catch (error) {
        // console.log(error);

        document.getElementById("ConnectWalletText").innerText = "Connect Wallet";

        await resetDappObjectState(DappObject);

        var ClickHandler;

        if (HandleClick) {
            document.getElementById("ConnectWallet").removeEventListener("click", HandleClick);
        }

        document.getElementById("ConnectWallet")?.addEventListener("click", ClickHandler = async () => {
            ConnectWalletClick(rpcUrl, flrAddr, DappObject, pageIndex, ClickHandler);
        });
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

    ConnectWalletClick(rpcUrl, flrAddr, DappObject, 0, undefined, undefined, DappObject.selectedAddress, DappObject.ledgerSelectedIndex);
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

async function isDelegateInput1(DappObject) {
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

        await setCurrentPopup("It looks like you have already delegated 100% of your tokens! If you want to delegate to another FTSO, you will need to undelegate first!", true);
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
async function populateFtsos(rpcUrl, flrAddr) {
    return new Promise(async (resolve) => {
            var insert = [];
            let web32 = new Web3(rpcUrl);
            let selectedNetwork = document.getElementById('SelectedNetwork');
            let chainIdHex = selectedNetwork?.options[selectedNetwork.selectedIndex].getAttribute('data-chainidhex');

            try {
                const voterWhitelistAddr = await GetContract("VoterWhitelister", rpcUrl, flrAddr);
                let voterWhitelistContract = new web32.eth.Contract(DappObject.voterWhitelisterAbi, voterWhitelistAddr);

                const ftsoList = await voterWhitelistContract.methods.getFtsoWhitelistedPriceProviders("0").call();

                const ftsoJsonList = JSON.stringify(ftsoList);

                var onInputChange = async (value) => {
                    let ftso1 = document.querySelector(".selectize-input");
                    let img = ftso1.childNodes[0].childNodes[0].getAttribute('data-img');
                    let delegatedicon = document.getElementById("delegatedIcon1");
                    delegatedicon.src = img;
                    await isDelegateInput1(DappObject);
                }


                var $select = $('#select-ftso').selectize({
                    maxItems: 1,
                    valueField: 'id',
                    labelField: 'title',
                    searchField: ["title", "nodeid"],
                    render: {
                        item: function (item, escape) {
                            return (
                            "<div>" +
                            (item.title
                                ? `<span class="title" data-img=${item.img} data-addr=${item.nodeid}>` + escape(item.title) + "</span>"
                                : "") +
                            "</div>"
                            );
                        },
                        option: function (item, escape) {
                            var label = item.title || item.nodeid;
                            var caption = item.title ? item.nodeid : null;
                            return (
                            "<div>" +
                            '<span class="ftso-name">' +
                            escape(label) +
                            "</span>" +
                            (caption
                                ? '<span class="ftso-address">' + escape(caption) + "</span>"
                                : "") +
                            "</div>"
                            );
                        },
                    },
                    onChange: function(value) {
                        onInputChange(value);
                    },
                    create: false,
                    dropdownParent: "body",
                });

                // Origin: https://raw.githubusercontent.com/TowoLabs/ftso-signal-providers/next/bifrost-wallet.providerlist.json
                fetch(dappUrlBaseAddr + 'bifrost-wallet.providerlist.json')
                    .then(res => res.json())
                    .then(async FtsoInfo => {
                        FtsoInfo.providers.sort((a, b) => a.name > b.name ? 1 : -1);

                        let indexNumber;

                        let g = 1;

                        for (var f = 0; f < FtsoInfo.providers.length; f++) {
                            if ((FtsoInfo.providers[f].chainId === parseInt(chainIdHex, 16)) && (FtsoInfo.providers[f].listed === true)) {
                                for (var i = 0; i < ftsoList.length; i++) {
                                    if (FtsoInfo.providers[f].address === ftsoList[i]) {
                                        indexNumber = f;

                                        //<img src="https://raw.githubusercontent.com/TowoLabs/ftso-signal-providers/master/assets/${delegatedFtsos[i]}.png" class="delegatedIcon" id="delegatedIcon"/>
                                        if (ftsoJsonList.includes(ftsoList[i])) {
                                            if (FtsoInfo.providers[indexNumber].name === "FTSOCAN") {
                                                // Origin: https://raw.githubusercontent.com/TowoLabs/ftso-signal-providers/master/assets.
                                                insert[0] = {
                                                    id: 0,
                                                    title: FtsoInfo.providers[indexNumber].name,
                                                    nodeid: ftsoList[i],
                                                    img: dappUrlBaseAddr + "assets/" + ftsoList[i] + ".png"
                                                }; 
                                            } else {
                                                // Origin: https://raw.githubusercontent.com/TowoLabs/ftso-signal-providers/master/assets.
                                                insert[g] = {
                                                    id: g,
                                                    title: FtsoInfo.providers[indexNumber].name,
                                                    nodeid: ftsoList[i],
                                                    img: dappUrlBaseAddr + "assets/" + ftsoList[i] + ".png"
                                                }; 

                                                g += 1;
                                            }
                                        } else {
                                            await setCurrentPopup('The FTSO that you have delegated to is invalid!', true);
                                            break;
                                        }
                                    }
                                }
                            }
                        }

                    var control = $select[0].selectize;

                    control.clearOptions();

                    for (var z = 0; z < insert.length; z++) {
                        control.addOption({
                            id: insert[z].id,
                            title: insert[z].title,
                            nodeid: insert[z].nodeid,
                            img: insert[z].img
                        });
                    }
                });
            } catch (error) {
                // console.log(error)
            }

            resolve();
    })
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
        await setCurrentPopup('You need to enter a valid value, either 50% or 100%.', true);
    } else {
        let amount1 = document.getElementById("Amount1");
        let ftso1 = document.querySelector(".selectize-input");

        let web32 = new Web3(object.rpcUrl);

        const value1 = amount1.value;

        const percent1 = value1.replace(/[^0-9]/g, '');

        const bips1 = Number(percent1) * 100;

        var addr1 = ftso1.childNodes[0].childNodes[0].getAttribute('data-addr');

        try {
            const wrappedTokenAddr = await GetContract("WNat", object.rpcUrl, object.flrAddr);
            let tokenContract = new web32.eth.Contract(DappObject.ercAbi, wrappedTokenAddr);
            const account = DappObject.selectedAddress;

            const transactionParameters2 = {
                from: account,
                to: wrappedTokenAddr,
                data: tokenContract.methods.delegate(addr1, bips1).encodeABI(),
            };

            if (DappObject.walletIndex === 1) {
                await LedgerEVMSingleSign(transactionParameters2, DappObject, undefined, false, object, 1);
            } else if (DappObject.walletIndex === 0) {
                showSpinner(async () => {
                    await injectedProvider.request({
                        method: 'eth_sendTransaction',
                        params: [transactionParameters2],
                    })
                    .then(txHash => showConfirmationSpinner(txHash, web32, object, DappObject, 1))
                    .catch((error) => showFail(object, DappObject, 1));
                });
            } else if (DappObject.walletIndex === 2) {
                showSpinner(async () => {
                    await DappObject.walletConnectEVMProvider.request({
                        method: 'eth_sendTransaction',
                        params: [transactionParameters2],
                    })
                    .then(txHash => showConfirmationSpinner(txHash, web32, object, DappObject, 1))
                    .catch((error) => showFail(object, DappObject, 1));
                });
            }

            await isDelegateInput1(DappObject);
        } catch (error) {
            // console.log(error);
        }
    }
}

async function undelegate(object, DappObject) {
    let web32 = new Web3(object.rpcUrl);

    try {
        const wrappedTokenAddr = await GetContract("WNat", object.rpcUrl, object.flrAddr);
        let tokenContract = new web32.eth.Contract(DappObject.ercAbi, wrappedTokenAddr);
        const account = DappObject.selectedAddress;

        const transactionParameters = {
            from: account,
            to: wrappedTokenAddr,
            data: tokenContract.methods.undelegateAll().encodeABI(),
        };

        if (DappObject.walletIndex === 1) {
            await LedgerEVMSingleSign(transactionParameters, DappObject, undefined, false, object, 1);
        } else if (DappObject.walletIndex === 0) {
            showSpinner(async () => {
                await injectedProvider.request({
                    method: 'eth_sendTransaction',
                    params: [transactionParameters],
                })
                .then(txHash => showConfirmationSpinner(txHash, web32, object, DappObject, 1))
                .catch((error) => showFail(object, DappObject, 1));
            });
        } else if (DappObject.walletIndex === 2) {
            showSpinner(async () => {
                await DappObject.walletConnectEVMProvider.request({
                    method: 'eth_sendTransaction',
                    params: [transactionParameters],
                })
                .then(txHash => showConfirmationSpinner(txHash, web32, object, DappObject, 1))
                .catch((error) => showFail(object, DappObject, 1));
            });
        }
    } catch(error) {
        // console.log(error);
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
                    undelegate(object, DappObject);
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

// STAKE MODULE

async function ConnectPChainClickStake(DappObject, HandleClick, PassedPublicKey, PassedEthAddr, addressIndex) {
    DappObject.isHandlingOperation = true;

    clearTimeout(DappObject.latestPopupTimeoutId);

    checkConnection();

    await setCurrentAppState("Connecting");

    await setCurrentPopup("Connecting...", true);

    DappObject.isAccountConnected = false;

    if (typeof PassedPublicKey === "undefined") {
        document.getElementById("ConnectWalletText").innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
    }

    let rpcUrl = "https://sbi.flr.ftsocan.com/ext/C/rpc";

    let flrAddr = "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019";

    let web32 = new Web3(rpcUrl);

    let message = "You are enabling the FTSOCAN DApp to access your accounts PUBLIC key to derive your P-Chain address. Additionally, you are acknowledging the risks involved with staking on Flare and the usage of the MetaMask 'eth_sign' functionality. \n\nWE ARE NOT RESPONSIBLE FOR ANY LOSSES OF FUNDS AFTER STAKING. CONTINUE AT YOUR OWN RISK!";

    try {
        let flrPublicKey;

        let account;

        let selectize;

        if (typeof addressIndex !== "undefined") {
            DappObject.ledgerSelectedIndex = addressIndex;
        }

        let requiredApp;

        if (DappObject.isAvax === true) {
            requiredApp = "Avalanche";
        } else {
            requiredApp = "Flare Network";
        }

        if (DappObject.walletIndex === 1 && typeof PassedPublicKey === "undefined") {
            await getLedgerApp(requiredApp).then(async result => {
                switch (result) {
                    case "Success":
                        await wait(3000);

                        if (!Array.isArray(DappObject.ledgerAddrArray) || !DappObject.ledgerAddrArray.length) {
                            // console.log("Fetching Addresses... P-Chain");
                            let addresses = await getLedgerAddresses("flare", DappObject.isAvax);
    
                            let insert = [];
    
                            for (let i = 0; i < addresses.length; i++) {
                                insert[i] = {
                                    id: i,
                                    title: addresses[i].ethAddress,
                                    pubkey: addresses[i].publicKey,
                                };
                            }
    
                            DappObject.ledgerAddrArray = insert;
                        }
    
                        // console.log(DappObject.ledgerAddrArray);
    
                        document.getElementById("ConnectWalletText").innerHTML = '<select id="select-account" class="connect-wallet-text" placeholder="Select Account"></select>'
    
                        var onInputChange = async (value) => {
                            let addressBox = document.querySelector("span.connect-wallet-text");
                            let ethaddr = addressBox.getAttribute('data-ethkey');
                            let pubKey = addressBox.getAttribute('data-pubkey');
                            
                            flrPublicKey = pubKey;
    
                            account = ethaddr;
    
                            DappObject.selectedAddress = account;
    
                            DappObject.ledgerSelectedIndex = value;
    
                            connectChainsAndKeys(flrPublicKey);
    
                            let unprefixed = await publicKeyToBech32AddressString(flrPublicKey, "flare");
    
                            DappObject.unPrefixedAddr = unprefixed;
     
                            ConnectPChainClickStake(DappObject, HandleClick, flrPublicKey, ethaddr, value);
                        }
    
                        var $select = $('#select-account').selectize({
                            maxItems: 1,
                            valueField: 'id',
                            labelField: 'title',
                            searchField: ["title"],
                            options: DappObject.ledgerAddrArray,
                            render: {
                                item: function (item, escape) {
                                    return (
                                    "<div>" +
                                    (item.title
                                        ? `<span class="title connect-wallet-text" data-pubkey=${item.pubkey} data-ethkey=${item.title}>` + escape(item.title) + "</span>"
                                        : "") +
                                    "</div>"
                                    );
                                },
                                option: function (item, escape) {
                                    var label = item.title;
                                    return (
                                    "<div>" +
                                    '<span class="connect-wallet-text">' +
                                    escape(label) +
                                    "</span>" +
                                    "</div>"
                                    );
                                },
                            },
                            onChange: function(value) {
                                onInputChange(value);
                            },
                            create: false,
                            dropdownParent: "body",
                        });
    
                        selectize = $select[0].selectize;

                        if (typeof HandleClick !== "undefined") {
                            document.getElementById("ConnectPChain").removeEventListener("click", HandleClick);
                        }
    
                        if (DappObject.ledgerSelectedIndex !== "") {
                            selectize.setValue([Number(DappObject.ledgerSelectedIndex)]);
                        } else {
                            await setCurrentPopup("Please select an account.", true);
                        }
    
                        let addressDropdown = document.querySelector(".selectize-input");
                        let publicKey = addressDropdown?.childNodes[0]?.childNodes[0]?.getAttribute('data-pubkey');
                            
                        flrPublicKey = publicKey;
                        break
                    case "Failed: App not Installed":
                        await setCurrentAppState("Alert");

                        clearTimeout(DappObject.latestPopupTimeoutId);

                        DappObject.latestPopupTimeoutId = setTimeout( async () => {
                            await setCurrentPopup("Whoops! Looks like you do not have the Avalanche App installed on your Ledger device! Please install it and come back again later!", true);
                        }, 1000);

                        throw new Error("Ledger Avalanche App not installed!");
                        break
                    case "Failed: User Rejected":
                        ConnectPChainClickStake(DappObject, HandleClick);
                        break
                }
            });
        } else if (DappObject.walletIndex === 0 && typeof PassedPublicKey === "undefined") {
            const accounts = await injectedProvider.request({method: 'eth_requestAccounts'});
            
            account = accounts[0];

            if (DappObject.signatureStaking === "") {

                let signSpinner = $.confirm({
                    escapeKey: false,
                    backgroundDismiss: false,
                    icon: 'fa fa-spinner fa-spin',
                    title: 'Loading...',
                    content: 'Waiting for signature confirmation. <br />Remember to turn on "eth_sign"...',
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
                    }
                });

                const signature = await injectedProvider.request({
                    "method": "personal_sign",
                    "params": [
                    message,
                    account
                    ]
                }).catch((error) => async function() {
                    signSpinner.close();

                    throw error;
                });

                DappObject.signatureStaking = signature;

                signSpinner.close();
            }

            await setCurrentAppState("Connected");

            closeCurrentPopup();

            // await setCurrentPopup("Connected to account: " + account.slice(0, 17));

            DappObject.isAccountConnected = true;

            flrPublicKey = await GetPublicKey(account, message, DappObject.signatureStaking);
        }  else if (DappObject.walletIndex === 2 && typeof PassedPublicKey === "undefined") {
            if (DappObject.walletConnectEVMProvider === undefined) {
                DappObject.walletConnectEVMProvider = await walletConnectProvider.init(walletConnectEVMParams);
            }

            if (!DappObject.walletConnectEVMProvider.session) {
                await DappObject.walletConnectEVMProvider.connect();
            }

            if (DappObject.walletConnectEVMProvider.session.namespaces.eip155.methods.includes("eth_sign")) {                       
                const accounts = await DappObject.walletConnectEVMProvider.request({method: 'eth_requestAccounts'});
                
                account = accounts[0];

                if (DappObject.signatureStaking === "") {
                    let signSpinner = $.confirm({
                        escapeKey: false,
                        backgroundDismiss: false,
                        icon: 'fa fa-spinner fa-spin',
                        title: 'Loading...',
                        content: 'Waiting for signature confirmation. <br />Remember to turn on "eth_sign"...',
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
                        }
                    });

                    const signature = await DappObject.walletConnectEVMProvider.request({
                        "method": "personal_sign",
                        "params": [
                        message,
                        account
                        ]
                    }).catch((error) => async function() {
                        signSpinner.close();

                        throw error;
                    });

                    DappObject.signatureStaking = signature;

                    signSpinner.close();
                }

                await setCurrentAppState("Connected");

                closeCurrentPopup();

                // await setCurrentPopup("Connected to account: " + account.slice(0, 17));

                DappObject.isAccountConnected = true;

                flrPublicKey = await GetPublicKey(account, message, DappObject.signatureStaking);
            } else {
                let signSpinner = $.confirm({
                    escapeKey: false,
                    backgroundDismiss: false,
                    icon: 'fa fa-spinner fa-spin',
                    title: 'Loading...',
                    content: "Sorry!</br> Your wallet does not support 'eth_sign'!</br> You will not be able to stake using the FTSOCAN DApp.",
                    theme: 'material',
                    type: 'dark',
                    typeAnimated: true,
                    draggable: false,
                    buttons: {
                        ok: {
                            action: function () {
                                getDappPage(4);
                            },
                        },
                    },
                    onContentReady: async function () {
                    }
                });
            }
        } else if (typeof PassedPublicKey !== "undefined") {
            account = PassedEthAddr;
            flrPublicKey = PassedPublicKey;

            if (typeof HandleClick !== "undefined") {
                document.getElementById("ConnectPChain").removeEventListener("click", HandleClick);
            }

            await setCurrentAppState("Connected");

            closeCurrentPopup();

            // await setCurrentPopup("Connected to account: " + account.slice(0, 17));

            DappObject.isAccountConnected = true;
        }

        // console.log(flrPublicKey);

        if (typeof flrPublicKey !== 'undefined') {

            const addressBinderAddr = await GetContract("AddressBinder", rpcUrl, flrAddr);

            const AddressBinderContract = new web32.eth.Contract(DappObject.addressBinderAbiLocal, addressBinderAddr);

            connectChainsAndKeys(flrPublicKey);

            const ethAddressString = await publicKeyToEthereumAddressString(flrPublicKey);

            const CchainAddr = ethers.utils.getAddress(ethAddressString);

            const PchainAddr = await publicKeyToBech32AddressString(flrPublicKey, "flare");

            DappObject.unPrefixedAddr = PchainAddr;

            DappObject.selectedAddress = account;

            const PchainAddrEncoded = await publicKeyToPchainEncodedAddressString(flrPublicKey);
                
            const addressPchain = await AddressBinderContract.methods.cAddressToPAddress(CchainAddr).call();

            if (addressPchain !== "0x0000000000000000000000000000000000000000") {

                const prefixedPchainAddress = "P-" + PchainAddr;

                const PchainBalanceObject = await getPchainBalanceOf(prefixedPchainAddress);

                const PchainBalanceBigInt = BigInt(PchainBalanceObject.balance);

                const balance = await web32.eth.getBalance(account);

                let addressBox = document.querySelector("span.connect-wallet-text");

                if (DappObject.walletIndex === 1) {          
                    addressBox.innerText = prefixedPchainAddress;
                } else {
                    showAccountAddress(prefixedPchainAddress);
                }

                if (dappStakingOption === 1) {
                    if (DappObject.transferBool === true) {
                        showBalance(round(web32.utils.fromWei(balance, "ether")));

                        showPchainBalance(round(web32.utils.fromWei(PchainBalanceBigInt, "gwei")));
                    } else {
                        showBalance(round(web32.utils.fromWei(PchainBalanceBigInt, "gwei")));

                        showPchainBalance(round(web32.utils.fromWei(balance, "ether")));
                    }

                    await setCurrentPopup("This is the 'Transfer' page, where you can transfer your FLR tokens from the C-Chain to the P-Chain, to enable you to stake to a validator node and earn passive income!", true);

                    clearTimeout(DappObject.latestPopupTimeoutId);

                    DappObject.latestPopupTimeoutId = setTimeout( async () => {
                        await setCurrentPopup("First, choose if you would like to send your tokens from, or to the P-Chain by clicking on the arrow button. Then, input the amount of tokens you would like to transfer. Don't forget to keep some FLR for gas fees!", true);
                    }, 15000);
                } else if (dappStakingOption === 2) {
                    let delegatedIcon1 = document.getElementById("delegatedIcon1");
                    delegatedIcon1.src = dappUrlBaseAddr + 'img/FLR.svg';
                
                    try {                 
                        customInput(PchainBalanceBigInt, DappObject);
                    
                        await populateValidators();
                    } catch (error) {
                        // console.log(error);
                    }

                    await setCurrentPopup("This is the 'Stake' page, where you can stake your FLR tokens (at least 50,000) to a validator node and earn passive income!", true);

                    clearTimeout(DappObject.latestPopupTimeoutId);

                    DappObject.latestPopupTimeoutId = setTimeout( async () => {
                        await setCurrentPopup("First, choose a validator from the dropdown list. Then, enter for how many days you would like to stake in the calendar, because your FLR will be locked until that date. Finally, enter the amount you would like to stake to that validator (at least 50,000).", true);
                    }, 15000);
                } else if (dappStakingOption === 3) {
                    const ValidatorRewardAddr = await GetContract("ValidatorRewardManager", rpcUrl, flrAddr);

                    const ValidatorRewardContract = new web32.eth.Contract(DappObject.validatorRewardAbiLocal, ValidatorRewardAddr);

                    const StakeAmounts = await getStakeOf(DappObject.unPrefixedAddr);

                    showPchainBalance(round(web32.utils.fromWei(StakeAmounts.staked, "gwei")));
                    showStakeRewards(0);
                    showConnectedAccountAddress(prefixedPchainAddress.slice(0, 20) + "...");

                    // Changing the color of Claim button.
                    if (Number(document.getElementById('ClaimButtonText').innerText) >= 1) {
                        switchClaimButtonColor();
                        
                        DappObject.claimBool = true;
                    } else {
                        switchClaimButtonColorBack();

                        DappObject.claimBool = false;
                    }

                    // Getting the unclaimed Rewards and affecting the Claim button.
                    const RewardStates = await ValidatorRewardContract.methods.getStateOfRewards(DappObject.selectedAddress).call();

                    let totalReward = RewardStates[0];
                    let claimedReward = RewardStates[1];

                    let unclaimedAmount = totalReward - claimedReward;

                    const convertedRewards = web32.utils.fromWei(unclaimedAmount, "ether").split('.');

                    // console.log(unclaimedAmount);
                    
                    // Changing the color of Claim button.
                    showClaimRewards(convertedRewards[0] + "." + convertedRewards[1].slice(0, 2));

                    // Changing the color of Claim button.
                    if (Number(document.getElementById('ClaimButtonText').innerText) >= 1) {
                        switchClaimButtonColor();
                        
                        DappObject.claimBool = true;
                    } else {
                        switchClaimButtonColorBack();

                        DappObject.claimBool = false;
                    }

                    await setCurrentPopup("This is the 'Claim' page, where you can claim the FLR tokens that you have earned by staking to a validator node.", true);

                    clearTimeout(DappObject.latestPopupTimeoutId);

                    DappObject.latestPopupTimeoutId = setTimeout( async () => {
                        await setCurrentPopup("If you have any rewards, the bottom button will become red and contain the amount of rewards you have earned. You only need to click it to begin the claiming process!", true);
                    }, 15000);
                }

                DappObject.isHandlingOperation = false;
            } else {
                await showBindPAddress(AddressBinderContract, web32, account, flrPublicKey, PchainAddrEncoded, DappObject, dappStakingOption);
            }
        } else {
            document.getElementById("ConnectPChain").removeEventListener("click", HandleClick);

            DappObject.isHandlingOperation = false;
        }
    } catch (error) {
        // console.log(error);

        document.getElementById("ConnectWalletText").innerText = "Connect to P-Chain";

        await resetDappObjectState(DappObject);

        var ClickHandler;

        if (HandleClick) {
            document.getElementById("ConnectPChain").removeEventListener("click", HandleClick);
        }

        document.getElementById("ConnectPChain")?.addEventListener("click", ClickHandler = async () => {
            ConnectPChainClickStake(DappObject, ClickHandler);
        });
    }
}

function createCalendar(DappObject) {
    $.widget('ui.spinner', $.ui.spinner, {
        _buttonHtml: function() {
          return '<span class="ui-spinner-button ui-spinner-up">' +
            '<i class="fa fa-solid fa-angle-up"></i>' +
          '</span>' +
          '<span class="ui-spinner-button ui-spinner-down">' +
            '<i class="fa fa-solid fa-angle-down"></i></span>';
        }
    });

    const now = new Date();

    const validatorMinDate = new Date(Number(DappObject.StakeMinDate) * 1000);

    let minimumDate;

    if (Math.sign(now - validatorMinDate) === 1) {
        minimumDate = now;
    } else {
        minimumDate = validatorMinDate;
    }

    minimumDate.setDate(minimumDate.getDate() + 14);

    const maximumDate = new Date(Number(DappObject.StakeMaxDate) * 1000);

    var prevMaxDate = $('#calendar').datepicker( "option", "maxDate" );

    var OnSelectCalendar = async (selectedDateTime) => {
        if (selectedDateTime !== '') {
            let dateArray = selectedDateTime.split(' ');
            DappObject.selectedDateTime = dateArray[0] + "T" + dateArray[1];
            isStakeInput1(DappObject);
        }
    }

    if (prevMaxDate !== maximumDate && prevMaxDate !== null) {
        $('#calendar').datepicker( "option", "maxDate", maximumDate );
        $('#calendar').datepicker( "option", "minDate", minimumDate );
    } else {
        $('#calendar').datetimepicker({
            showAnim: "drop",
            minDate: minimumDate,
            maxDate: maximumDate,
            selectOtherMonths: true,
            hideIfNoPrevNext: true,
            controlType: 'select',
            oneLine: true,
            dateFormat: 'yy-mm-dd',
            timeFormat: 'HH:mm',
            currentText: "MAX",
            onClose: function (selectedDateTime, inst) {
                OnSelectCalendar(selectedDateTime);
            },
            beforeShow: function( inst ) {
                setTodayCalendarButton(inst);
            },
            onChangeMonthYear: function( year, month, inst ) {
                setTodayCalendarButton(inst);
            }
        });
    }
}

function setTodayCalendarButton(inst) {
    setTimeout(function(){
        var buttonPane = $(".ui-datepicker-buttonpane");

        const maximumDate = new Date(Number(DappObject.StakeMaxDate) * 1000);
        
        var btn = $("<button id='calendarMax' type='button' class='ui-datepicker-current ui-state-default ui-priority-secondary ui-corner-all'>MAX</button>");
        
        btn.off("click").on("click", function () {
            inst.selectedDay = maximumDate.getDate();
            inst.drawMonth = inst.selectedMonth = maximumDate.getMonth();
            inst.drawYear = inst.selectedYear = maximumDate.getFullYear();
            $('#calendar').datepicker('setDate', maximumDate);
        });
        
        // Check if buttonPane has that button
        
        if( buttonPane.has('#calendarMax').length == 0 ) {
            btn.appendTo( buttonPane );
        }
    }, 1 );
}

async function RefreshStakingPage(DappObject, stakingOption) {
    DappObject.isHandlingOperation = true;

    setCurrentAppState("Connecting");

    setCurrentPopup("Connecting...", true);

    ConnectPChainClickStake(DappObject);
}

async function connectChainsAndKeys(publicKey) {
    const cKeychain = await keychainc();
    const pKeychain = await keychainp();

    cKeychain.importKey(
      `PublicKey-${unPrefix0x(publicKey)}`
    );
    pKeychain.importKey(
      `PublicKey-${unPrefix0x(publicKey)}`
    );
}

async function GetPublicKey(address, message, signature) {
    const messageHash = ethers.utils.hashMessage(message);
    const recoveredPublicKey = ethers.utils.recoverPublicKey(messageHash, signature);

    // To confirm the signer's address, you can compute the Ethereum address from the recovered public key
    const recoveredAddress = ethers.utils.computeAddress(recoveredPublicKey);
  
    if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
        return recoveredPublicKey;
    } else {
        throw new Error("Failed to verify signer.");
    }
}

async function showPchainBalance(Pchainbalance) {
    document.getElementById("TokenBalance").innerText = Pchainbalance;
}

async function toggleTransferButton(DappObject, stakingOption) {
    var transferIcon = document.getElementById("TransferIcon");

    var fromText = document.getElementById("FromText");
    var toText = document.getElementById("ToText");

    // Switching wrap/unwrap.
    if (DappObject.transferBool === true) {

        DappObject.transferBool = false;
        setTransferButton2(DappObject);

        fromText.style.color = "#000";
        toText.style.color = "#fd000f";
        fromText.innerText = "P";
        toText.innerText = "C";
    } else {
        DappObject.transferBool = true;
        setTransferButton(DappObject);

        fromText.style.color = "#fd000f";
        toText.style.color = "#000";
        fromText.innerText = "C";
        toText.innerText = "P";
    }

    RefreshStakingPage(DappObject, stakingOption);
}

// Is there a valid input?
function setTransferButton(DappObject) {
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

        wrapButtonText.innerText = "Transfer Funds";
    }
}

function setTransferButton2(DappObject) {
    var wrapButton = document.getElementById("WrapButton");
    var wrapButtonText = document.getElementById("WrapButtonText");

    if (Number(document.getElementById("AmountTo").value.replace(/[^0-9]/g, '')) < 1) {
        wrapButton.style.backgroundColor = "rgba(143, 143, 143, 0.8)";
        wrapButton.style.cursor = "auto";
        wrapButtonText.innerText = "Enter Amount";
        DappObject.isRealValue = false;
    } else {
        wrapButton.style.backgroundColor = "rgba(253, 0, 15, 0.8)";
        wrapButton.style.cursor = "pointer";
        DappObject.isRealValue = true;

        wrapButtonText.innerText = "Transfer Funds";
    }
}

// Copy the input.
function copyTransferInput() {
    let amountFrom = document.getElementById("AmountFrom");
    let amountTo = document.getElementById("AmountTo");
    let newValue = ''
    
    if (isNumber(amountTo.value)) {
        newValue = amountTo.value;
    }

    amountFrom.value = newValue;
}

// Transfer button

async function transferTokens(DappObject, stakingOption) {
    if (DappObject.isRealValue === false) {
        await setCurrentPopup('You need to enter a valid amount of tokens: a number that is not greater than your balance.', true);
    } else {
        DappObject.isHandlingOperation = true;

        let rpcUrl = "https://sbi.flr.ftsocan.com/ext/C/rpc";

        var web32 = new Web3(rpcUrl);

        try {
            var amountFrom = document.getElementById("AmountFrom");
            var amountTo = document.getElementById("AmountTo");
            const amountFromValue = amountFrom.value;

            if (!isNumber(amountFromValue)) {
                await setCurrentPopup('The amount you have entered is not a number!', true);
            } else {
                const amountFromValueInt = web32.utils.toWei(amountFromValue, "gwei");

                if (DappObject.transferBool === true) {
                    // C-chain to P-chain

                    // getting C-Chain Keychain

                    const cKeychain = await keychainc();

                    const pKeychain = await keychainp();

                    const nonce = await web32.eth.getTransactionCount(DappObject.selectedAddress);

                    // console.log(cKeychain);

                    let cChainTransactionId;

                    let pChainTransactionId;

                    // export tokens C-Chain

                    try {
                        showConfirmationSpinnerTransfer(async (spinner) => {
                            const cChainTxId = await exportTokensP(DappObject.unPrefixedAddr, DappObject.selectedAddress, cKeychain, nonce, amountFromValueInt, DappObject.walletIndex, DappObject.ledgerSelectedIndex).then(result => {
                                return new Promise((resolve, reject) => {
                                    // console.log("C Chain TX ID: " + result.txid);

                                    cChainTransactionId = result.txid;
                                    
                                    try {
                                        let status = waitCchainAtomicTxStatus(result.txid).then(value => {

                                            switch (value) {
                                                case "Accepted":
                                                    spinner.$content.find('#ExportTxStatus').html('Accepted');
                                                    spinner.$content.find('#ExportTxIcon').removeClass();
                                                    spinner.$content.find('#ExportTxIcon').addClass("fa fa-solid fa-check");
                                                    setTimeout(() => {
                                                        resolve("Success");
                                                    }, 1500);
                                                    break
                                                case "Dropped":
                                                    spinner.$content.find('#ExportTxStatus').html('Dropped');
                                                    spinner.$content.find('#ExportTxIcon').removeClass();
                                                    spinner.$content.find('#ExportTxIcon').addClass("fa fa-warning");
                                                    resolve("Failed");
                                                    spinner.close();
                                                    showFailStake(DappObject, stakingOption);
                                                    break
                                                case "Unknown":
                                                    spinner.$content.find('#ExportTxStatus').html('Unknown');
                                                    spinner.$content.find('#ExportTxIcon').removeClass();
                                                    spinner.$content.find('#ExportTxIcon').addClass("fa fa-warning");
                                                    setTimeout(() => {
                                                        resolve("Unknown");
                                                    }, 1500);
                                                    break
                                                default:
                                                    break
                                            }
                                        });
                                    } catch (error) {
                                        // console.log(error);
                                        throw error;
                                    }
                                });
                            }).then(async result => {
                                if (result == "Success" || result == "Unknown") {
                                    document.getElementById('ImportTxStatus').innerText = 'Please check your Wallet...';
                                    const pChainTxId = await importTokensP(DappObject.unPrefixedAddr, DappObject.selectedAddress, pKeychain, 1, DappObject.walletIndex, DappObject.ledgerSelectedIndex).then(result => {
                                        // console.log("P Chain TX ID: " + result.txid);
        
                                        pChainTransactionId = result.txid;
                                    
                                        try {
                                            let status = waitPchainAtomicTxStatus(result.txid).then(value => {
        
                                                switch (value) {
                                                    case "Committed":
                                                        spinner.$content.find('#ImportTxStatus').html('Committed');
                                                        spinner.$content.find('#ImportTxIcon').removeClass();
                                                        spinner.$content.find('#ImportTxIcon').addClass("fa fa-solid fa-check");
                                                        spinner.close();
                                                        showConfirmStake(DappObject, stakingOption, [cChainTransactionId,pChainTransactionId]);
                                                        break
                                                    case "Dropped":
                                                        spinner.$content.find('#ImportTxStatus').html('Dropped');
                                                        spinner.$content.find('#ImportTxIcon').removeClass();
                                                        spinner.$content.find('#ImportTxIcon').addClass("fa fa-warning");
                                                        spinner.close();
                                                        showFailStake(DappObject, stakingOption);
                                                        break
                                                    case "Unknown":
                                                        spinner.$content.find('#ImportTxStatus').html('Unknown');
                                                        spinner.$content.find('#ImportTxIcon').removeClass();
                                                        spinner.$content.find('#ImportTxIcon').addClass("fa fa-warning");
                                                        spinner.close();
                                                        showFailStake(DappObject, stakingOption);
                                                        break
                                                    default:
                                                        break
                                                }
                                            });
                                        } catch (error) {
                                            // console.log(error);
                                            throw error;
                                        }
                                    });
                                };
                            });
                        });
                    } catch (error) {
                        // console.log("ERROR C-chain to P-chain");
                        throw error;
                    }
                } else {
                    // P-chain to C-chain

                    // getting C-Chain Keychain

                    const cKeychain = await keychainc();

                    const pKeychain = await keychainp();

                    // console.log(cKeychain);

                    let cChainTransactionId;

                    let pChainTransactionId;

                    // export tokens P-Chain

                    try {
                        showConfirmationSpinnerTransfer(async (spinner) => {
                            const pChainTxId = await exportTokensC(DappObject.unPrefixedAddr, DappObject.selectedAddress, pKeychain, amountFromValueInt, DappObject.walletIndex, DappObject.ledgerSelectedIndex).then(result => {
                                return new Promise((resolve, reject) => {
                                    // console.log("P Chain TX ID: " + result);

                                    pChainTransactionId = result;
                                
                                    try {
                                        let status = waitPchainAtomicTxStatus(result).then(value => {

                                            switch (value) {
                                                case "Committed":
                                                    spinner.$content.find('#ExportTxStatus').html('Committed');
                                                    spinner.$content.find('#ExportTxIcon').removeClass();
                                                    spinner.$content.find('#ExportTxIcon').addClass("fa fa-solid fa-check");
                                                    setTimeout(() => {
                                                        resolve("Success");
                                                    }, 1500);
                                                    break
                                                case "Dropped":
                                                    spinner.$content.find('#ExportTxStatus').html('Dropped');
                                                    spinner.$content.find('#ExportTxIcon').removeClass();
                                                    spinner.$content.find('#ExportTxIcon').addClass("fa fa-warning");
                                                    resolve("Failed");
                                                    spinner.close();
                                                    showFailStake(DappObject, stakingOption);
                                                    break
                                                case "Unknown":
                                                    spinner.$content.find('#ExportTxStatus').html('Unknown');
                                                    spinner.$content.find('#ExportTxIcon').removeClass();
                                                    spinner.$content.find('#ExportTxIcon').addClass("fa fa-warning");
                                                    setTimeout(() => {
                                                        resolve("Unknown");
                                                    }, 1500);
                                                    break
                                                default:
                                                    break
                                            }
                                        });
                                    } catch (error) {
                                        // console.log(error);
                                        throw error;
                                    }
                                });
                            }).then(async result => {
                                if (result == "Success" || result == "Unknown") {
                                    document.getElementById('ImportTxStatus').innerText = 'Please check your Wallet...';
                                    const cChainTxId = await importTokensC(DappObject.unPrefixedAddr, DappObject.selectedAddress, cKeychain, DappObject.walletIndex, DappObject.ledgerSelectedIndex).then(result => {
                                        // console.log("C Chain TX ID: " + result);

                                        cChainTransactionId = result;
                                        
                                        try {
                                            let status = waitCchainAtomicTxStatus(result).then(value => {

                                                switch (value) {
                                                    case "Accepted":
                                                        spinner.$content.find('#ImportTxStatus').html('Accepted');
                                                        spinner.$content.find('#ImportTxIcon').removeClass();
                                                        spinner.$content.find('#ImportTxIcon').addClass("fa fa-solid fa-check");
                                                        spinner.close();
                                                        showConfirmStake(DappObject, stakingOption, [pChainTransactionId,cChainTransactionId]);
                                                        break
                                                    case "Dropped":
                                                        spinner.$content.find('#ImportTxStatus').html('Dropped');
                                                        spinner.$content.find('#ImportTxIcon').removeClass();
                                                        spinner.$content.find('#ImportTxIcon').addClass("fa fa-warning");
                                                        spinner.close();
                                                        showFailStake(DappObject, stakingOption);
                                                        break
                                                    case "Unknown":
                                                        spinner.$content.find('#ImportTxStatus').html('Unknown');
                                                        spinner.$content.find('#ImportTxIcon').removeClass();
                                                        spinner.$content.find('#ImportTxIcon').addClass("fa fa-warning");
                                                        spinner.close();
                                                        showFailStake(DappObject, stakingOption);
                                                        break
                                                    default:
                                                        break
                                                }
                                            });
                                        } catch (error) {
                                            // console.log(error);
                                            throw error;
                                        }   
                                    });
                                };
                            });
                        });
                    } catch (error) {
                        // console.log("ERROR P-chain to C-chain");
                        throw error;
                    }
                }

                if (typeof amountFrom !== 'undefined' && amountFrom != null && typeof amountTo !== 'undefined' && amountTo != null) {
                    amountFrom.value = "";
                    amountTo.value = "";
                }

                setTransferButton(DappObject);

                DappObject.isHandlingOperation = false;
            }
        } catch (error) {
            // console.log(error);

            DappObject.isHandlingOperation = false;

            showFailStake(DappObject, stakingOption);
        }
    }
}

function isStakeInput1(DappObject) {
    let claimButton = document.getElementById("WrapButton");

    let select1 = document.getElementById('select-validator').childNodes[0];

    let amount1 = document.getElementById("Amount1");

    if (select1.value !== "" && amount1.value !== "" && DappObject.selectedDateTime !== "") {
        claimButton.style.backgroundColor = "rgba(253, 0, 15, 0.8)";
        claimButton.style.cursor = "pointer";
        DappObject.isRealValue = true;
        document.getElementById("WrapButtonText").innerText = "Stake";
    } else {
        claimButton.style.backgroundColor = "rgba(143, 143, 143, 0.8)";
        claimButton.style.cursor = "auto";
        document.getElementById("WrapButtonText").innerText = "Enter Amount";
        DappObject.isRealValue = false;
    }
}

// Populate select elements.
async function populateValidators() {
    return new Promise(async (resolve) => {
        var insert = [];

        try {

            const ftsoList = await getValidators();

            var onInputChange = async (value) => {
                document.getElementById("calendar").title = "";

                let ftso1 = document.querySelector(".selectize-input");
                let img = ftso1.childNodes[0].childNodes[0].getAttribute('data-img');
                let delegatedicon = document.getElementById("delegatedIcon1");
                DappObject.StakeMinDate = ftso1.childNodes[0].childNodes[0].getAttribute('data-startdate');
                DappObject.StakeMaxDate = ftso1.childNodes[0].childNodes[0].getAttribute('data-enddate');
                delegatedicon.src = img;
                createCalendar(DappObject);
                isStakeInput1(DappObject);
            }


            var $select = $('#select-validator').selectize({
                maxItems: 1,
                valueField: 'id',
                labelField: 'title',
                searchField: ["title", "nodeid"],
                render: {
                    item: function (item, escape) {
                        return (
                        "<div>" +
                        (item.title
                            ? `<span class="title" data-img=${item.img} data-addr=${item.nodeid} data-startdate=${item.startdate} data-enddate=${item.enddate}>` + escape(item.title) + "</span>"
                            : "") +
                        "</div>"
                        );
                    },
                    option: function (item, escape) {
                        var label = item.title || item.nodeid;
                        var caption = item.title ? item.nodeid : null;
                        return (
                        "<div>" +
                        '<span class="ftso-name">' +
                        escape(label) +
                        "</span>" +
                        (caption
                            ? '<span class="ftso-address">' + escape(caption) + "</span>"
                            : "") +
                        "</div>"
                        );
                    },
                },
                onChange: function(value) {
                    onInputChange(value);
                },
                create: false,
                dropdownParent: "body",
            });

            // Origin: https://raw.githubusercontent.com/jtcaya/validator_list_json/master/validatorlist.json
            fetch(dappUrlBaseAddr + 'validatorlist.json')
                .then(res => res.json())
                .then(FtsoInfo => {
                    FtsoInfo.sort((a, b) => a.name > b.name ? 1 : -1);

                    let indexNumber;

                    let g = 1;

                    for (var f = 0; f < FtsoInfo.length; f++) {
                        for (var i = 0; i < ftsoList.length; i++) {
                            if (FtsoInfo[f].lastStatus === "ONLINE") {
                                if (FtsoInfo[f].nodeId === ftsoList[i].nodeID) {
                                    indexNumber = f;
    
                                    //<img src="https://raw.githubusercontent.com/TowoLabs/ftso-signal-providers/master/assets/${delegatedFtsos[i]}.png" class="delegatedIcon" id="delegatedIcon"/>
                                    if (FtsoInfo[indexNumber].name === "FTSOCAN") {
                                        // Origin: https://raw.githubusercontent.com/TowoLabs/ftso-signal-providers/master/assets.
                                        insert[0] = {
                                            id: 0,
                                            title: FtsoInfo[indexNumber].name,
                                            nodeid: ftsoList[i].nodeID,
                                            img: dappUrlBaseAddr + "assets/" + FtsoInfo[indexNumber].nodeId + ".png",
                                            startdate: ftsoList[i].startTime,
                                            enddate: ftsoList[i].endTime
                                        }; 
                                    } else {
                                        // Origin: https://raw.githubusercontent.com/TowoLabs/ftso-signal-providers/master/assets.
                                        insert[g] = {
                                            id: g,
                                            title: FtsoInfo[indexNumber].name,
                                            nodeid: ftsoList[i].nodeID,
                                            img: dappUrlBaseAddr + "assets/" + FtsoInfo[indexNumber].nodeId + ".png",
                                            startdate: ftsoList[i].startTime,
                                            enddate: ftsoList[i].endTime
                                        }; 
    
                                        g += 1;
                                    }
                                }
                            }
                        }
                    }

                var control = $select[0].selectize;

                control.clearOptions();

                for (var z = 0; z < insert.length; z++) {
                    control.addOption({
                        id: insert[z].id,
                        title: insert[z].title,
                        nodeid: insert[z].nodeid,
                        img: insert[z].img,
                        startdate: insert[z].startdate,
                        enddate: insert[z].enddate
                    });
                }
            });
        } catch (error) {
            // console.log(error)
        }

        resolve();
    })
}

//Custom Input 

async function customInput(Pbalance, DappObject) {
    $('<div class="stake-amount-nav"><div id="stakeAmountUp" class="stake-amount-button stake-amount-button-up fa fa-solid fa-angle-up"></div><div id="stakeAmountDown" class="stake-amount-button stake-amount-button-down fa fa-solid fa-angle-down"></div><div id="stakeAmountMax" class="stake-amount-button stake-amount-button-max">MAX</div></div>').insertAfter("#stakeAmount input");

    let spinner = $("#stakeAmount");

    let input = document.getElementById("Amount1");

    let btnUp = spinner.find("#stakeAmountUp");

    let btnDown = spinner.find("#stakeAmountDown");

    let btnMax = spinner.find("#stakeAmountMax");

    let min = input.getAttribute("min");
    let max = input.getAttribute("max");

    btnUp.on("click", function() {
        var oldValue = input.value;

        var newVal;

        if (Number(oldValue.slice(0, -1)) == 0) {
            newVal = "50k";
        } else {
            if (oldValue.endsWith("k") && Number(oldValue.slice(0, -1)) + 50 > max) {
                newVal = "1M";
            } else if (oldValue.endsWith("M") && Number(oldValue.slice(0, -1)) + 1 > 10) {
                newVal = "10M";
            } else {
                if (oldValue.endsWith("M")) {
                    newVal = String(Number(oldValue.slice(0, -1)) + 1) + "M";
                } else {
                    newVal = String(Number(oldValue.slice(0, -1)) + 50) + "k";
                }
            }
        }

        input.value = newVal;
        spinner.find("input").trigger("change");

        isStakeInput1(DappObject);
    });

    btnDown.on("click", function() {
        var oldValue = input.value;

        var newVal;

        if (Number(oldValue.slice(0, -1)) == 0) {
            newVal = "0";
        } else {
            if (oldValue.endsWith("k") && Number(oldValue.slice(0, -1)) - 50 < min) {
                newVal = "0";
            } else if (oldValue.endsWith("M") && Number(oldValue.slice(0, -1)) - 1 < 1) {
                newVal = "950k";
            } else {
                if (oldValue.endsWith("M")) {
                    newVal = String(Number(oldValue.slice(0, -1)) - 1) + "M";
                } else {
                    newVal = String(Number(oldValue.slice(0, -1)) - 50) + "k";
                }
            }
        }

        input.value = newVal;
        spinner.find("input").trigger("change");

        isStakeInput1(DappObject);
    });

    btnMax.on("click", function() {
        if (Pbalance / 1000000000n > 50000n) {
            var newVal = Number(Pbalance / 1000000000n / 50000n);

            input.value = String(newVal * 50) + "k";
        } else {
            input.value = "0";
        }

        spinner.find("input").trigger("change");

        isStakeInput1(DappObject);
    });
}

// Staking function

async function stake(DappObject, stakingOption) {
    DappObject.isHandlingOperation = true;

    let selectedDate = new Date(DappObject.selectedDateTime);

    let Days = new Date();

    const diffTime = Math.abs(selectedDate - Days);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let amount1 = document.getElementById("Amount1");
    let ftso1 = document.querySelector(".selectize-input");

    const prefixedPchainAddress = "P-" + DappObject.unPrefixedAddr;

    const PchainBalanceObject = await getPchainBalanceOf(prefixedPchainAddress);

    const PchainBalanceBigInt = BigInt(PchainBalanceObject.balance);

    var addr1 = ftso1.childNodes[0].childNodes[0].getAttribute('data-addr');

    let stakeAmount;

    if (amount1.value.endsWith("k")) {
        stakeAmount = BigInt(Number(amount1.value.slice(0, -1))) * 1000n * 1000000000n;
    } else {
        stakeAmount = BigInt(Number(amount1.value.slice(0, -1))) * 1000000n * 1000000000n;
    }

    amount1.value = "0";

    if (PchainBalanceBigInt < stakeAmount) {
        await setCurrentPopup('You have insufficient funds!', true);
    } else {
        // Getting C-Chain Keychain

        const cKeychain = await keychainc();

        const pKeychain = await keychainp();

        let pChainTransactionId;

        try {
            showConfirmationSpinnerStake(async (spinner) => {
                const PchainTxId = await addDelegator(DappObject.selectedAddress, DappObject.unPrefixedAddr, cKeychain, pKeychain, addr1, stakeAmount, diffDays, selectedDate.getHours(), 1, DappObject.walletIndex, DappObject.ledgerSelectedIndex).then(result => {
                    // console.log("P Chain TX ID: " + result);

                    pChainTransactionId = result;
                
                    try {
                        let status = waitPchainAtomicTxStatus(result).then(value => {

                            switch (value) {
                                case "Committed":
                                    spinner.close();
                                    showConfirmStake(DappObject, stakingOption, [pChainTransactionId]);
                                    break
                                case "Dropped":
                                    spinner.close();
                                    showFailStake(DappObject, stakingOption);
                                    break
                                case "Unknown":
                                    spinner.close();
                                    showFailStake(DappObject, stakingOption);
                                    break
                                default:
                                    break
                            }
                        });
                    } catch (e) {
                        spinner.close();
                        
                        showFailStake(DappObject, stakingOption);

                        throw e;
                    }
                });
            });

            DappObject.isHandlingOperation = false;

            isStakeInput1(DappObject);
        } catch (error) {
            DappObject.isHandlingOperation = false;

            // console.log(error);
        }
    }
}

// Show current rewards.
function showStakeRewards(rewards) {
    document.getElementById('ClaimButtonText').innerText = rewards == 0 ? '0' : rewards;
}

// Claim Staking rewards

async function claimStakingRewards(DappObject, stakingOption) {
    DappObject.isHandlingOperation = true;

    let rpcUrl = "https://sbi.flr.ftsocan.com/ext/C/rpc";

    let flrAddr = "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019";

    let web32 = new Web3(rpcUrl);

    try {
        const ValidatorRewardAddr = await GetContract("ValidatorRewardManager", rpcUrl, flrAddr);

        const ValidatorRewardContract = new web32.eth.Contract(DappObject.validatorRewardAbiLocal, ValidatorRewardAddr);

        const RewardStates = await ValidatorRewardContract.methods.getStateOfRewards(DappObject.selectedAddress).call();

        let totalReward = RewardStates[0];
        let claimedReward = RewardStates[1];

        let unclaimedAmount = totalReward - claimedReward;

        let txPayload = {};

        if (Number(document.getElementById('ClaimButtonText').innerText) > 0) {
            txPayload = {
                from: DappObject.selectedAddress,
                to: ValidatorRewardAddr,
                data: ValidatorRewardContract.methods.claim(DappObject.selectedAddress, DappObject.selectedAddress, unclaimedAmount, false).encodeABI(),
            };
            
            const transactionParameters = txPayload;

            if (DappObject.walletIndex === 1) {
                await LedgerEVMSingleSign(txPayload, DappObject, stakingOption, true);
            } else {
                showSpinner(async () => {
                    await injectedProvider.request({
                        method: 'eth_sendTransaction',
                        params: [transactionParameters],
                    })
                    .then(txHash => showConfirmationSpinnerStake(async (spinner) => {
                        checkTxStake(txHash, web32, spinner, DappObject);
                    }))
                    .catch((error) => showFailStake(DappObject, 2));
                });
            }

            const StakeAmounts = await getStakeOf(DappObject.unPrefixedAddr);

            DappObject.isHandlingOperation = false;
            
            showClaimRewards(0);
            switchClaimButtonColorBack(DappObject.claimBool);
            showPchainBalance(round(web32.utils.fromWei(StakeAmounts.staked, "gwei")));
        } else {
            DappObject.isHandlingOperation = false;

            await setCurrentPopup('The Rewards Bucket is empty! Please try again later.', true);
        }
    } catch (error) {
        DappObject.isHandlingOperation = false;

        // console.log(error);
    }
}

// Ledger EVM

async function LedgerEVMSingleSign(txPayload, DappObject, stakingOption, isStake = false, object, pageIndex) {
    DappObject.isHandlingOperation = true;

    let ethersProvider;

    let web32;

    if (typeof object !== "undefined") {
        ethersProvider = new ethers.providers.JsonRpcProvider(object.rpcUrl);

        web32 = new Web3(object.rpcUrl);
    } else {
        ethersProvider = new ethers.providers.JsonRpcProvider('https://sbi.flr.ftsocan.com/ext/C/rpc');

        web32 = new Web3('https://sbi.flr.ftsocan.com/ext/C/rpc');
    }

    const nonce = await ethersProvider.getTransactionCount(DappObject.selectedAddress, "latest");

    const feeData = await web32.eth.calculateFeeData();

    const latestBlock = await ethersProvider.getBlock("latest");

    let gasPrice = feeData.gasPrice > BigInt(latestBlock.baseFeePerGas._hex) ? feeData.gasPrice : BigInt(latestBlock.baseFeePerGas._hex);

    let maxFeePerGas = feeData.maxFeePerGas > BigInt(latestBlock.baseFeePerGas._hex) ? feeData.maxFeePerGas : BigInt(latestBlock.baseFeePerGas._hex);

    let chainId = 14;

    if (typeof object !== "undefined" && object.rpcUrl.includes("flr")) {
        chainId = 14;
    } else if (typeof object !== "undefined" && object.rpcUrl.includes("sgb")) {
        chainId = 19;
    }

    let LedgerTxPayload;

    if (txPayload.value) {
        LedgerTxPayload = {
            to: txPayload.to,
            maxPriorityFeePerGas: maxFeePerGas,
            maxFeePerGas: maxFeePerGas,
            gasPrice: gasPrice,
            gasLimit: ethers.utils.hexlify(latestBlock.gasLimit),
            nonce: nonce,
            chainId: chainId,
            data: txPayload.data,
            value: txPayload.value
        };
    } else {
        LedgerTxPayload = {
            to: txPayload.to,
            maxPriorityFeePerGas: maxFeePerGas,
            maxFeePerGas: maxFeePerGas,
            gasPrice: gasPrice,
            gasLimit: ethers.utils.hexlify(latestBlock.gasLimit),
            nonce: nonce,
            chainId: chainId,
            data: txPayload.data,
        };
    }

    showSpinner(async () => {
        try {
            await ledgerSignEVM(LedgerTxPayload, DappObject.ledgerSelectedIndex, ethersProvider).then(async signedTx => {

                showConfirmationSpinnerStake(async (spinner) => {
                    try {
                        spinner.setContent("Waiting for network confirmation. <br />Please wait...");
                        ethersProvider.sendTransaction(signedTx).then(response => {
                            if (isStake === true) {
                                checkTxStake(response.hash, web32, spinner, DappObject);
                            } else {
                                checkTx(response.hash, web32, spinner, object, DappObject, pageIndex);
                            }
                        });
                    } catch (error) {
                        spinner.close();
                        throw error;
                    }
                });
            })
        } catch (error) {
            if (isStake === true) {
                showFailStake(DappObject, stakingOption);
                // console.log(error);
            } else {
                showFail(object, DappObject, pageIndex);
                // console.log(error);
            }
        }
    });
}

async function LedgerEVMFtsoV2Sign(txPayload, txPayloadV2, DappObject, object, pageIndex, txHashes) {
    DappObject.isHandlingOperation = true;

    let ethersProvider;

    let web32;

    if (typeof object !== "undefined") {
        ethersProvider = new ethers.providers.JsonRpcProvider(object.rpcUrl);

        web32 = new Web3(object.rpcUrl);
    } else {
        ethersProvider = new ethers.providers.JsonRpcProvider('https://sbi.flr.ftsocan.com/ext/C/rpc');

        web32 = new Web3('https://sbi.flr.ftsocan.com/ext/C/rpc');
    }

    const nonce = await ethersProvider.getTransactionCount(DappObject.selectedAddress, "latest");

    const feeData = await web32.eth.calculateFeeData();

    const latestBlock = await ethersProvider.getBlock("latest");

    let gasPrice = feeData.gasPrice > BigInt(latestBlock.baseFeePerGas._hex) ? feeData.gasPrice : BigInt(latestBlock.baseFeePerGas._hex);

    let maxFeePerGas = feeData.maxFeePerGas > BigInt(latestBlock.baseFeePerGas._hex) ? feeData.maxFeePerGas : BigInt(latestBlock.baseFeePerGas._hex);

    let chainId = 14;

    if (typeof object !== "undefined" && object.rpcUrl.includes("flr")) {
        chainId = 14;
    } else if (typeof object !== "undefined" && object.rpcUrl.includes("sgb")) {
        chainId = 19;
    }

    let LedgerTxPayload = {
        to: txPayload.to,
        maxPriorityFeePerGas: maxFeePerGas,
        maxFeePerGas: maxFeePerGas,
        gasPrice: gasPrice,
        gasLimit: ethers.utils.hexlify(latestBlock.gasLimit),
        nonce: nonce,
        chainId: chainId,
        data: txPayload.data,
    };

    let LedgerTxPayloadV2 = {
        to: txPayloadV2.to,
        maxPriorityFeePerGas: maxFeePerGas,
        maxFeePerGas: maxFeePerGas,
        gasPrice: gasPrice,
        gasLimit: ethers.utils.hexlify(latestBlock.gasLimit),
        nonce: nonce + 1,
        chainId: chainId,
        data: txPayloadV2.data,
    };

    showConfirmationSpinnerv2(async (v2Spinner) => {
        try {
            await ledgerSignEVM(LedgerTxPayload, DappObject.ledgerSelectedIndex, ethersProvider).then(async signedTx => {
                ethersProvider.sendTransaction(signedTx).then(response => {
                    
                    txHashes[0] = response.hash;

                    checkTx(response.hash, web32, undefined, object, DappObject, pageIndex, true).then(result => {
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
                                    showFail(object, DappObject, 2);
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
                            await ledgerSignEVM(LedgerTxPayloadV2, DappObject.ledgerSelectedIndex, ethersProvider).then(async signedTxV2 => {
                                ethersProvider.sendTransaction(signedTxV2).then(answer => {
                                    txHashes[1] = answer.hash;

                                    checkTx(answer.hash, web32, undefined, object, DappObject, pageIndex, true).then(receipt => {
                                        switch (receipt) {
                                            case "Success":
                                                v2Spinner.$content.find('#v2TxStatus').html('Confirmed');
                                                v2Spinner.$content.find('#v2TxIcon').removeClass();
                                                v2Spinner.$content.find('#v2TxIcon').addClass("fa fa-solid fa-check");
                                                v2Spinner.close();
                                                showConfirm(txHashes[0] + "<br/>" + txHashes[1], object, DappObject, 2);
                                                break
                                            case "Fail":
                                                v2Spinner.$content.find('#v2TxStatus').html('Failed');
                                                v2Spinner.$content.find('#v2TxIcon').removeClass();
                                                v2Spinner.$content.find('#v2TxIcon').addClass("fa fa-warning");
                                                v2Spinner.close();
                                                showFail(object, DappObject, 2);
                                                break
                                            case "Unknown":
                                                v2Spinner.$content.find('#v2TxStatus').html('Unknown');
                                                v2Spinner.$content.find('#v2TxIcon').removeClass();
                                                v2Spinner.$content.find('#v2TxIcon').addClass("fa fa-warning");
                                                v2Spinner.close();
                                                showFail(object, DappObject, 2);
                                                break
                                        }
                                    });
                                });
                            });
                        }
                    });
                });
            });
        } catch (error) {
            v2Spinner.close();

            showFail(object, DappObject, pageIndex);
        }
    });
}

async function handleTransportConnect(chosenNavigator, DappObject, option, stakingOption) {
    DappObject.isHandlingOperation = true;

    if (option === 4 && stakingOption === 5) {
        let continueButton = document.getElementById("ContinueAnyway");

        let newButton = continueButton.cloneNode(true);

        continueButton.parentNode.replaceChild(newButton, continueButton);
        
        document.getElementById("ContinueAnyway")?.classList.add("claim-button");

        DappObject.isHandlingOperation = false;
    }

    clearTimeout(DappObject.latestPopupTimeoutId);

    let numberOfLedgers = await getNumberOfLedgers(chosenNavigator);

    if (numberOfLedgers >= 1) {
        let requiredApp;

        if (DappObject.walletIndex === 0) {
            requiredApp = "Ethereum";
        } else if (DappObject.walletIndex === 1 || DappObject.walletIndex === -1) {
            if (DappObject.isAvax === true) {
                requiredApp = "Avalanche";
            } else {
                requiredApp = "Flare Network";
            }
        }

        await setCurrentAppState("Connecting");

        await getLedgerApp(requiredApp).then(async result => {
            switch (result) {
                case "Success":
                    let rpc;

                    let registryaddr;

                    if (option != 4) {
                        var networkSelectBox = document.getElementById('SelectedNetwork');

                        rpc = networkSelectBox.options[networkSelectBox.selectedIndex].getAttribute("data-rpcurl");

                        registryaddr = networkSelectBox.options[networkSelectBox.selectedIndex].getAttribute("data-registrycontract");
                    }

                    await wait(3000);
              
                    handleAccountsChanged([], DappObject, option, stakingOption, rpc, registryaddr, true);
                    break
                case "Failed: App not Installed":
                    await setCurrentAppState("Alert");

                    clearTimeout(DappObject.latestPopupTimeoutId);

                    DappObject.latestPopupTimeoutId = setTimeout( async () => {
                        await setCurrentPopup("Whoops! Looks like you do not have the " + requiredApp + " App installed on your Ledger device! Please install it and come back again later!", true);
                    }, 1000);

                    if (option === 4 && stakingOption === 5) {
                        let continueButton = document.getElementById("ContinueAnyway");

                        let newButton = continueButton.cloneNode(true);

                        continueButton.parentNode.replaceChild(newButton, continueButton);
                        
                        document.getElementById("ContinueAnyway")?.classList.add("claim-button");

                        DappObject.isHandlingOperation = false;
                    }

                    throw new Error("Ledger " + requiredApp + " App not installed!");
                    break
                case "Failed: User Rejected":
                    if (option === 4 && stakingOption === 5) {
                        let continueButton = document.getElementById("ContinueAnyway");

                        let newButton = continueButton.cloneNode(true);

                        continueButton.parentNode.replaceChild(newButton, continueButton);
                        
                        document.getElementById("ContinueAnyway")?.classList.add("claim-button");

                        DappObject.isHandlingOperation = false;
                    }
            }
        });
    } else {
        DappObject.isHandlingOperation = false;

        if (DappObject.walletIndex === 1) {
            clearTimeout(DappObject.latestPopupTimeoutId);

            DappObject.latestPopupTimeoutId = setTimeout( async () => {
                getDappPage(4);
            }, 3000);
        }

        // console.log("No Devices!");
    }
}

async function setCurrentAppState(state) {
    const currentWallet = document.getElementById("currentWallet");

    const appLogo = document.getElementById("appLogo");

    const walletNotification = document.getElementById("currentWalletIcon");

    switch (DappObject.walletIndex) {
        case -1:
            appLogo.innerHTML = '<svg class="btn-bell" fill="none" version="1.1" viewBox="0 0 185 185" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g transform="translate(0 26.5)"><g transform="matrix(.93 0 0 .93 6.12 8.72)" fill="#fff" style="mix-blend-mode:normal"><path d="m98.8-11.9s-3.45 6.65-7.58 14.8c-4.13 8.13-7.68 15-7.91 15.3-0.451 0.61-1.04 0.959-1.73 1.12-0.963 0.175-1.82-0.222-2.54-0.6-1.1-0.572-3.01-1.68-6.75-3.83-4.21-2.43-7.67-4.41-7.68-4.39-0.0179 0.0185 2.08 10.9 4.67 24.3 2.23 11.5 3.4 17.6 4 20.9 0.297 1.64 0.449 2.58 0.516 3.15 0.179 1.28-0.51 2.31-1.53 2.9-0.982 0.423-2.09 0.351-2.99-0.172-0.28-0.201-4.75-4.92-9.93-10.5-5.18-5.57-9.53-10.2-9.67-10.4-0.0305-0.0319-0.059-0.0553-0.0907-0.0614-0.0316-0.0061-0.0663 0.0056-0.108 0.0442-0.0841 0.0772-0.198 0.263-0.379 0.632-0.362 0.738-0.993 2.21-2.19 5.02-1.14 2.67-1.78 4.16-2.2 5.03-0.334 0.806-0.813 1.4-1.53 1.78-1.07 0.517-2.26 0.169-3.2-0.0083-1.75-0.331-4.89-0.996-10.8-2.25-6.88-1.47-12.5-2.64-12.6-2.61-0.0307 0.0287 1.86 5.95 4.21 13.2 1.64 5.04 2.7 8.36 3.36 10.5 0.328 1.07 0.554 1.84 0.698 2.38 0.202 0.555 0.221 1.13 0.131 1.66-0.148 0.665-0.517 1.19-1 1.6-0.267 0.199-2.68 1.38-5.35 2.63l-4.87 2.27 16.9 13.7c13.1 10.6 19.6 15.9 22.9 18.6 1.67 1.37 2.54 2.09 3.02 2.51 0.465 0.366 0.828 0.823 1.03 1.31 0.198 1.02-0.039 2.04-0.325 2.94-0.352 1.1-1.02 2.94-2.26 6.35-1.46 4-2.63 7.29-2.6 7.31 0.0281 0.0215 2.8-0.448 6.16-1.04 5.31-0.942 10.1-1.83 14.2-2.63 4.13-0.804 7.66-1.52 10.5-2.13 5.75-1.21 8.91-1.97 9.15-2.04 1.08-0.296 2.33-0.65 3.69-1.03-0.267 0.0511-0.536 0.0933-0.806 0.127-6.73-0.0855-12.2-5.57-12.2-12.1 0.0784-7.9 7.71-13.6 15.1-11.8 0.0336 0.0101 0.0672 0.0204 0.101 0.0308l0.0625-21-16.5 0.0199c-0.464-4.28 0.776-8.53 2.83-12.3 2.85-5.36 8.17-8.32 13.8-9.84l0.0697-23.4-15.5 0.0863c-0.395-3.38 0.337-6.77 1.63-9.93 2.4-6.28 7.68-10.4 14-12.1z"/><path d="m108 15.2c-2.81 0.0422-5.16 0.0931-6.84 0.154-5.82 0.575-11.6 3.81-14.4 8.92-0.36 0.659-0.685 1.35-0.981 2.04-1.35 2.79-1.61 5.46-1.45 8.53l68.8-0.368c5.31-0.324 10.2-3.26 13.5-7.33 2.61-3.51 3.31-7.8 3.67-12.1-20.8 0.0319-40.5-0.158-62.3 0.165z"/><path d="m113 60.5c-4.57 0.0229-8.92 0.0842-12.4 0.207-5.15 0.55-10.5 2.94-13.7 7.04-2.81 3.73-4 7.85-3.74 12.5 13.8-0.0159 27.6-0.0324 41.4-0.0487 4.96-0.312 9.85-2.74 13.1-6.4 3.31-3.57 4.21-8.3 4.62-13.1-10.4-0.142-18.9-0.257-29.3-0.207z"/><path d="m95.4 104c-5.85 0.0737-10.6 4.83-10.6 10.5 0.0819 5.88 4.95 10.5 10.6 10.5 5.8-0.157 10.6-4.77 10.6-10.5-0.0157-5.82-4.92-10.5-10.6-10.5z"/></g></g></svg>';
            break
        case 0:
            appLogo.innerHTML = '<svg class="btn-bell" fill="none" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 79.374998 79.375" version="1.1" id="svg1" xml:space="preserve" <g id="layer1"><path style="fill:#FFFFFF" d="m 31.704516,54.76963 c -4.375814,-6.160866 -7.922539,-11.247117 -7.881611,-11.30278 0.04093,-0.05566 3.593184,1.983209 7.893905,4.530827 5.047396,2.989926 8.022846,4.553998 8.393112,4.411913 0.315491,-0.121065 3.842011,-2.14287 7.83671,-4.492899 3.9947,-2.350029 7.406681,-4.354063 7.582181,-4.453409 0.185732,-0.105139 0.191732,0.02645 0.01436,0.31485 C 54.951014,44.74094 40.471667,65.093835 40.069032,65.529353 39.751451,65.87287 37.889917,63.47828 31.704516,54.76963 Z M 31.75,45.034923 c -5.211187,-3.083904 -7.897706,-4.869531 -7.821643,-5.198748 0.237348,-1.027294 15.739202,-26.414666 15.975582,-26.163196 0.135321,0.143959 3.814868,6.16979 8.176771,13.390737 l 7.930733,13.128993 -7.961961,4.686285 C 43.670403,47.45645 39.997516,49.60284 39.88751,49.648749 39.777505,49.694658 36.115625,47.618436 31.75,45.034923 Z" id="path5"/></g></svg>'
            break
        case 1:
            if (DappObject.isAvax === true) {
                appLogo.innerHTML = '<svg class="btn-bell" viewBox="0 0 1503 1504" fill="none" version="1.1" id="svg1" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg"> <path fill-rule="evenodd" clip-rule="evenodd" d="M 538.688,1050.86 H 392.94 c -30.626,0 -45.754,0 -54.978,-5.9 -9.963,-6.46 -16.051,-17.16 -16.789,-28.97 -0.554,-10.88 7.011,-24.168 22.139,-50.735 l 359.87,-634.32 c 15.313,-26.936 23.061,-40.404 32.839,-45.385 10.516,-5.35 23.062,-5.35 33.578,0 9.778,4.981 17.527,18.449 32.839,45.385 l 73.982,129.144 0.377,0.659 c 16.539,28.897 24.926,43.551 28.588,58.931 4.058,16.789 4.058,34.5 0,51.289 -3.69,15.497 -11.992,30.257 -28.781,59.591 l -189.031,334.153 -0.489,0.856 c -16.648,29.135 -25.085,43.902 -36.778,55.042 -12.73,12.18 -28.043,21.03 -44.832,26.02 -15.313,4.24 -32.47,4.24 -66.786,4.24 z m 368.062,0 h 208.84 c 30.81,0 46.31,0 55.54,-6.08 9.96,-6.46 16.23,-17.35 16.79,-29.15 0.53,-10.53 -6.87,-23.3 -21.37,-48.323 -0.5,-0.852 -1,-1.719 -1.51,-2.601 l -104.61,-178.956 -1.19,-2.015 c -14.7,-24.858 -22.12,-37.411 -31.65,-42.263 -10.51,-5.351 -22.88,-5.351 -33.391,0 -9.594,4.981 -17.342,18.08 -32.655,44.462 l -104.238,178.957 -0.357,0.616 c -15.259,26.34 -22.885,39.503 -22.335,50.303 0.738,11.81 6.826,22.69 16.788,29.15 9.041,5.9 24.538,5.9 55.348,5.9 z" fill="#FFFFFF" id="path1"/></svg>';
            } else {
                appLogo.innerHTML = '<svg class="btn-bell" fill="none" version="1.1" viewbox="0 0 383.66 538.51" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(.80749 0 0 .80749 59.503 59.212)" stroke-width="2.1053"><path d="m1.54 44.88s-1.54-0.83693-1.54-1.57c0-14.016 13.306-43.31 44.83-43.31 7.0837 1e-14 178 0 178 0s1.55 0.837 1.54 1.57c-0.28292 20.783-17.203 43.31-44.86 43.31h-177.97z"/><path d="m-2.8371e-7 133.36c-0.01006 0.733 1.54 1.57 1.54 1.57h110.8c25.586 0 44.577-22.527 44.86-43.31 0.01-0.733-1.54-1.57-1.54-1.57h-110.78c-25.453 0-44.595 22.522-44.88 43.31z"/><path d="m45.069 202.56a22.648 22.301 0 0 1-22.648 22.301 22.648 22.301 0 0 1-22.648-22.301 22.648 22.301 0 0 1 22.648-22.301 22.648 22.301 0 0 1 22.648 22.301z"/></g></svg><svg class="btn-bell" fill="#FFFFFF" version="1.1" viewbox="-40 -100 300 400" xmlns="http://www.w3.org/2000/svg"><g stroke-width="2.1053"><path d="m1.54 44.88s-1.54-0.83693-1.54-1.57c0-14.016 13.306-43.31 44.83-43.31 7.0837 1e-14 178 0 178 0s1.55 0.837 1.54 1.57c-0.28292 20.783-17.203 43.31-44.86 43.31h-177.97z"/><path d="m-2.8371e-7 133.36c-0.01006 0.733 1.54 1.57 1.54 1.57h110.8c25.586 0 44.577-22.527 44.86-43.31 0.01-0.733-1.54-1.57-1.54-1.57h-110.78c-25.453 0-44.595 22.522-44.88 43.31z"/><path d="m45.069 202.56a22.648 22.301 0 0 1-22.648 22.301 22.648 22.301 0 0 1-22.648-22.301 22.648 22.301 0 0 1 22.648-22.301 22.648 22.301 0 0 1 22.648 22.301z"/></g></svg>';
            }   
            break
        case 2:
            appLogo.innerHTML = '<svg class="btn-bell" fill="none" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 79.374998 79.375" version="1.1" id="svg1" xml:space="preserve" <g id="layer1"><path style="fill:#FFFFFF" d="m 31.704516,54.76963 c -4.375814,-6.160866 -7.922539,-11.247117 -7.881611,-11.30278 0.04093,-0.05566 3.593184,1.983209 7.893905,4.530827 5.047396,2.989926 8.022846,4.553998 8.393112,4.411913 0.315491,-0.121065 3.842011,-2.14287 7.83671,-4.492899 3.9947,-2.350029 7.406681,-4.354063 7.582181,-4.453409 0.185732,-0.105139 0.191732,0.02645 0.01436,0.31485 C 54.951014,44.74094 40.471667,65.093835 40.069032,65.529353 39.751451,65.87287 37.889917,63.47828 31.704516,54.76963 Z M 31.75,45.034923 c -5.211187,-3.083904 -7.897706,-4.869531 -7.821643,-5.198748 0.237348,-1.027294 15.739202,-26.414666 15.975582,-26.163196 0.135321,0.143959 3.814868,6.16979 8.176771,13.390737 l 7.930733,13.128993 -7.961961,4.686285 C 43.670403,47.45645 39.997516,49.60284 39.88751,49.648749 39.777505,49.694658 36.115625,47.618436 31.75,45.034923 Z" id="path5"/></g></svg>'
            break
    }

    switch (state) {
        case "Null":
            currentWallet.classList.remove("ring");
            currentWallet.classList.add("paused");

            walletNotification.style.backgroundColor = "#aaa";
            walletNotification.style.border = "3px solid #dadada";
            break
        case "Alert":
            currentWallet.classList.add("ring");
            currentWallet.classList.remove("paused");

            walletNotification.style.backgroundColor = "#f45f58";
            walletNotification.style.border = "3px solid #ff9994";
            break
        case "Connecting":
            currentWallet.classList.add("ring");
            currentWallet.classList.remove("paused");

            walletNotification.style.backgroundColor = "#f9be2f";
            walletNotification.style.border = "3px solid #ffe5a7";
            break
        case "Connected":
            currentWallet.classList.remove("ring");
            currentWallet.classList.add("paused");

            walletNotification.style.backgroundColor = "#42ca40";
            walletNotification.style.border = "3px solid #8fe18e";
            break
    }
}

async function setCurrentPopup(message, open) {
    document.getElementById("currentWalletPopup").classList.remove("showing");

    clearTimeout(DappObject.latestPopupTimeoutId);

    if (open === true) {
        if ((navigator.maxTouchPoints & 0xFF) === 0) {
            await wait(1000);

            document.getElementById("currentWalletPopup").classList.add("showing");
        }
    }

    document.getElementById("currentWalletPopupText").innerText = message;
}

function closeCurrentPopup() {
    document.getElementById("currentWalletPopup").classList.remove("showing");
}

async function resetDappObjectState(DappObject) {
    DappObject.isHandlingOperation = false;

    DappObject.signatureStaking = "";

    DappObject.ledgerSelectedIndex = "";

    DappObject.selectedAddress = "";

    DappObject.unPrefixedAddr = "";

    DappObject.ledgerAddrArray = [];

    if (DappObject.walletConnectEVMProvider !== undefined) {
        DappObject.walletConnectEVMProvider.disconnect();
    }

    DappObject.walletConnectEVMProvider = undefined;
}

async function setupLedgerOption() {
    if ((navigator.maxTouchPoints & 0xFF) === 0) {
        var $select = $('#chosenApp').selectize({
            maxItems: 1,
            valueField: 'id',
            labelField: 'title',
            searchField: ["title"],
            options: ledgerAppList,
            render: {
                item: function (item, escape) {
                    return (
                    "<div>" +
                    (item.title
                        ? `<span class="addr-wrap">` + escape(item.title) + "</span>"
                        : "") +
                    "</div>"
                    );
                },
                option: function (item, escape) {
                    var label = item.title;
                    return (
                    "<div>" +
                    '<span class="connect-wallet-text">' +
                    escape(label) +
                    "</span>" +
                    "</div>"
                    );
                },
            },
            onChange: function(value) {
                onLedgerInputChange(value);
            },
            create: false,
            dropdownParent: "body",
        });
    } else {
        document.getElementById("metamaskOption").classList.remove("col-md-4");
        document.getElementById("metamaskOption").classList.add("col-md-6");

        document.getElementById("walletConnectOption").classList.remove("col-md-4");
        document.getElementById("walletConnectOption").classList.add("col-md-6");

        document.getElementById("ledgerOption").style.display = "none";
    }
}

var onLedgerInputChange = async (value) => {
    if (value == 0) {
        DappObject.isAvax = false;
    } else if (value == 1) {
        DappObject.isAvax = true;
    }
}

function setInjectedInfo(info, provider) {
    if (!provider) {
        return
    } else {
        document.getElementById("injectedProviderName").innerText = info.name;

        document.getElementById("injectedProviderIcon").innerHTML = `<img src="${info.icon}" alt="${info.name}" />`;
    }
}

async function setupInjectedProviderOption() {
    var $select = $('#chosenProvider').selectize({
        maxItems: 1,
        valueField: 'id',
        labelField: 'title',
        searchField: ["title"],
        render: {
            item: function (item, escape) {
                return (
                "<div>" +
                (item.title
                    ? `<span class="addr-wrap">` + escape(item.title) + "</span>"
                    : "") +
                "</div>"
                );
            },
            option: function (item, escape) {
                var label = item.title;
                return (
                "<div>" +
                '<span class="connect-wallet-text">' +
                escape(label) +
                "</span>" +
                "</div>"
                );
            },
        },
        onChange: function(value) {
            onInjectedInputChange(value);
        },
        create: false,
        dropdownParent: "body",
    });

    var control = $select[0].selectize;

    control.clearOptions();

    return control;
}

var onInjectedInputChange = async (value) => {
    if (DappObject.providerList.length > 0) {
        injectedProvider = DappObject.providerList[value].provider;

        setInjectedInfo(DappObject.providerList[value].info, DappObject.providerList[value].provider);
    }
}

async function eip6963Listener(event) {
    DappObject.providerList = [...new Set(DappObject.providerList)];

    let count;

    if (DappObject.providerList.length <= 0) {
        // if there is only 1 Provider, we do not show the dropdown
        count = DappObject.providerList.push(event.detail);

        onInjectedInputChange(0);
    } else if (DappObject.providerList.length == 1) {
        // if there are 2 Providers, we inject both into the dropdown
        injectedProviderDropdown = await setupInjectedProviderOption();

        count = DappObject.providerList.push(event.detail);

        injectedProviderDropdown.addOption({
            id: count - 1,
            title: DappObject.providerList[count - 1].info.name,
        });

        injectedProviderDropdown.addOption({
            id: count - 2,
            title: DappObject.providerList[count - 2].info.name,
        });

        injectedProviderDropdown.setValue([count - 1]);
    } else {
        // if there are > 2 Providers, we inject the new provider into the dropdown
        count = DappObject.providerList.push(event.detail);

        injectedProviderDropdown.addOption({
            id: count - 1,
            title: DappObject.providerList[count - 1].info.name,
        });

        injectedProviderDropdown.setValue([count - 1]);
    }
}

// INIT

window.dappInit = async (option, stakingOption) => {

    closeCurrentPopup();

    document.getElementById("currentWallet")?.addEventListener("click", (event) => {

        if (event.target === document.getElementById("currentWalletPopup") || event.target === document.getElementById("currentWalletPopupText")) {
            return;
        }

        document.getElementById("currentWalletPopup").classList.toggle("showing");
    });

    clearTimeout(DappObject.latestPopupTimeoutId);

    checkConnection();

    window.dappOption = option;

    window.dappStakingOption = stakingOption;

    if (("usb" in navigator) && !("hid" in navigator) || ("usb" in navigator) && ("hid" in navigator)) {
        window.chosenNavigator = navigator.usb;
    } else if (("hid" in navigator) && !("usb" in navigator)) {
        window.chosenNavigator = navigator.hid;
    }

    if (("usb" in navigator) || ("hid" in navigator)) {
        // USB Connect Event

        chosenNavigator?.addEventListener('connect', async event => {
            // console.log("Connected!");
            if ((dappOption === 4 && typeof dappStakingOption === 'undefined') || (dappOption === 4 && dappStakingOption === 4) || DappObject.isHandlingOperation === true) {
                
            } else {
                await handleTransportConnect(chosenNavigator, DappObject, dappOption, dappStakingOption);
            }
        });

        // USB Disconnect Event
            
        chosenNavigator?.addEventListener('disconnect', async event => {
            // console.log("Disconnected!");
            if ((dappOption === 4 && typeof dappStakingOption === 'undefined') || (dappOption === 4 && dappStakingOption === 4) || DappObject.isHandlingOperation === true) {
                
            } else {
                await handleTransportConnect(chosenNavigator, DappObject, dappOption, dappStakingOption);
            }
        });
    }

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

                document.getElementById("ConnectWallet")?.addEventListener("click", handleClick = async () => {
                    ConnectWalletClick(object.rpcUrl, object.flrAddr, DappObject, (dappOption - 1), handleClick);
                });
            
                // We check if the input is valid, then copy it to the wrapped tokens section.
                document.querySelector("#AmountFrom")?.addEventListener("input", function () {
                    setWrapButton(DappObject);
                    copyWrapInput();
                });
            
                document.getElementById("wrapUnwrap")?.addEventListener("click", async () => {
                    toggleWrapButton(DappObject, object.tokenIdentifier, object.wrappedTokenIdentifier, object.rpcUrl, object.flrAddr);
                });
            
                // If the input is valid, we wrap on click of "WrapButton".
                document.getElementById("WrapButton")?.addEventListener("click", async () => {
                    if (DappObject.isRealValue === false) {
                        await setCurrentPopup('You need to enter a valid value: a number that is not greater than your balance.', true);
                    } else {
                        DappObject.isHandlingOperation = true;

                        var web32 = new Web3(object.rpcUrl);
            
                        try {
                            const wrappedTokenAddr = await GetContract("WNat", object.rpcUrl, object.flrAddr);
                            let tokenContract = new web32.eth.Contract(DappObject.ercAbi, wrappedTokenAddr);
                            const account = DappObject.selectedAddress;
                            let balance = await web32.eth.getBalance(account);
                            let tokenBalance = await tokenContract.methods.balanceOf(account).call();
                            var amountFrom = document.getElementById("AmountFrom");
                            var amountTo = document.getElementById("AmountTo");
                            const amountFromValue = parseFloat(amountFrom.value);

                            if (!isNumber(amountFromValue)) {
                                await setCurrentPopup('The value you have entered is not a number!', true);
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
                                    await setCurrentPopup('You do not have enough native tokens!', true);
                                } else if (DappObject.wrapBool === false && amountFromValueWeiBN > tokenBalance) {
                                    await setCurrentPopup('You do not have enough wrapped tokens!', true);
                                } else {
                                    if (typeof amountFrom !== 'undefined' && amountFrom != null && typeof amountTo !== 'undefined' && amountTo != null) {
                                        amountFrom.value = "";
                                        amountTo.value = "";
                                    }

                                    if (DappObject.walletIndex === 1) {
                                        await LedgerEVMSingleSign(transactionParameters, DappObject, undefined, false, object, 0);
                                    } else if (DappObject.walletIndex === 0) {
                                        showSpinner(async () => {
                                            await injectedProvider.request({
                                                method: 'eth_sendTransaction',
                                                params: [transactionParameters],
                                            })
                                            .then(txHash => showConfirmationSpinner(txHash, web32, object, DappObject, 0))
                                            .catch((error) => showFail(object, DappObject, 0));
                                        });
                                    } else if (DappObject.walletIndex === 2) {
                                        showSpinner(async () => {
                                            await DappObject.walletConnectEVMProvider.request({
                                                method: 'eth_sendTransaction',
                                                params: [transactionParameters],
                                            })
                                            .then(txHash => showConfirmationSpinner(txHash, web32, object, DappObject, 0))
                                            .catch((error) => showFail(object, DappObject, 0));
                                        });
                                    }

                                    DappObject.isHandlingOperation = false;

                                    setWrapButton(DappObject);
                                }
                            }
                        } catch (error) {
                            // console.log(error);

                            DappObject.isHandlingOperation = false;

                            // showFail();
                        }
                    }
                });

                if (DappObject.ledgerSelectedIndex !== "") {
                    ConnectWalletClick(object.rpcUrl, object.flrAddr, DappObject, 0, undefined, undefined, DappObject.selectedAddress, DappObject.ledgerSelectedIndex);
                } else {
                    document.getElementById("ConnectWallet")?.click();
                }

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
                object.tokenIdentifier = selectedNetwork?.options[selectedNetwork.selectedIndex]?.innerHTML;
                object.wrappedTokenIdentifier = "W" + object.tokenIdentifier;
                showTokenIdentifiers(object.tokenIdentifier, object.wrappedTokenIdentifier);
                setWrapButton(DappObject);

                //When Selected Network Changes, alert Metamask
                selectedNetwork.onchange = async () => {
                    object.rpcUrl = selectedNetwork?.options[selectedNetwork.selectedIndex].getAttribute('data-rpcurl');
                    object.chainIdHex = selectedNetwork?.options[selectedNetwork.selectedIndex].getAttribute('data-chainidhex');
                    object.networkValue = selectedNetwork?.options[selectedNetwork.selectedIndex].value;

                    DappObject.selectedNetworkIndex = Number(object.networkValue);

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

                    object.tokenIdentifier = selectedNetwork?.options[selectedNetwork.selectedIndex]?.innerHTML;
                    object.wrappedTokenIdentifier = "W" + object.tokenIdentifier;
                    showTokenIdentifiers(object.tokenIdentifier, object.wrappedTokenIdentifier);
                    DappObject.wrapBool = false;
                    wrapUnwrapButton.value = "false";
                    fromIcon.style.color = "#fd000f";
                    toIcon.style.color = "#000";
                    document.getElementById("Wrap").style.color = "#fd000f";
                    document.getElementById("Unwrap").style.color = "#383a3b";
                    document.getElementById("wrapUnwrap")?.click();

                    clearTimeout(DappObject.latestPopupTimeoutId);

                    // Alert Metamask to switch.
                    try {
                        if (DappObject.walletIndex === 0) {
                            const realChainId = await injectedProvider.request({method: 'eth_chainId'});

                            if (realChainId != object.chainIdHex) {
                                await injectedProvider.request({
                                    method: "wallet_switchEthereumChain",
                                    params: [
                                        {
                                        "chainId": object.chainIdHex
                                        }
                                    ]
                                    }).catch(async (error) => {
                                        if (error.code === 4902) {
                                            try {
                                                await injectedProvider.request({
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
                                    });
                            }
                        } else if (DappObject.walletIndex === 2) {
                            const realChainId = await DappObject.walletConnectEVMProvider.request({method: 'eth_chainId'});

                            if (realChainId != object.chainIdHex) {
                                await DappObject.walletConnectEVMProvider.request({
                                    method: "wallet_switchEthereumChain",
                                    params: [
                                        {
                                        "chainId": object.chainIdHex
                                        }
                                    ]
                                    }).catch(async (error) => {
                                        if (error.code === 4902) {
                                            try {
                                                await DappObject.walletConnectEVMProvider.request({
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
                                    });
                            }
                        }

                        ConnectWalletClick(object.rpcUrl, object.flrAddr, DappObject, 0, undefined, undefined, DappObject.selectedAddress, DappObject.ledgerSelectedIndex);
                    } catch (error) {
                        // console.log(error);
                    }
                    
                    setWrapButton(DappObject);
                }

                if (DappObject.walletIndex === 0) {
                    injectedProvider.on("accountsChanged", async (accounts) => {
                        handleAccountsChanged(accounts, DappObject, dappOption, undefined, object.rpcUrl, object.flrAddr);
                    });

                    injectedProvider.on("chainChanged", async () => {
                        handleChainChanged(DappObject);
                    });
                } else if (DappObject.walletIndex === 2) {
                    DappObject.walletConnectEVMProvider.on("accountsChanged", async (accounts) => {
                        handleAccountsChanged(accounts, DappObject, dappOption, undefined, object.rpcUrl, object.flrAddr);
                    });

                    DappObject.walletConnectEVMProvider.on("chainChanged", async () => {
                        handleChainChanged(DappObject);
                    });

                    DappObject.walletConnectEVMProvider.on("disconnect", async () => {
                        getDappPage(4);
                    });
                }
            });
        });
    } else if (option === 2 || option === '2') {
        let selectedNetwork = document.getElementById("SelectedNetwork");
        let rpcUrl;
        let chainidhex;
        let networkValue;

        await createSelectedNetwork(DappObject).then( async () => {
            getSelectedNetwork(rpcUrl, chainidhex, networkValue).then(async (object) => {

                document.getElementById("ConnectWallet")?.addEventListener("click", handleClick = async () => {
                    ConnectWalletClick(object.rpcUrl, object.flrAddr, DappObject, (option - 1), handleClick);
                });
            
                document.getElementById("Amount1")?.addEventListener('input', async function () {
                    await isDelegateInput1(DappObject);
            
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
            
                document.getElementById("ClaimButton")?.addEventListener("click", async () => {
                    let web32 = new Web3(object.rpcUrl);

                    DappObject.isHandlingOperation = true;
            
                    try {
                        const wrappedTokenAddr = await GetContract("WNat", object.rpcUrl, object.flrAddr);
                        let tokenContract = new web32.eth.Contract(DappObject.ercAbi, wrappedTokenAddr);
                        const account = DappObject.selectedAddress;
            
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
            
                            if (delegatedFtsos.length === 2 || delegatedBips === 100 || document.getElementById("ClaimButton").innerText === "Undelegate All") {
                                showAlreadyDelegated(ftsoNames, object, DappObject);
                            } else {
                                delegate(object, DappObject);
                            }

                            DappObject.isHandlingOperation = false;
                        });
                    } catch(error) {
                        DappObject.isHandlingOperation = false;

                        // console.log(error);
                    }
                });

                if (DappObject.ledgerSelectedIndex !== "") {
                    ConnectWalletClick(object.rpcUrl, object.flrAddr, DappObject, 1, undefined, undefined, DappObject.selectedAddress, DappObject.ledgerSelectedIndex);
                } else {
                    document.getElementById("ConnectWallet")?.click();
                }

                await isDelegateInput1(DappObject);

                selectedNetwork.onchange = async () => {
                    object.rpcUrl = selectedNetwork?.options[selectedNetwork.selectedIndex]?.getAttribute('data-rpcurl');
                    object.chainIdHex = selectedNetwork?.options[selectedNetwork.selectedIndex]?.getAttribute('data-chainidhex');
                    object.networkValue = selectedNetwork?.options[selectedNetwork.selectedIndex]?.value;

                    DappObject.selectedNetworkIndex = Number(object.networkValue);

                    clearTimeout(DappObject.latestPopupTimeoutId);

                    // Alert Metamask to switch.
                    try {
                        if (DappObject.walletIndex === 0) {
                            const realChainId = await injectedProvider.request({method: 'eth_chainId'});

                            if (realChainId != object.chainIdHex) {
                                await injectedProvider.request({
                                    method: "wallet_switchEthereumChain",
                                    params: [
                                        {
                                        "chainId": object.chainIdHex
                                        }
                                    ]
                                }).catch(async (error) => {
                                    if (error.code === 4902) {
                                        try {
                                            await injectedProvider.request({
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
                                });
                            }                    
                        } else if (DappObject.walletIndex === 2) {
                            const realChainId = await DappObject.walletConnectEVMProvider.request({method: 'eth_chainId'});

                            if (realChainId != object.chainIdHex) {

                                await DappObject.walletConnectEVMProvider.request({
                                    method: "wallet_switchEthereumChain",
                                    params: [
                                        {
                                        "chainId": object.chainIdHex
                                        }
                                    ]
                                    }).catch(async (error) => {
                                        if (error.code === 4902) {
                                            try {
                                                await DappObject.walletConnectEVMProvider.request({
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
                                    });
                            }
                        }

                        ConnectWalletClick(object.rpcUrl, object.flrAddr, DappObject, 1, undefined, undefined, DappObject.selectedAddress, DappObject.ledgerSelectedIndex);
                    } catch (error) {
                        // console.log(error);
                    }
                };
                if (DappObject.walletIndex === 0) {
                    injectedProvider.on("accountsChanged", async (accounts) => {
                        handleAccountsChanged(accounts, DappObject, dappOption, undefined, object.rpcUrl, object.flrAddr);
                    });

                    injectedProvider.on("chainChanged", async () => {
                        handleChainChanged(DappObject);
                    });
                } else if (DappObject.walletIndex === 2) {
                    DappObject.walletConnectEVMProvider.on("accountsChanged", async (accounts) => {
                        handleAccountsChanged(accounts, DappObject, dappOption, undefined, object.rpcUrl, object.flrAddr);
                    });

                    DappObject.walletConnectEVMProvider.on("chainChanged", async () => {
                        handleChainChanged(DappObject);
                    });

                    DappObject.walletConnectEVMProvider.on("disconnect", async () => {
                        getDappPage(4);
                    });
                }
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

                document.getElementById("ConnectWallet")?.addEventListener("click", handleClick = async () => {
                    ConnectWalletClick(object.rpcUrl, object.flrAddr, DappObject, (option - 1), handleClick);
                });
            
                document.getElementById("ClaimButton")?.addEventListener("click", async () => {
                    if (DappObject.claimBool === true) {
                        DappObject.isHandlingOperation = true;

                        let web32 = new Web3(object.rpcUrl);
                        var checkBox = document.getElementById("RewardsCheck");
            
                        try {
                            const account = DappObject.selectedAddress;
                            const wrappedTokenAddr = await GetContract("WNat", object.rpcUrl, object.flrAddr);
                            let tokenContract = new web32.eth.Contract(DappObject.ercAbi, wrappedTokenAddr);
                            const ftsoRewardAddr = await GetContract("FtsoRewardManager", object.rpcUrl, object.flrAddr);
                            let ftsoRewardContract = new web32.eth.Contract(DappObject.ftsoRewardAbiLocal, ftsoRewardAddr);

                            let rewardManagerAddr = await GetContract("RewardManager", object.rpcUrl, object.flrAddr);

                            // @TODO TO BE REMOVED - PATCH RewardManager address not updated in Registry Contract 2024-10-20.
                            if (object.rpcUrl.includes("sgb")) {
                                rewardManagerAddr = "0x8A80583BD5A5Cd8f68De585163259D61Ea8dc904"
                            }
                            
                            let rewardManagerContract;
                            const systemsManagerAddr = await GetContract("FlareSystemsManager", object.rpcUrl, object.flrAddr);
                            let flareSystemsManagerContract = new web32.eth.Contract(DappObject.systemsManagerAbiLocal, systemsManagerAddr);

                            let rewardClaimWithProofStructs = [];

                            let v2RewardEpochId;

                            if (rewardManagerAddr) {
                                try {
                                    rewardManagerContract = new web32.eth.Contract(DappObject.rewardManagerAbiLocal, rewardManagerAddr);

                                    let v2RewardEpochArray = await rewardManagerContract.methods.getRewardEpochIdsWithClaimableRewards().call();

                                    v2RewardEpochId = v2RewardEpochArray._endEpochId;

                                    if (DappObject.hasFtsoRewards) {
                                        let network;
        
                                        if (object.rpcUrl.includes("flr")) {
                                            network = "flare";
                                        } else if (object.rpcUrl.includes("sgb")) {
                                            network = "songbird";
                                        }
        
                                        rewardClaimWithProofStructs = await getRewardClaimWithProofStructs(network, account, undefined, flareSystemsManagerContract, rewardManagerContract);
                                    }
                                } catch (error) {
                                    // console.log(error);
                                }
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
                                                data: rewardManagerContract.methods.claim(account, account, String(v2RewardEpochId), true, rewardClaimWithProofStructs).encodeABI(),
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
                                                data: rewardManagerContract.methods.claim(account, account, String(v2RewardEpochId), false, rewardClaimWithProofStructs).encodeABI(),
                                            };
                                        }
                                    }
                                }
                                
                                const transactionParameters = txPayload;

                                let txHashes = [];

                                if (DappObject.hasV1Rewards === true && DappObject.hasV2Rewards === false) {
                                    if (DappObject.walletIndex === 1) {
                                        await LedgerEVMSingleSign(transactionParameters, DappObject, undefined, false, object, 2);
                                    } else if (DappObject.walletIndex === 0) {
                                        showSpinner(async () => {
                                            await injectedProvider.request({
                                                method: 'eth_sendTransaction',
                                                params: [transactionParameters],
                                            })
                                            .then(txHash => showConfirmationSpinner(txHash, web32, object, DappObject, 2))
                                            .catch((error) => showFail(object, DappObject, 2));
                                        });
                                    } else if (DappObject.walletIndex === 2) {
                                        showSpinner(async () => {
                                            await DappObject.walletConnectEVMProvider.request({
                                                method: 'eth_sendTransaction',
                                                params: [transactionParameters],
                                            })
                                            .then(txHash => showConfirmationSpinner(txHash, web32, object, DappObject, 2))
                                            .catch((error) => showFail(object, DappObject, 2));
                                        });
                                    }
                                } else if (DappObject.hasV1Rewards === false && DappObject.hasV2Rewards === true && typeof rewardManagerContract !== "undefined") {
                                    const transactionParametersV2 = txPayloadV2;

                                    if (DappObject.walletIndex === 1) {
                                        await LedgerEVMSingleSign(transactionParametersV2, DappObject, undefined, false, object, 2);
                                    } else if (DappObject.walletIndex === 0) {
                                        showSpinner(async () => {
                                            await injectedProvider.request({
                                                method: 'eth_sendTransaction',
                                                params: [transactionParametersV2],
                                            })
                                            .then(txHash => showConfirmationSpinner(txHash, web32, object, DappObject, 2))
                                            .catch((error) => showFail(object, DappObject, 2));
                                        });
                                    } else if (DappObject.walletIndex === 2) {
                                        showSpinner(async () => {
                                            await DappObject.walletConnectEVMProvider.request({
                                                method: 'eth_sendTransaction',
                                                params: [transactionParametersV2],
                                            })
                                            .then(txHash => showConfirmationSpinner(txHash, web32, object, DappObject, 2))
                                            .catch((error) => showFail(object, DappObject, 2));
                                        });
                                    }
                                } else if (DappObject.hasV1Rewards === true && DappObject.hasV2Rewards === true && typeof rewardManagerContract !== "undefined") {
                                    const transactionParametersV2 = txPayloadV2;

                                    if (DappObject.walletIndex === 1) {
                                        await LedgerEVMFtsoV2Sign(transactionParameters, transactionParametersV2, DappObject, object, 2, txHashes);
                                    } else if (DappObject.walletIndex === 0) {
                                        showConfirmationSpinnerv2(async (v2Spinner) => {
                                            try {
                                                await injectedProvider.request({
                                                    method: 'eth_sendTransaction',
                                                    params: [transactionParameters],
                                                })
                                                .then(txHash => {
                                                    txHashes[0] = txHash;
                                                    checkTx(txHash, web32, undefined, object, DappObject, 2, true).then(result => {
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
                                                                    showFail(object, DappObject, 2);
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
                                                            await injectedProvider.request({
                                                                method: 'eth_sendTransaction',
                                                                params: [transactionParametersV2],
                                                            }).then(txHashV2 => {
                                                                txHashes[1] = txHashV2;
                                                                checkTx(txHashV2, web32, undefined, object, DappObject, 2, true).then(receipt => {
                                                                    switch (receipt) {
                                                                        case "Success":
                                                                            v2Spinner.$content.find('#v2TxStatus').html('Confirmed');
                                                                            v2Spinner.$content.find('#v2TxIcon').removeClass();
                                                                            v2Spinner.$content.find('#v2TxIcon').addClass("fa fa-solid fa-check");
                                                                            v2Spinner.close();
                                                                            showConfirm(txHashes[0] + "<br/>" + txHashes[1], object, DappObject, 2);
                                                                            break
                                                                        case "Fail":
                                                                            v2Spinner.$content.find('#v2TxStatus').html('Failed');
                                                                            v2Spinner.$content.find('#v2TxIcon').removeClass();
                                                                            v2Spinner.$content.find('#v2TxIcon').addClass("fa fa-warning");
                                                                            v2Spinner.close();
                                                                            showFail(object, DappObject, 2);
                                                                            break
                                                                        case "Unknown":
                                                                            v2Spinner.$content.find('#v2TxStatus').html('Unknown');
                                                                            v2Spinner.$content.find('#v2TxIcon').removeClass();
                                                                            v2Spinner.$content.find('#v2TxIcon').addClass("fa fa-warning");
                                                                            v2Spinner.close();
                                                                            showFail(object, DappObject, 2);
                                                                            break
                                                                    }
                                                                });
                                                            });
                                                        }
                                                    })
                                                });
                                            } catch (error) {
                                                v2Spinner.close();

                                                showFail(object, DappObject, 2);
                                            }
                                        });
                                    } else if (DappObject.walletIndex === 2) {
                                        showConfirmationSpinnerv2(async (v2Spinner) => {
                                            try {
                                                await DappObject.walletConnectEVMProvider.request({
                                                    method: 'eth_sendTransaction',
                                                    params: [transactionParameters],
                                                })
                                                .then(txHash => {
                                                    txHashes[0] = txHash;
                                                    checkTx(txHash, web32, undefined, object, DappObject, 2, true).then(result => {
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
                                                                    showFail(object, DappObject, 2);
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
                                                            await DappObject.walletConnectEVMProvider.request({
                                                                method: 'eth_sendTransaction',
                                                                params: [transactionParametersV2],
                                                            }).then(txHashV2 => {
                                                                txHashes[1] = txHashV2;
                                                                checkTx(txHashV2, web32, undefined, object, DappObject, 2, true).then(receipt => {
                                                                    switch (receipt) {
                                                                        case "Success":
                                                                            v2Spinner.$content.find('#v2TxStatus').html('Confirmed');
                                                                            v2Spinner.$content.find('#v2TxIcon').removeClass();
                                                                            v2Spinner.$content.find('#v2TxIcon').addClass("fa fa-solid fa-check");
                                                                            v2Spinner.close();
                                                                            showConfirm(txHashes[0] + "<br/>" + txHashes[1], object, DappObject, 2);
                                                                            break
                                                                        case "Fail":
                                                                            v2Spinner.$content.find('#v2TxStatus').html('Failed');
                                                                            v2Spinner.$content.find('#v2TxIcon').removeClass();
                                                                            v2Spinner.$content.find('#v2TxIcon').addClass("fa fa-warning");
                                                                            v2Spinner.close();
                                                                            showFail(object, DappObject, 2);
                                                                            break
                                                                        case "Unknown":
                                                                            v2Spinner.$content.find('#v2TxStatus').html('Unknown');
                                                                            v2Spinner.$content.find('#v2TxIcon').removeClass();
                                                                            v2Spinner.$content.find('#v2TxIcon').addClass("fa fa-warning");
                                                                            v2Spinner.close();
                                                                            showFail(object, DappObject, 2);
                                                                            break
                                                                    }
                                                                });
                                                            });
                                                        }
                                                    })
                                                });
                                            } catch (error) {
                                                v2Spinner.close();

                                                showFail(object, DappObject, 2);
                                            }
                                        });
                                    }
                                }

                                DappObject.hasV1Rewards = false;

                                DappObject.hasV2Rewards = false;

                                const tokenBalance = await tokenContract.methods.balanceOf(account).call();
                                
                                showClaimRewards(0);
                                switchClaimButtonColorBack(DappObject.claimBool);
                                showTokenBalance(round(web32.utils.fromWei(tokenBalance, "ether")));

                                DappObject.isHandlingOperation = false;
                            } else {
                                DappObject.isHandlingOperation = false;

                                await setCurrentPopup('The Rewards Bucket is empty! Please try again later.', true);
                            }
                        } catch (error) {
                            DappObject.isHandlingOperation = false;

                            // console.log(error);
                        }
                    }
                });
            
                document.getElementById("ClaimFdButton")?.addEventListener("click", async () => {
                    if (DappObject.fdClaimBool === true) {
                        DappObject.isHandlingOperation = true;

                        let web32 = new Web3(object.rpcUrl);
                        var checkBox = document.getElementById("RewardsCheck");
            
                        try {
                            const account = DappObject.selectedAddress;
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

                                if (DappObject.walletIndex === 1) {
                                    await LedgerEVMSingleSign(transactionParameters, DappObject, undefined, false, object, 2);
                                } else if (DappObject.walletIndex === 0) {
                                    showSpinner(async () => {
                                        await injectedProvider.request({
                                            method: 'eth_sendTransaction',
                                            params: [transactionParameters],
                                        })
                                        .then(txHash => showConfirmationSpinner(txHash, web32, object, DappObject, 2))
                                        .catch((error) => showFail(object, DappObject, 2));
                                    });
                                } else if (DappObject.walletIndex === 2) {
                                    showSpinner(async () => {
                                        await DappObject.walletConnectEVMProvider.request({
                                            method: 'eth_sendTransaction',
                                            params: [transactionParameters],
                                        })
                                        .then(txHash => showConfirmationSpinner(txHash, web32, object, DappObject, 2))
                                        .catch((error) => showFail(object, DappObject, 2));
                                    });
                                }
                                
                                const tokenBalance = await tokenContract.methods.balanceOf(account).call();

                                DappObject.isHandlingOperation = false;
                                
                                showFdRewards(0);
                                switchClaimFdButtonColorBack(DappObject.fdClaimBool);
                                showTokenBalance(round(web32.utils.fromWei(tokenBalance, "ether")));
                            }
                        } catch (error) {
                            DappObject.isHandlingOperation = false;

                            // console.log(error);
                        }
                    }
                });

                if (DappObject.ledgerSelectedIndex !== "") {
                    ConnectWalletClick(object.rpcUrl, object.flrAddr, DappObject, 2, undefined, undefined, DappObject.selectedAddress, DappObject.ledgerSelectedIndex);
                } else {
                    document.getElementById("ConnectWallet")?.click();
                }

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

                    DappObject.selectedNetworkIndex = Number(object.networkValue);

                    clearTimeout(DappObject.latestPopupTimeoutId);

                    if (object.networkValue === '1') {
                        document.getElementById("layer3").innerHTML = DappObject.flrLogo;
                    } else if (object.networkValue === '2') {
                        document.getElementById("layer3").innerHTML = DappObject.sgbLogo;
                    } else {
                        document.getElementById("layer3").innerHTML = DappObject.costonLogo;
                    }
                    
                    object.tokenIdentifier = selectedNetwork?.options[selectedNetwork.selectedIndex]?.innerHTML;
                    object.wrappedTokenIdentifier = "W" + object.tokenIdentifier;
                    showTokenIdentifiers(null, object.wrappedTokenIdentifier);

                    // Alert Metamask to switch.
                    try {
                        if (DappObject.walletIndex === 0) {
                            const realChainId = await injectedProvider.request({method: 'eth_chainId'});

                            if (realChainId != object.chainIdHex) {
                                await injectedProvider.request({
                                    method: "wallet_switchEthereumChain",
                                    params: [
                                        {
                                        "chainId": object.chainIdHex
                                        }
                                    ]
                                }).catch(async (error) => {
                                    if (error.code === 4902) {
                                        try {
                                            await injectedProvider.request({
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
                                });
                            }
                        } else if (DappObject.walletIndex === 2) {
                            const realChainId = await DappObject.walletConnectEVMProvider.request({method: 'eth_chainId'});

                            if (realChainId != object.chainIdHex) {
                                await DappObject.walletConnectEVMProvider.request({
                                    method: "wallet_switchEthereumChain",
                                    params: [
                                        {
                                        "chainId": object.chainIdHex
                                        }
                                    ]
                                    }).catch(async (error) => {
                                        if (error.code === 4902) {
                                            try {
                                                await DappObject.walletConnectEVMProvider.request({
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
                                    });
                            }
                        }

                        ConnectWalletClick(object.rpcUrl, object.flrAddr, DappObject, 2, undefined, undefined, DappObject.selectedAddress, DappObject.ledgerSelectedIndex);
                    } catch (error) {
                        // console.log(error);
                    }
                };

                if (DappObject.walletIndex === 0) {
                    injectedProvider.on("accountsChanged", async (accounts) => {
                        handleAccountsChanged(accounts, DappObject, dappOption, undefined, object.rpcUrl, object.flrAddr);
                    });

                    injectedProvider.on("chainChanged", async () => {
                        handleChainChanged(DappObject);
                    });
                } else if (DappObject.walletIndex === 2) {
                    DappObject.walletConnectEVMProvider.on("accountsChanged", async (accounts) => {
                        handleAccountsChanged(accounts, DappObject, dappOption, undefined, object.rpcUrl, object.flrAddr);
                    });

                    DappObject.walletConnectEVMProvider.on("chainChanged", async () => {
                        handleChainChanged(DappObject);
                    });

                    DappObject.walletConnectEVMProvider.on("disconnect", async () => {
                        getDappPage(4);
                    });
                }
            });
        });
    } else if (option === 4 || option === '4') {

        if (stakingOption !== undefined && stakingOption !== 4 && stakingOption !== 5) {
            // switch to Flare
            if (DappObject.walletIndex === 0) {
                try {
                    await injectedProvider.request({
                        method: "wallet_switchEthereumChain",
                        params: [
                            {
                            "chainId": "0xe"
                            }
                        ]
                        }).catch((error) => {
                            throw error
                        });
                } catch (error) {
                    // console.log(error);

                    if (error.code === 4902) {
                        try {
                            await injectedProvider.request({
                                method: 'wallet_addEthereumChain',
                                params: [
                                    {
                                        "chainId": "0xe",
                                        "rpcUrls": ["https://sbi.flr.ftsocan.com/ext/C/rpc"],
                                        "chainName": `Flare Mainnet`,
                                        "iconUrls": [
                                            `https://portal.flare.network/token-logos/FLR.svg`
                                        ],
                                        "nativeCurrency": {
                                            "name": `FLR`,
                                            "symbol": `FLR`,
                                            "decimals": 18
                                        }
                                    },
                                ],
                            });
                        } catch (error) {
                            getDappPage(1);
                        }
                    }
                }
            } else if (DappObject.walletIndex === 2) {
                try {
                    await DappObject.walletConnectEVMProvider.request({
                        method: "wallet_switchEthereumChain",
                        params: [
                            {
                            "chainId": "0xe"
                            }
                        ]
                        }).catch((error) => console.error(error));
                } catch (error) {
                    // console.log(error);

                    if (error.code === 4902) {
                        try {
                            await injectedProvider.request({
                                method: 'wallet_addEthereumChain',
                                params: [
                                    {
                                        "chainId": "0xe",
                                        "rpcUrls": ["https://sbi.flr.ftsocan.com/ext/C/rpc"],
                                        "chainName": `Flare Mainnet`,
                                        "iconUrls": [
                                            `https://portal.flare.network/token-logos/FLR.svg`
                                        ],
                                        "nativeCurrency": {
                                            "name": `FLR`,
                                            "symbol": `FLR`,
                                            "decimals": 18
                                        }
                                    },
                                ],
                            });
                        } catch (error) {
                            getDappPage(1);
                        }
                    }
                }
            }
        }

        var handleClick;

        if (typeof stakingOption === 'undefined') {
            try {
                // Network is Flare by default.
                DappObject.selectedNetworkIndex = 1;

                // We say that the account is connected so that we can navigate from page to page.
                DappObject.isAccountConnected = true;

                // Setup the Ledger App dropdown
                DappObject.isAvax = false;

                await setupLedgerOption();

                // Reset the injected Provider settings
                injectedProviderDropdown = undefined;

                DappObject.providerList = [];

                injectedProvider = window.ethereum;

                document.getElementById("chosenProvider").style.display = "none";

                window.removeEventListener('eip6963:announceProvider', eip6963Listener);

                // listen for the EIP-6963 events emitted by Providers
                window.addEventListener('eip6963:announceProvider', eip6963Listener);
            
                window.dispatchEvent(new CustomEvent('eip6963:requestProvider'));

                await resetDappObjectState(DappObject);

                DappObject.walletIndex = -1;

                document.getElementById("ContinueMetamask")?.addEventListener("click", async () => {
                    getDappPage(8);
                });
                document.getElementById("ContinueLedger")?.addEventListener("click", async () => {
                    getDappPage(9);
                });
                document.getElementById("ContinueWalletConnect")?.addEventListener("click", async () => {
                    DappObject.walletIndex = 2;
                    DappObject.walletConnectEVMProvider = await walletConnectProvider.init(walletConnectEVMParams);
                    getDappPage(1);
                });

                await setCurrentAppState("Null");

                await setCurrentPopup("Hi! I'm Mabel. And I'll be your virtual assistant to guide you, and to help you efficiently claim your FLR or SGB rewards!", true);

                clearTimeout(DappObject.latestPopupTimeoutId);

                DappObject.latestPopupTimeoutId = setTimeout( async () => {
                    await setCurrentPopup(`First, choose a wallet! If you have a Ledger device, please choose Ledger. If your wallet is stored within ${DappObject.providerList[0].info.name}, please choose the ${DappObject.providerList[0].info.name} option. More coming soon!`, true);
                }, 9000);
            } catch (error) {
                // console.log(error);
            }
        } else if (stakingOption === 4) {
            //Metamask
            DappObject.isAccountConnected = true;

            await setCurrentAppState("Null");

            document.getElementById("ContinueAnyway")?.addEventListener("click", async () => {
                DappObject.walletIndex = 0;
                getDappPage(1);
            });

            document.getElementById("GoBack")?.addEventListener("click", async () => {
                getDappPage(4);
            });

            await setCurrentPopup("To use the FTSOCAN DApp's staking features, you must turn on eth_sign in Metamask.", true);
        } else if (stakingOption === 5) {
            //Ledger
            DappObject.isAccountConnected = true;

            await setCurrentAppState("Null");

            if (!("usb" in navigator) && !("hid" in navigator)) {
                document.getElementById("ledgerContent").innerHTML = '<div class="top"><div class="wrap-box" style="height: auto !important; text-align: center !important; padding: 20px !important;"><div class="row"><div class="col-md-12"><span style="color: #383a3b; font-size: 25px; font-weight: bold;"><span class="fa fa-warning"></span> WARNING</span></div></div><div class="row"><div class="col-md-12"><span style="font-size: 12px;">Your browser does not currently support <i style="font-style: italic;">Ledger Transport</i> ! </br> Please switch to a compatible browser.</span></div></div></div></div><div class="row"><div class="col-sm-12"><button id="GoBack" class="connect-wallet" style="float: none; margin-left: auto; margin-right: auto;"><i class="connect-wallet-text" id="ConnectWalletText">Go Back</i></button></div></div>';

                await setCurrentPopup("Whoops! Your browser does not currently support Ledger Transport! You will need to use another wallet.", true);
            } else {
                let requiredApp;

                if (DappObject.isAvax === true) {
                    requiredApp = "Avalanche";

                    document.getElementById("appName").innerText = "Avalanche App";
                } else {
                    requiredApp = "Flare Network";

                    document.getElementById("appName").innerText = "Flare Network App";
                }

                await setCurrentAppState("Connecting");

                await getLedgerApp(requiredApp).then(async result => {
                    switch (result) {
                        case "Success":
                            await wait(3000);
    
                            await setCurrentAppState("Connected");

                            await setCurrentPopup("Connected!", false);

                            document.getElementById("ContinueAnyway")?.classList.add("connect-wallet");

                            document.getElementById("ContinueAnyway")?.classList.remove("claim-button");
    
                            document.getElementById("ContinueAnyway")?.addEventListener("click", async () => {
                                DappObject.walletIndex = 1;
                                getDappPage(1);
                            });
                            break
                        case "Failed: App not Installed":
                            await setCurrentAppState("Alert");
    
                            clearTimeout(DappObject.latestPopupTimeoutId);
    
                            DappObject.latestPopupTimeoutId = setTimeout( async () => {
                                await setCurrentPopup("Whoops! Looks like you do not have the " + requiredApp + " installed on your Ledger device! Please install it and come back again later!", true);
                            }, 1000);
    
                            throw new Error("Ledger Avalanche App not installed!");
                            break
                        case "Failed: User Rejected":
                            break
                    }
                });
            }

            document.getElementById("GoBack")?.addEventListener("click", async () => {
                getDappPage(4);
            });
        } else if (stakingOption === 1) {
            document.getElementById("ConnectPChain")?.addEventListener("click", handleClick = async () => {
                ConnectPChainClickStake(DappObject, handleClick);
            });

            if (DappObject.walletIndex === 0 || DappObject.walletIndex === 2 || (Array.isArray(DappObject.ledgerAddrArray) && DappObject.ledgerAddrArray.length)) {
                document.getElementById("ConnectPChain")?.click();
            }

            // We check if the input is valid, then copy it to the wrapped tokens section.
            document.querySelector("#AmountFrom")?.addEventListener("input", function () {
                setTransferButton(DappObject);
                copyWrapInput();
            });

            document.querySelector("#AmountTo")?.addEventListener("input", function () {
                setTransferButton2(DappObject);
                copyTransferInput();
            });

            document.getElementById("TransferIcon")?.addEventListener("click", async () => {
                toggleTransferButton(DappObject, stakingOption);
            });

            document.getElementById("WrapButton")?.addEventListener("click", async () => {
                transferTokens(DappObject, stakingOption);
            });
        } else if (stakingOption === 2) {

            document.getElementById("ConnectPChain")?.addEventListener("click", handleClick = async () => {
                ConnectPChainClickStake(DappObject, handleClick);
            });

            if (DappObject.walletIndex === 0 || DappObject.walletIndex === 2 || (Array.isArray(DappObject.ledgerAddrArray) && DappObject.ledgerAddrArray.length)) {
                document.getElementById("ConnectPChain")?.click();
            }

            document.getElementById("WrapButton")?.addEventListener("click", async () => {
                if (DappObject.isRealValue === false) {
                    await setCurrentPopup('Please enter a valid staking amount (more than 0).', true);
                } else {
                    stake(DappObject, stakingOption);
                }
            });
        } else if (stakingOption === 3) {
            document.getElementById("ConnectPChain")?.addEventListener("click", handleClick = async () => {
                ConnectPChainClickStake(DappObject, handleClick);
            });

            if (DappObject.walletIndex === 0 || DappObject.walletIndex === 2 || (Array.isArray(DappObject.ledgerAddrArray) && DappObject.ledgerAddrArray.length)) {
                document.getElementById("ConnectPChain")?.click();
            }

            document.getElementById("ClaimButton")?.addEventListener("click", async () => {
                if (DappObject.claimBool === true) {
                    claimStakingRewards(DappObject, stakingOption);
                }
            });
        }

        if (DappObject.walletIndex === 0) {
            injectedProvider.on("accountsChanged", async (accounts) => {
                handleAccountsChanged(accounts, DappObject, dappOption, stakingOption);
            });

            injectedProvider.on("chainChanged", async () => {
                handleChainChangedStake(DappObject);
            });
        } else if (DappObject.walletIndex === 2) {
            DappObject.walletConnectEVMProvider.on("accountsChanged", async (accounts) => {
                handleAccountsChanged(accounts, DappObject, dappOption, undefined, object.rpcUrl, object.flrAddr);
            });

            DappObject.walletConnectEVMProvider.on("chainChanged", async () => {
                handleChainChangedStake(DappObject);
            });

            DappObject.walletConnectEVMProvider.on("disconnect", async () => {
                getDappPage(4);
            });
        }
    }
};