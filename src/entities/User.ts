import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Project } from "./Project";
import { Task } from "./Task";
import { ProjectMember } from "./ProjectMember";

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ type: "varchar", nullable: true, select: false })
  passwordResetToken: string | null;

  @Column({ type: "datetime", nullable: true, select: false })
  passwordResetExpires: Date | null;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Project, project => project.owner)
  ownedProjects: Project[];

  @OneToMany(() => ProjectMember, projectMember => projectMember.user)
  projectMemberships: ProjectMember[];

  @OneToMany(() => Task, task => task.assignedBy)
  assignedTasks: Task[];
}
