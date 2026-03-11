import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Spot } from './spots/spot.entity';
import { SpotsModule } from './spots/spots.module';
import { GeocodeModule } from './geocode/geocode.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: Number(process.env.DATABASE_PORT || 5432),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'location_information',
      entities: [Spot],
      autoLoadEntities: true,
      synchronize: false,
    }),
    SpotsModule,
    GeocodeModule,
  ],
})
export class AppModule { }
