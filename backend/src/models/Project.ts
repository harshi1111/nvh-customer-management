import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, AllowNull, Default } from 'sequelize-typescript';
import { Optional } from 'sequelize';
import Customer from './Customer';
import Transaction from './Transaction';

interface ProjectAttributes {
  id: string;
  customerId: string;
  name: string;
  description?: string;
  location: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'on_hold';
  totalBudget: number;
  spentAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'createdAt' | 'updatedAt' | 'spentAmount'> {}

@Table({
  tableName: 'projects',
  timestamps: true
})
class Project extends Model<ProjectAttributes, ProjectCreationAttributes> {
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

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  location!: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  startDate!: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  endDate!: string;

  @Column({
    type: DataType.ENUM('active', 'completed', 'on_hold'),
    allowNull: false,
    defaultValue: 'active'
  })
  status!: 'active' | 'completed' | 'on_hold';

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  })
  totalBudget!: number;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  spentAmount!: number;

  @HasMany(() => Transaction)
  transactions!: Transaction[];

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

export default Project;