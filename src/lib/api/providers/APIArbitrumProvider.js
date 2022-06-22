import { toast } from "react-toastify";
import { ethers } from 'ethers';
import APIProvider from "./APIProvider";
import balanceBundleABI from "lib/contracts/BalanceBundle.json";

export default class APIArbitrumProvider extends APIProvider {
  balanceBundleAddress = '0x1b7ad12c73b9fea574cd2320650676c0a0bde8a0';

  accountState = {};
  ethWallet = {};
  evmCompatible = true;
  zksyncCompatible = false;
  balances = {};
  _tokenInfo = {};

  getAccountState = async () => {
    return this.accountState;
  };

  getBalances = async () => {
    if (!this.accountState.address) return {};

    // allways get ETH - generate token list     
    // const tokens = ['ETH'].concat(this.api.getCurrencies()); // TODO re-enable
    const tokens = ['ETH'];
    const tokenInfoList = [{ decimals: 18, }];
    const tokenList = [ethers.constants.AddressZero];

    for(let i = 1; i < tokens.length; i++) {
      const token = tokens[i];
      const tokenInfo = this.api.getCurrencyInfo(token);

      tokenInfoList.push(tokenInfo);
      tokenList.push(tokenInfo.address);
    }

    // get token balance
    const ethContract = new ethers.Contract(
      this.balanceBundleAddress,
      balanceBundleABI,
      this.api.ethersProvider
    );
    const balanceList = await ethContract.balances([this.accountState.address], tokenList);

    // generate object
    for(let i = 0; i < tokens.length; i++) {
      const balance = balanceList[i];
      const token = tokens[i];
      const currencyInfo = tokenInfoList[token];

      this.balances[tokens[i]] = {
        value: balance,
        valueReadable:
          (balance && currencyInfo && balance / 10 ** currencyInfo.decimals) ||
          0,
        allowance: 0,
      }
    }

    return this.balances;
  };

  settleOrderFill = (market, side, baseAmount, quoteAmount) => {
    const marketInfo = this.api.marketInfo[market];
    const [base, quote] = market.split('-');

    if(side === 's') {
      this.balances[base].valueReadable -= baseAmount;
      this.balances[quote].valueReadable += quoteAmount;
    } else {
      this.balances[base].valueReadable += baseAmount;
      this.balances[quote].valueReadable -= quoteAmount;
    }

    const newBaseAmountBn = ethers.utils.parseUnits(
      (this.balances[base].valueReadable).toFixed(marketInfo.baseAsset.decimals),
      marketInfo.baseAsset.decimals
    );
    const newQuoteAmountBn = ethers.utils.parseUnits(
      (this.balances[quote].valueReadable).toFixed(marketInfo.quoteAsset.decimals),
      marketInfo.quoteAsset.decimals
    );
    this.balances[base].value = newBaseAmountBn.toString();
    this.balances[quote].value = newQuoteAmountBn.toSTring();
  }
  
  submitOrder = async (product, side, price, baseAmount, quoteAmount) => {
      
  }

  signIn = async () => {
    console.log('signing in to arbitrum');
    this.ethWallet = this.api.ethersProvider.getSigner();

    const address = await this.ethWallet.getAddress();
    this.accountState = {
      id: address,
      address,
    };

    return this.accountState;
  }  
}
