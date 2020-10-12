
import { inAppPurchase, app } from 'electron';
import { remove } from 'lodash';
// @ts-ignore
import storage from '@splayer/electron-json-storage';
import { verifyReceipt } from '../../shared/utils';

type PaymentData = {
  transactionID: string,
  productID: string,
  receipt: string,
  currency: string,
  date: string,
}

type TransactionData = {
  date: string,
  payment: PaymentData,
}

interface IApplePayVerify {
  verifyAfterPay(transaction: TransactionData): Promise<boolean>,
  verifyAfterSignIn(): Promise<boolean>,
  verifyAfterOpenApp(): void,
  setEndpoint(endpoint: string): void,
  isWaitingSignIn(): boolean,
}

class ApplePayVerify implements IApplePayVerify {
  private endpoint = '';

  private waitingTransaction?: TransactionData;

  private getListFromCache(): Promise<TransactionData[]> {
    return new Promise((resolve) => {
      storage.get('apple-receipt-cache', (err, data: {
        list: TransactionData[],
      }) => {
        if (data && data.list && data.list.length > 0) {
          resolve(data.list);
        } else {
          resolve([]);
        }
      });
    });
  }

  private async addListToCache(transaction: TransactionData) {
    const list: TransactionData[] = await this.getListFromCache();
    list.push(transaction);
    try {
      storage.set('apple-receipt-cache', { list });
    } catch (error) {
      // empty
    }
  }

  private async removeFromCache(transactionID: string) {
    const list: TransactionData[] = await this.getListFromCache();
    remove(list, (e: TransactionData) => e.payment.transactionID === transactionID);
    try {
      storage.set('apple-receipt-cache', { list });
    } catch (error) {
      // empty
    }
  }

  public setEndpoint(endpoint: string) {
    this.endpoint = endpoint;
  }

  public isWaitingSignIn() {
    return !!this.waitingTransaction;
  }

  public async verifyAfterPay(transaction: TransactionData): Promise<boolean> {
    await this.addListToCache(transaction);
    try {
      const res = await verifyReceipt(this.endpoint, transaction.payment);
      this.removeFromCache(transaction.payment.transactionID);
      inAppPurchase.finishTransactionByDate(transaction.date);
      if (res === 0) {
        return true;
      }
    } catch (error) {
      if (error && (error.status === 401 || error.status === 403)) {
        app.emit('sign-out');
        app.emit('add-login', 'preference');
        this.waitingTransaction = transaction;
        return false;
      }
    }
    throw new Error('verifyReceipt server error');
  }

  public async verifyAfterSignIn(): Promise<boolean> {
    const { waitingTransaction } = this;
    if (!waitingTransaction) return false;
    try {
      const res = await verifyReceipt(this.endpoint, waitingTransaction.payment);
      this.removeFromCache(waitingTransaction.payment.transactionID);
      inAppPurchase.finishTransactionByDate(waitingTransaction.date);
      this.waitingTransaction = undefined;
      if (res === 0) {
        return true;
      }
    } catch (error) {
      // empty
    }
    throw new Error('verifyReceipt server error');
  }

  public async verifyAfterOpenApp() {
    let success = false;
    const list = await this.getListFromCache();
    list.forEach(async (e: TransactionData) => {
      try {
        const res = await verifyReceipt(this.endpoint, e.payment);
        this.removeFromCache(e.payment.transactionID);
        inAppPurchase.finishTransactionByDate(e.date);
        success = res === 0;
      } catch (error) {
        // empty
        if (error && (error.status === 401 || error.status === 403)) {
          app.emit('sign-out');
          app.emit('add-login', 'preference');
        }
      }
    });
    if (!success) {
      throw new Error('no verifyReceipt result');
    }
  }
}

export default ApplePayVerify;

export const applePayVerify = new ApplePayVerify();
