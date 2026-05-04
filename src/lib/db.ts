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

type SasaranProgram = string;

export interface IkuRecordAttributes {
    id?: string;
    category: SasaranProgram;
    ikuNum: string;
    indicator: string;
    unit: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IkuRecordYearValueAttributes {
    id?: string;
    iku_record_id: string;
    year: string;
    target_value?: string | null;
    achievement_value?: string | null;
    documentUrl?: string | null;
    documentName?: string | null;
    documentType?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface UserAttributes {
    id?: string;
    username: string;
    name: string;
    email: string;
    password_hash: string;
    role: 'admin' | 'viewer';
    reset_token?: string | null;
    reset_token_expires_at?: Date | null;
    totp_secret?: string | null;
    totp_enabled?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface MasterYearAttributes {
    id?: string;
    year: string;
    label: string;
    is_active: boolean;
    sort_order: number;
    chart_colors?: string | null;
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
    },
    {
        tableName: 'iku_records',
        timestamps: true,
    }
);

export const IkuRecordYearValue = sequelize.define<Model<IkuRecordYearValueAttributes>>(
    'IkuRecordYearValue',
    {
        id: { type: DataTypes.STRING(64), primaryKey: true },
        iku_record_id: { type: DataTypes.STRING(64), allowNull: false },
        year: { type: DataTypes.STRING(16), allowNull: false },
        target_value: { type: DataTypes.STRING(64), allowNull: true },
        achievement_value: { type: DataTypes.STRING(64), allowNull: true },
        documentUrl: { type: DataTypes.STRING(512), allowNull: true },
        documentName: { type: DataTypes.STRING(255), allowNull: true },
        documentType: { type: DataTypes.STRING(128), allowNull: true },
    },
    {
        tableName: 'iku_record_year_values',
        timestamps: true,
        indexes: [{ unique: true, fields: ['iku_record_id', 'year'] }],
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
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('admin', 'viewer'),
        defaultValue: 'viewer',
        allowNull: false,
    },
    reset_token: {
        type: DataTypes.STRING(128),
        allowNull: true,
    },
    reset_token_expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    totp_secret: {
        type: DataTypes.STRING(64),
        allowNull: true,
    },
    totp_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    }
}, {
    tableName: 'users',
    timestamps: true,
});

export const MasterYear = sequelize.define<Model<MasterYearAttributes>>('MasterYear', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    year: {
        type: DataTypes.STRING(16),
        allowNull: false,
        unique: true,
    },
    label: {
        type: DataTypes.STRING(120),
        allowNull: false,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    chart_colors: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
}, {
    tableName: 'master_years',
    timestamps: true,
});
