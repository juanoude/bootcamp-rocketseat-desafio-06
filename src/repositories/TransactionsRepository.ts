import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const valorInicial = 0;
    const incomeSum = transactions.reduce((totalSum, transaction) => {
      if (transaction.type === 'income') {
        return totalSum + transaction.value;
      }
      return totalSum;
    }, valorInicial);

    const outcomeSum = transactions.reduce((totalSum, transaction) => {
      if (transaction.type === 'outcome') {
        return totalSum + transaction.value;
      }
      return totalSum;
    }, valorInicial);

    const total = incomeSum - outcomeSum;

    const balance = {
      income: incomeSum,
      outcome: outcomeSum,
      total,
    };

    return balance;
  }
}

export default TransactionsRepository;
