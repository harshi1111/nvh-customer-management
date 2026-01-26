import { Table, Column, Model, DataType, ForeignKey, BelongsTo, Default } from 'sequelize-typescript';
import { Optional } from 'sequelize';
import Customer from './Customer';
import Project from './Project';

interface TransactionAttributes {
  id: string;
  customerId: string;
  projectId: string;
  serialNumber: number;
  expenseType: string; // Changed from ExpenseType to string
  quantity?: number;
  unit?: string;
  debitAmount: number;
  creditAmount: number;
  description?: string;
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

@Table({
  tableName: 'transactions',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['customerId', 'projectId', 'serialNumber']
    },
    {
      fields: ['customerId', 'projectId']
    }
  ]
})
class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string;

  @ForeignKey(() => Customer)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  customerId!: string;

  @BelongsTo(() => Customer)
  customer!: Customer;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  projectId!: string;

  @BelongsTo(() => Project)
  project!: Project;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  serialNumber!: number;

  @Column({
    type: DataType.ENUM(
      'LABOUR_CHARGES',
      'SPRINKLER_INSTALLATION',
      'TRANSPORT',
      'FOOD',
      'PLOUGHING',
      'TRACTOR',
      'COW_GOAT_DUNG',
      'INVESTMENT'
    ),
    allowNull: false,
  })
  expenseType!: string; // Changed from ExpenseType to string

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  quantity!: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  unit!: string;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  debitAmount!: number;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  creditAmount!: number;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  description!: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  transactionDate!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  createdAt!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  updatedAt!: Date;
}

export default Transaction;