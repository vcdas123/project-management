import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSetup1624000000000 implements MigrationInterface {
    name = 'InitialSetup1624000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable foreign key checks temporarily for migration
        await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 0`);

        // Create users table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) NOT NULL,
                firstName VARCHAR(100) NOT NULL,
                lastName VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
                profileImage VARCHAR(255) NULL,
                passwordResetToken VARCHAR(255) NULL,
                passwordResetExpires DATETIME NULL,
                isActive TINYINT NOT NULL DEFAULT 1,
                createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX IDX_users_email (email),
                PRIMARY KEY (id)
            ) ENGINE=InnoDB
        `);

        // Create projects table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id VARCHAR(36) NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                deadline DATE NOT NULL,
                status ENUM('planning', 'in_progress', 'completed', 'on_hold', 'cancelled') NOT NULL DEFAULT 'planning',
                images TEXT NULL,
                createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                ownerId VARCHAR(36) NOT NULL,
                PRIMARY KEY (id),
                INDEX IDX_projects_ownerId (ownerId),
                CONSTRAINT FK_projects_ownerId FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);

        // Create tasks table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id VARCHAR(36) NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                deadline DATE NOT NULL,
                status ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
                images TEXT NULL,
                createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                projectId VARCHAR(36) NOT NULL,
                assignedById VARCHAR(36) NOT NULL,
                PRIMARY KEY (id),
                INDEX IDX_tasks_projectId (projectId),
                INDEX IDX_tasks_assignedById (assignedById),
                CONSTRAINT FK_tasks_projectId FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
                CONSTRAINT FK_tasks_assignedById FOREIGN KEY (assignedById) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);

        // Create project_members table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS project_members (
                id VARCHAR(36) NOT NULL,
                createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                projectId VARCHAR(36) NOT NULL,
                userId VARCHAR(36) NOT NULL,
                PRIMARY KEY (id),
                INDEX IDX_project_members_projectId (projectId),
                INDEX IDX_project_members_userId (userId),
                UNIQUE INDEX IDX_project_members_unique (projectId, userId),
                CONSTRAINT FK_project_members_projectId FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
                CONSTRAINT FK_project_members_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);

        // Create task_members table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS task_members (
                id VARCHAR(36) NOT NULL,
                createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                taskId VARCHAR(36) NOT NULL,
                userId VARCHAR(36) NOT NULL,
                PRIMARY KEY (id),
                INDEX IDX_task_members_taskId (taskId),
                INDEX IDX_task_members_userId (userId),
                UNIQUE INDEX IDX_task_members_unique (taskId, userId),
                CONSTRAINT FK_task_members_taskId FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
                CONSTRAINT FK_task_members_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);

        // Create project_history table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS project_history (
                id VARCHAR(36) NOT NULL,
                action ENUM('create', 'update', 'delete') NOT NULL,
                changes JSON NOT NULL,
                createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                projectId VARCHAR(36) NOT NULL,
                userId VARCHAR(36) NOT NULL,
                PRIMARY KEY (id),
                INDEX IDX_project_history_projectId (projectId),
                INDEX IDX_project_history_userId (userId),
                CONSTRAINT FK_project_history_projectId FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
                CONSTRAINT FK_project_history_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);

        // Create task_history table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS task_history (
                id VARCHAR(36) NOT NULL,
                action ENUM('create', 'update', 'delete') NOT NULL,
                changes JSON NOT NULL,
                createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                taskId VARCHAR(36) NOT NULL,
                userId VARCHAR(36) NOT NULL,
                PRIMARY KEY (id),
                INDEX IDX_task_history_taskId (taskId),
                INDEX IDX_task_history_userId (userId),
                CONSTRAINT FK_task_history_taskId FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
                CONSTRAINT FK_task_history_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);

        // Re-enable foreign key checks
        await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 1`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Disable foreign key checks temporarily for migration
        await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 0`);

        // Drop tables in reverse order
        await queryRunner.query(`DROP TABLE IF EXISTS task_history`);
        await queryRunner.query(`DROP TABLE IF EXISTS project_history`);
        await queryRunner.query(`DROP TABLE IF EXISTS task_members`);
        await queryRunner.query(`DROP TABLE IF EXISTS project_members`);
        await queryRunner.query(`DROP TABLE IF EXISTS tasks`);
        await queryRunner.query(`DROP TABLE IF EXISTS projects`);
        await queryRunner.query(`DROP TABLE IF EXISTS users`);

        // Re-enable foreign key checks
        await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 1`);
    }
}