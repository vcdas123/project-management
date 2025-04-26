import { AppDataSource } from "../connection";
import { User, UserRole } from "../../entities/User";
import { Project, ProjectStatus } from "../../entities/Project";
import { Task, TaskStatus } from "../../entities/Task";
import { ProjectMember } from "../../entities/ProjectMember";
import { TaskMember } from "../../entities/TaskMember";
import { ProjectHistory } from "../../entities/ProjectHistory";
import { TaskHistory } from "../../entities/TaskHistory";
import { ActionType } from "../../entities/ProjectHistory";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";

// Define allowed field types for history tracking
type ProjectFieldType = "name" | "description" | "status" | "deadline";
type TaskFieldType = "name" | "description" | "status" | "deadline";

interface ProjectHistoryChange {
  field: ProjectFieldType;
  before: string | Date | ProjectStatus;
  after: string | Date | ProjectStatus;
}

interface TaskHistoryChange {
  field: TaskFieldType;
  before: string | Date | TaskStatus;
  after: string | Date | TaskStatus;
}

const seedDatabase = async () => {
  try {
    // Initialize connection
    await AppDataSource.initialize();
    console.log("Database connection established");

    // Disable foreign key checks temporarily for seeding
    await AppDataSource.query("SET FOREIGN_KEY_CHECKS = 0");

    // Clear existing data
    await AppDataSource.query("TRUNCATE TABLE task_history");
    await AppDataSource.query("TRUNCATE TABLE project_history");
    await AppDataSource.query("TRUNCATE TABLE task_members");
    await AppDataSource.query("TRUNCATE TABLE project_members");
    await AppDataSource.query("TRUNCATE TABLE tasks");
    await AppDataSource.query("TRUNCATE TABLE projects");
    await AppDataSource.query("TRUNCATE TABLE users");

    // Re-enable foreign key checks
    await AppDataSource.query("SET FOREIGN_KEY_CHECKS = 1");

    // Repositories
    const userRepository = AppDataSource.getRepository(User);
    const projectRepository = AppDataSource.getRepository(Project);
    const taskRepository = AppDataSource.getRepository(Task);
    const projectMemberRepository = AppDataSource.getRepository(ProjectMember);
    const taskMemberRepository = AppDataSource.getRepository(TaskMember);
    const projectHistoryRepository =
      AppDataSource.getRepository(ProjectHistory);
    const taskHistoryRepository = AppDataSource.getRepository(TaskHistory);

    // Seed Users (25 users including admin)
    const users: User[] = [];

    // Create admin user
    const adminUser = new User();
    adminUser.id = uuidv4();
    adminUser.firstName = "Admin";
    adminUser.lastName = "User";
    adminUser.email = "admin@example.com";
    adminUser.password = await bcrypt.hash("Admin123!", 12);
    adminUser.role = UserRole.ADMIN;
    adminUser.isActive = true;
    users.push(adminUser);

    // Create regular users
    for (let i = 0; i < 24; i++) {
      const user = new User();
      user.id = uuidv4();
      user.firstName = faker.person.firstName();
      user.lastName = faker.person.lastName();
      user.email = faker.internet.email({
        firstName: user.firstName,
        lastName: user.lastName,
      });
      user.password = await bcrypt.hash("User123!", 12);
      user.role = UserRole.USER;
      user.isActive = faker.datatype.boolean(0.9); // 90% active
      users.push(user);
    }

    await userRepository.save(users);
    console.log("Users seeded successfully");

    // Seed Projects (25 projects)
    const projects: Project[] = [];
    const projectStatuses = Object.values(ProjectStatus);

    for (let i = 0; i < 25; i++) {
      const project = new Project();
      project.id = uuidv4();
      project.name = faker.company.name() + " " + faker.company.buzzPhrase();
      project.description = faker.lorem.paragraphs(2);

      // Set deadline between now and 3 months in future
      const deadline = new Date();
      deadline.setDate(
        deadline.getDate() + faker.number.int({ min: 30, max: 90 })
      );
      project.deadline = deadline;

      project.status =
        projectStatuses[
          faker.number.int({ min: 0, max: projectStatuses.length - 1 })
        ];
      project.images = Array(faker.number.int({ min: 0, max: 3 }))
        .fill(null)
        .map(() => faker.image.url());

      // Assign a random non-admin user as owner
      const ownerIndex = faker.number.int({ min: 1, max: users.length - 1 });
      project.owner = users[ownerIndex];
      project.ownerId = users[ownerIndex].id;

      projects.push(project);
    }

    await projectRepository.save(projects);
    console.log("Projects seeded successfully");

    // Seed Project Members
    const projectMembers: ProjectMember[] = [];

    for (const project of projects) {
      // Add 3-8 random members to each project (excluding owner)
      const memberCount = faker.number.int({ min: 3, max: 8 });
      const availableUsers = users.filter(user => user.id !== project.ownerId);

      const selectedUsers = faker.helpers.arrayElements(
        availableUsers,
        memberCount
      );

      for (const user of selectedUsers) {
        const projectMember = new ProjectMember();
        projectMember.id = uuidv4();
        projectMember.project = project;
        projectMember.projectId = project.id;
        projectMember.user = user;
        projectMember.userId = user.id;

        projectMembers.push(projectMember);
      }
    }

    await projectMemberRepository.save(projectMembers);
    console.log("Project members seeded successfully");

    // Seed Tasks (5-10 tasks per project)
    const tasks: Task[] = [];
    const taskStatuses = Object.values(TaskStatus);

    for (const project of projects) {
      const taskCount = faker.number.int({ min: 5, max: 10 });

      for (let i = 0; i < taskCount; i++) {
        const task = new Task();
        task.id = uuidv4();
        task.name = faker.company.buzzPhrase();
        task.description = faker.lorem.paragraph();

        // Set deadline between now and project deadline
        const projectDeadline = new Date(project.deadline);
        const today = new Date();
        const maxDays = Math.floor(
          (projectDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        const deadline = new Date();
        deadline.setDate(
          deadline.getDate() +
            faker.number.int({ min: 1, max: maxDays > 0 ? maxDays : 1 })
        );
        task.deadline = deadline;

        task.status =
          taskStatuses[
            faker.number.int({ min: 0, max: taskStatuses.length - 1 })
          ];
        task.images = Array(faker.number.int({ min: 0, max: 2 }))
          .fill(null)
          .map(() => faker.image.url());

        task.project = project;
        task.projectId = project.id;

        // Assigned by either the project owner or admin
        task.assignedBy = faker.datatype.boolean() ? project.owner : users[0]; // users[0] is admin
        task.assignedById = task.assignedBy.id;

        tasks.push(task);
      }
    }

    await taskRepository.save(tasks);
    console.log("Tasks seeded successfully");

    // Seed Task Members
    const taskMembers: TaskMember[] = [];

    for (const task of tasks) {
      // Get project members for this task's project
      const relevantProjectMembers = projectMembers.filter(
        pm => pm.projectId === task.projectId
      );

      // Add 1-5 random members from project members
      const memberCount = faker.number.int({
        min: 1,
        max: Math.min(5, relevantProjectMembers.length),
      });
      const selectedProjectMembers = faker.helpers.arrayElements(
        relevantProjectMembers,
        memberCount
      );

      for (const projectMember of selectedProjectMembers) {
        const taskMember = new TaskMember();
        taskMember.id = uuidv4();
        taskMember.task = task;
        taskMember.taskId = task.id;
        taskMember.user = projectMember.user;
        taskMember.userId = projectMember.userId;

        taskMembers.push(taskMember);
      }
    }

    await taskMemberRepository.save(taskMembers);
    console.log("Task members seeded successfully");

    // Seed Project History
    const projectHistories: ProjectHistory[] = [];

    for (const project of projects) {
      // Create history for project
      const createHistory = new ProjectHistory();
      createHistory.id = uuidv4();
      createHistory.project = project;
      createHistory.projectId = project.id;
      createHistory.user = project.owner;
      createHistory.userId = project.ownerId;
      createHistory.action = ActionType.CREATE;
      createHistory.changes = {
        name: project.name,
        description: project.description,
        deadline: project.deadline,
        status: project.status,
      };

      projectHistories.push(createHistory);

      // Add some random update histories (0-3)
      const updateCount = faker.number.int({ min: 0, max: 3 });

      for (let i = 0; i < updateCount; i++) {
        const updateHistory = new ProjectHistory();
        updateHistory.id = uuidv4();
        updateHistory.project = project;
        updateHistory.projectId = project.id;

        // Updates by either owner or admin
        const updater = faker.datatype.boolean() ? project.owner : users[0];
        updateHistory.user = updater;
        updateHistory.userId = updater.id;

        updateHistory.action = ActionType.UPDATE;

        // Random field updates
        const updatedField: ProjectFieldType = faker.helpers.arrayElement([
          "name",
          "description",
          "status",
          "deadline",
        ]);

        const changes: ProjectHistoryChange = {
          field: updatedField,
          before: project[updatedField],
          after:
            updatedField === "status"
              ? faker.helpers.arrayElement(projectStatuses)
              : updatedField === "deadline"
              ? faker.date.future({ years: 0.5 })
              : faker.lorem.sentence(),
        };

        updateHistory.changes = changes;

        projectHistories.push(updateHistory);
      }
    }

    await projectHistoryRepository.save(projectHistories);
    console.log("Project history seeded successfully");

    // Seed Task History
    const taskHistories: TaskHistory[] = [];

    for (const task of tasks) {
      // Create history for task
      const createHistory = new TaskHistory();
      createHistory.id = uuidv4();
      createHistory.task = task;
      createHistory.taskId = task.id;
      createHistory.user = task.assignedBy;
      createHistory.userId = task.assignedById;
      createHistory.action = ActionType.CREATE;
      createHistory.changes = {
        name: task.name,
        description: task.description,
        deadline: task.deadline,
        status: task.status,
      };

      taskHistories.push(createHistory);

      // Add some random update histories (0-3)
      const updateCount = faker.number.int({ min: 0, max: 3 });

      for (let i = 0; i < updateCount; i++) {
        const updateHistory = new TaskHistory();
        updateHistory.id = uuidv4();
        updateHistory.task = task;
        updateHistory.taskId = task.id;

        // Find task members
        const relevantTaskMembers = taskMembers.filter(
          tm => tm.taskId === task.id
        );

        // Updates by task member, project owner, or admin
        let updater;
        if (relevantTaskMembers.length > 0 && faker.datatype.boolean(0.7)) {
          const randomMember = faker.helpers.arrayElement(relevantTaskMembers);
          updater = randomMember.user;
        } else {
          updater = faker.datatype.boolean()
            ? projects.find(p => p.id === task.projectId)?.owner
            : users[0];
        }

        updateHistory.user = updater!;
        updateHistory.userId = updater!.id;

        updateHistory.action = ActionType.UPDATE;

        // Random field updates
        const updatedField: TaskFieldType = faker.helpers.arrayElement([
          "name",
          "description",
          "status",
          "deadline",
        ]);

        const changes: TaskHistoryChange = {
          field: updatedField,
          before: task[updatedField],
          after:
            updatedField === "status"
              ? faker.helpers.arrayElement(taskStatuses)
              : updatedField === "deadline"
              ? faker.date.future({ years: 0.25 })
              : faker.lorem.sentence(),
        };

        updateHistory.changes = changes;

        taskHistories.push(updateHistory);
      }
    }

    await taskHistoryRepository.save(taskHistories);
    console.log("Task history seeded successfully");

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    // Close the connection
    await AppDataSource.destroy();
  }
};

// Run the seeder
seedDatabase();
