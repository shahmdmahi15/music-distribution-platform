/*
  Warnings:

  - You are about to drop the `Workspace` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkspaceAccess` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkspacePartner` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Workspace" DROP CONSTRAINT "Workspace_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Workspace" DROP CONSTRAINT "Workspace_whiteLabelId_fkey";

-- DropForeignKey
ALTER TABLE "WorkspaceAccess" DROP CONSTRAINT "WorkspaceAccess_userId_fkey";

-- DropForeignKey
ALTER TABLE "WorkspaceAccess" DROP CONSTRAINT "WorkspaceAccess_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "WorkspacePartner" DROP CONSTRAINT "WorkspacePartner_userId_fkey";

-- DropForeignKey
ALTER TABLE "WorkspacePartner" DROP CONSTRAINT "WorkspacePartner_workspaceId_fkey";

-- DropTable
DROP TABLE "Workspace";

-- DropTable
DROP TABLE "WorkspaceAccess";

-- DropTable
DROP TABLE "WorkspacePartner";

-- DropEnum
DROP TYPE "WorkspaceAccessRole";
