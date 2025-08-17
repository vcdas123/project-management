import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStartDateToProjectsAndTasks1624000000001 implements MigrationInterface {
    name = 'AddStartDateToProjectsAndTasks1624000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        /*
          # Add startDate to projects and tasks

          1. Schema Changes
            - Add `startDate` column to `projects` table (DATE, NOT NULL)
            - Add `startDate` column to `tasks` table (DATE, NOT NULL)
          
          2. Data Migration
            - Set default startDate for existing projects to 30 days before deadline
            - Set default startDate for existing tasks to 7 days before deadline
          
          3. Constraints
            - Ensure startDate is before deadline for both projects and tasks
            - Ensure task startDate is not before project startDate
            - Ensure task deadline does not exceed project deadline
        */

        // Add startDate column to projects table
        await queryRunner.query(`
            ALTER TABLE projects 
            ADD COLUMN startDate DATE NULL
        `);

        // Set default startDate for existing projects (30 days before deadline)
        await queryRunner.query(`
            UPDATE projects 
            SET startDate = DATE_SUB(deadline, INTERVAL 30 DAY)
            WHERE startDate IS NULL
        `);

        // Make startDate NOT NULL
        await queryRunner.query(`
            ALTER TABLE projects 
            MODIFY COLUMN startDate DATE NOT NULL
        `);

        // Add startDate column to tasks table
        await queryRunner.query(`
            ALTER TABLE tasks 
            ADD COLUMN startDate DATE NULL
        `);

        // Set default startDate for existing tasks (7 days before deadline, but not before project startDate)
        await queryRunner.query(`
            UPDATE tasks t
            INNER JOIN projects p ON t.projectId = p.id
            SET t.startDate = GREATEST(
                p.startDate,
                DATE_SUB(t.deadline, INTERVAL 7 DAY)
            )
            WHERE t.startDate IS NULL
        `);

        // Make startDate NOT NULL
        await queryRunner.query(`
            ALTER TABLE tasks 
            MODIFY COLUMN startDate DATE NOT NULL
        `);

        // Add check constraints to ensure data integrity
        await queryRunner.query(`
            ALTER TABLE projects 
            ADD CONSTRAINT CHK_project_dates 
            CHECK (startDate < deadline)
        `);

        await queryRunner.query(`
            ALTER TABLE tasks 
            ADD CONSTRAINT CHK_task_dates 
            CHECK (startDate < deadline)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove check constraints
        await queryRunner.query(`
            ALTER TABLE tasks 
            DROP CONSTRAINT IF EXISTS CHK_task_dates
        `);

        await queryRunner.query(`
            ALTER TABLE projects 
            DROP CONSTRAINT IF EXISTS CHK_project_dates
        `);

        // Remove startDate columns
        await queryRunner.query(`
            ALTER TABLE tasks 
            DROP COLUMN IF EXISTS startDate
        `);

        await queryRunner.query(`
            ALTER TABLE projects 
            DROP COLUMN IF EXISTS startDate
        `);
    }
}