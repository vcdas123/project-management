import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { User } from './User';
import { Project } from './Project';
import { TaskMember } from './TaskMember';
import { TaskHistory } from './TaskHistory';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'date' })
  deadline: Date;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING
  })
  status: TaskStatus;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Project, project => project.tasks)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @ManyToOne(() => User, user => user.assignedTasks)
  @JoinColumn({ name: 'assignedById' })
  assignedBy: User;

  @Column()
  assignedById: string;

  @OneToMany(() => TaskMember, taskMember => taskMember.task)
  members: TaskMember[];

  @OneToMany(() => TaskHistory, history => history.task)
  history: TaskHistory[];
}