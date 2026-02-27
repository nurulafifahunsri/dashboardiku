import { Sequelize, DataTypes, Model } from 'sequelize';

const DB_NAME = process.env.DB_NAME || 'dashboard_iku';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT || 3306);

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'mysql',
    logging: false,
});

type Year = 2025 | 2026 | 2027 | 2028 | 2029 | 2030;
type SasaranProgram = string;

export interface IkuRecordAttributes {
    id?: string;
    category: SasaranProgram;
    ikuNum: string;
    indicator: string;
    unit: string;
    target2025?: string;
    target2026?: string;
    target2027?: string;
    target2028?: string;
    target2029?: string;
    target2030?: string;
    achievement2025?: string;
    achievement2026?: string;
    achievement2027?: string;
    achievement2028?: string;
    achievement2029?: string;
    achievement2030?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface UserAttributes {
    id?: string;
    username: string;
    name: string;
    password_hash: string;
    role: 'admin' | 'viewer';
    createdAt?: Date;
    updatedAt?: Date;
}

export const IkuRecord = sequelize.define<Model<IkuRecordAttributes>>(
    'IkuRecord',
    {
        id: { type: DataTypes.STRING(64), primaryKey: true },
        category: { type: DataTypes.STRING(128), allowNull: false },
        ikuNum: { type: DataTypes.STRING(32), allowNull: false },
        indicator: { type: DataTypes.TEXT, allowNull: false },
        unit: { type: DataTypes.STRING(64), allowNull: false },
        target2025: { type: DataTypes.STRING(64), allowNull: true },
        target2026: { type: DataTypes.STRING(64), allowNull: true },
        target2027: { type: DataTypes.STRING(64), allowNull: true },
        target2028: { type: DataTypes.STRING(64), allowNull: true },
        target2029: { type: DataTypes.STRING(64), allowNull: true },
        target2030: { type: DataTypes.STRING(64), allowNull: true },
        achievement2025: { type: DataTypes.STRING(64), allowNull: true },
        achievement2026: { type: DataTypes.STRING(64), allowNull: true },
        achievement2027: { type: DataTypes.STRING(64), allowNull: true },
        achievement2028: { type: DataTypes.STRING(64), allowNull: true },
        achievement2029: { type: DataTypes.STRING(64), allowNull: true },
        achievement2030: { type: DataTypes.STRING(64), allowNull: true },
    },
    {
        tableName: 'iku_records',
        timestamps: true,
    }
);

export const User = sequelize.define<Model<UserAttributes>>('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('admin', 'viewer'),
        defaultValue: 'viewer',
        allowNull: false,
    }
}, {
    tableName: 'users',
    timestamps: true,
});
