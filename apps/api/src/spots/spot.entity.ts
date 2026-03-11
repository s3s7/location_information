import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("spots")
export class Spot {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "external_id", type: "text", unique: true, nullable: true })
  externalId!: string | null;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "text", nullable: true })
  address!: string | null;

  @Column({ type: "double precision" })
  latitude!: number;

  @Column({ type: "double precision" })
  longitude!: number;

  @Column({
    type: "geography",
    spatialFeatureType: "Point",
    srid: 4326,
  })
  location!: string;

  @Column({ type: "jsonb", nullable: true })
  raw!: Record<string, unknown> | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
