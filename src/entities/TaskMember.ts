import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from './User';
import { Task } from './Task';

@Entity('task_members')
export class TaskMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Task, task => task.members)
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column()
  taskId: string;

  @ManyToOne(() => User, user => user.projectMemberships)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;
}