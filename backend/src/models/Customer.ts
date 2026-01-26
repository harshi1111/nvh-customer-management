import { Table, Column, Model, DataType, HasMany, BeforeCreate, BeforeUpdate } from 'sequelize-typescript';
import { Optional } from 'sequelize';
import Project from './Project';
import Transaction from './Transaction';
import { encryptAadhaar, decryptAadhaar, createAadhaarHash } from '../utils/sequelizeEncryption';

interface CustomerAttributes {
  id: string;
  aadhaarNumber: string;
  aadhaarHash: string;
  fullName: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  address: string;
  contactNumber: string;
  email?: string;
  profileImage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomerCreationAttributes extends Optional<CustomerAttributes, 'id' | 'createdAt' | 'updatedAt' | 'aadhaarHash'> {}

@Table({
  tableName: 'customers',
  timestamps: true,
  hooks: {
    beforeCreate: async (instance: Customer) => {
      await instance.encryptAndHashAadhaar();
    },
    beforeUpdate: async (instance: Customer) => {
      await instance.encryptAndHashAadhaar();
    }
  }
})
class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  aadhaarNumber!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  aadhaarHash!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  fullName!: string;

  @Column({
    type: DataType.ENUM('Male', 'Female', 'Other'),
    allowNull: false,
  })
  gender!: 'Male' | 'Female' | 'Other';

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  dateOfBirth!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  address!: string;

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    validate: {
      len: [10, 10]
    }
  })
  contactNumber!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    }
  })
  email!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  profileImage!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive!: boolean;

  @HasMany(() => Project)
  projects!: Project[];

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

  // Manual encryption method
  public async encryptAndHashAadhaar(): Promise<void> {
    if (this.aadhaarNumber && !this.aadhaarNumber.startsWith('encrypted::')) {
      const originalAadhaar = this.aadhaarNumber;
      this.aadhaarNumber = encryptAadhaar(originalAadhaar);
      this.aadhaarHash = createAadhaarHash(originalAadhaar) || this.aadhaarHash;
    }
  }

  // Call this manually before save if needed
  public async beforeSave(): Promise<void> {
    await this.encryptAndHashAadhaar();
  }

  // Custom getter for masked Aadhaar
  getMaskedAadhaar(): string {
    return this.aadhaarNumber ? decryptAadhaar(this.aadhaarNumber) : '';
  }

  // Custom getter for original Aadhaar (use with caution)
  getOriginalAadhaar(): string {
    if (!this.aadhaarNumber) return '';
    
    try {
      const { AadhaarEncryption } = require('../utils/encryption');
      const decrypted = AadhaarEncryption.decrypt(this.aadhaarNumber);
      return decrypted.startsWith('INVALID-') 
        ? decrypted.replace('INVALID-', '') 
        : decrypted;
    } catch (error) {
      return this.aadhaarNumber;
    }
  }
}

export default Customer;