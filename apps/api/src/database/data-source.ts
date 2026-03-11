import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Spot } from '../spots/spot.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT || 5432),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'location_information',
  entities: [Spot],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
});

export default AppDataSource;
