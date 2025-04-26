import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from './User';
import { Task } from './Task';
import { ActionType } from './ProjectHistory';

@Entity('task_history')
export class TaskHistory {
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
  @ManyToOne(() => Task, task => task.history)
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column()
  taskId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;
}