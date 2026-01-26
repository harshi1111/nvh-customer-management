"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const Project_1 = __importDefault(require("./Project"));
const Transaction_1 = __importDefault(require("./Transaction"));
const sequelizeEncryption_1 = require("../utils/sequelizeEncryption");
let Customer = class Customer extends sequelize_typescript_1.Model {
    // Manual encryption method
    async encryptAndHashAadhaar() {
        if (this.aadhaarNumber && !this.aadhaarNumber.startsWith('encrypted::')) {
            const originalAadhaar = this.aadhaarNumber;
            this.aadhaarNumber = (0, sequelizeEncryption_1.encryptAadhaar)(originalAadhaar);
            this.aadhaarHash = (0, sequelizeEncryption_1.createAadhaarHash)(originalAadhaar) || this.aadhaarHash;
        }
    }
    // Call this manually before save if needed
    async beforeSave() {
        await this.encryptAndHashAadhaar();
    }
    // Custom getter for masked Aadhaar
    getMaskedAadhaar() {
        return this.aadhaarNumber ? (0, sequelizeEncryption_1.decryptAadhaar)(this.aadhaarNumber) : '';
    }
    // Custom getter for original Aadhaar (use with caution)
    getOriginalAadhaar() {
        if (!this.aadhaarNumber)
            return '';
        try {
            const { AadhaarEncryption } = require('../utils/encryption');
            const decrypted = AadhaarEncryption.decrypt(this.aadhaarNumber);
            return decrypted.startsWith('INVALID-')
                ? decrypted.replace('INVALID-', '')
                : decrypted;
        }
        catch (error) {
            return this.aadhaarNumber;
        }
    }
};
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
        primaryKey: true,
    }),
    __metadata("design:type", String)
], Customer.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
        unique: true,
    }),
    __metadata("design:type", String)
], Customer.prototype, "aadhaarNumber", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
        unique: true,
    }),
    __metadata("design:type", String)
], Customer.prototype, "aadhaarHash", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: false,
    }),
    __metadata("design:type", String)
], Customer.prototype, "fullName", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM('Male', 'Female', 'Other'),
        allowNull: false,
    }),
    __metadata("design:type", String)
], Customer.prototype, "gender", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: false,
    }),
    __metadata("design:type", String)
], Customer.prototype, "dateOfBirth", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: false,
    }),
    __metadata("design:type", String)
], Customer.prototype, "address", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(10),
        allowNull: false,
        validate: {
            len: [10, 10]
        }
    }),
    __metadata("design:type", String)
], Customer.prototype, "contactNumber", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
        validate: {
            isEmail: true,
        }
    }),
    __metadata("design:type", String)
], Customer.prototype, "email", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
    }),
    __metadata("design:type", String)
], Customer.prototype, "profileImage", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    }),
    __metadata("design:type", Boolean)
], Customer.prototype, "isActive", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Project_1.default),
    __metadata("design:type", Array)
], Customer.prototype, "projects", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Transaction_1.default),
    __metadata("design:type", Array)
], Customer.prototype, "transactions", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: false,
        defaultValue: sequelize_typescript_1.DataType.NOW,
    }),
    __metadata("design:type", Date)
], Customer.prototype, "createdAt", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: false,
        defaultValue: sequelize_typescript_1.DataType.NOW,
    }),
    __metadata("design:type", Date)
], Customer.prototype, "updatedAt", void 0);
Customer = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'customers',
        timestamps: true,
        hooks: {
            beforeCreate: async (instance) => {
                await instance.encryptAndHashAadhaar();
            },
            beforeUpdate: async (instance) => {
                await instance.encryptAndHashAadhaar();
            }
        }
    })
], Customer);
exports.default = Customer;
