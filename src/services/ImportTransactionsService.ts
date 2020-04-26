import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import { getRepository, In } from 'typeorm';
import Transaction, { TransactionType } from '../models/Transaction';
import Category from '../models/Category';

interface CSVTransaction {
  title: string;
  type: TransactionType;
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    const transactionRepository = getRepository(Transaction);
    const categoryRepository = getRepository(Category);

    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', filename);

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line;

      if (!title || !type || !value || !category) return;

      categories.push(category);

      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const existingCategories = await categoryRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existingCategoriesNames = existingCategories.map(
      category => category.title,
    );

    const addCategoriesNames = categories
      .filter(category => !existingCategoriesNames.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const insertCategoriesObject = addCategoriesNames.map(title => ({ title }));

    const newCategories = categoryRepository.create(insertCategoriesObject);

    await categoryRepository.save(newCategories);

    const finalCategories = [...existingCategories, ...newCategories];

    const insertTransactionsObject = transactions.map(transaction => ({
      title: transaction.title,
      value: transaction.value,
      type: transaction.type,
      category: finalCategories.find(
        category => category.title === transaction.category,
      ),
    }));

    const insertTransactions = transactionRepository.create(
      insertTransactionsObject,
    );

    await transactionRepository.save(insertTransactions);

    await fs.promises.unlink(csvFilePath);

    return insertTransactions;
  }
}

export default ImportTransactionsService;
