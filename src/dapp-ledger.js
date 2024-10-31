import { GetContract, GetNetworkName, MMSDK, showAccountAddress, showBalance, showTokenBalance, FlareAbis, FlareLogos } from "./flare-utils";
import { ethers } from "./ethers.js";
import { wait, checkTx, checkTxStake } from "./dapp-utils.js";
import { showSpinner, showConfirmationSpinnerv2, showConfirmationSpinnerStake, showConfirm, showFail, showFailStake, setCurrentAppState, setCurrentPopup } from "./dapp-ui.js";
import { handleAccountsChanged } from "./dapp-wallet.js";

export async function LedgerEVMSingleSign(txPayload, DappObject, stakingOption, isStake = false, object, pageIndex) {
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

    if (typeof object !== "undefined" && GetNetworkName(object.rpcUrl) === "flare") {
        chainId = 14;
    } else if (typeof object !== "undefined" && GetNetworkName(object.rpcUrl) === "songbird") {
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

    await showSpinner(async () => {
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

export async function LedgerEVMFtsoV2Sign(txPayload, txPayloadV2, DappObject, object, pageIndex, txHashes) {
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

    if (typeof object !== "undefined" && GetNetworkName(object.rpcUrl) === "flare") {
        chainId = 14;
    } else if (typeof object !== "undefined" && GetNetworkName(object.rpcUrl) === "songbird") {
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

    await showConfirmationSpinnerv2(async (v2Spinner) => {
        try {
            await ledgerSignEVM(LedgerTxPayload, DappObject.ledgerSelectedIndex, ethersProvider).then(async signedTx => {
                ethersProvider.sendTransaction(signedTx).then(response => {
                    v2Spinner.$content.find('#v1TxStatus').html('Waiting for network confirmation...');

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
                                    v2Spinner.$content.find('#v2TxStatus').html('Waiting for network confirmation...');

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

export async function handleTransportConnect(chosenNavigator, DappObject, option, stakingOption) {
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