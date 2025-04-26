import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from './User';
import { Project } from './Project';

export enum ActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

@Entity('project_history')
export class ProjectHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ActionType
  })
  action: ActionType;

  @Column({ type: 'json' })
  changes: object;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Project, project => project.history)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;
}