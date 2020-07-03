import csvParse from 'csv-parse';
import { In, getCustomRepository, getRepository, Index, } from 'typeorm';
import fs from 'fs';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface interfaceCSV{
  title:string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}
class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const readStream = fs.createReadStream(filePath);
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categorieRepository = getRepository(Category);

    

    const parser = csvParse({
      from_line:2,
    });

    const parseCSV = readStream.pipe(parser);

    const transactions:interfaceCSV[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [ title, type, value, category] = line.map((cell: string) =>
      cell.trim()
    );

    if (!title || !type || !value) return;

    categories.push(category);
    transactions.push({ title, type, value, category });

  });

  await new Promise(resolve => parseCSV.on('end', resolve));

  const existCategories = await categorieRepository.find({
    where: {
      title: In(categories),
    },
  });

  const existCategoriesTitles = existCategories.map((category: Category)=> category.title);

  const addCategoryTitles = categories
    .filter(category => !existCategoriesTitles.includes(category))
    // Buscando indece que o value seja repitido e fazendo a retirada.
    .filter((value, index, self)=> self.indexOf(value)==index);


    const newCategories = categorieRepository.create(
      addCategoryTitles.map(title =>({
        title,
      })),
    );

    await categorieRepository.save(newCategories);


  const finalCategoreis = [...newCategories, ...existCategories]

  const createdTransactions = transactionsRepository.create(
    transactions.map(transactions =>({
      title: transactions.title,
      type: transactions.type,
      value: transactions.value,
      category: finalCategoreis.find(category => category.title == transactions.category)

    })),
  )
  await transactionsRepository.save(createdTransactions);

  await fs.promises.unlink(filePath);

  return createdTransactions;

  }
}

export default ImportTransactionsService;
