import dotenv from 'dotenv';

dotenv.config()

interface Config {
    port: number;

    db_port: number;
    db_host: string;
    db_user: string;
    db_pwd: string;
    db_name: string;
}

const config: Config = {
    port: Number(process.env.PORT) || 3000,
    
    db_port: Number(process.env.PGPORT) || 5431,
    db_host: process.env.PGHOST || 'localhost',
    db_user: process.env.POSTGRES_USER || 'admin',
    db_pwd: process.env.POSTGRES_PASSWORD || 'secret',
    db_name: process.env.POSTGRES_DB || 'mydb',
}

export default config