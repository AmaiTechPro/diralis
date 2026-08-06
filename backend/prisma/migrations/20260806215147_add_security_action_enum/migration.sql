/*
  Warnings:

  - Changed the type of `action` on the `SecurityEvent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SecurityAction" AS ENUM ('LOGIN_SUCCESS', 'FAILED_LOGIN', 'ACCOUNT_LOCKED', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED', 'EMAIL_VERIFIED', 'GOOGLE_LOGIN', 'USER_CREATED', 'ROLE_CHANGED', 'ACCOUNT_DISABLED');

-- AlterTable
ALTER TABLE "SecurityEvent" DROP COLUMN "action",
ADD COLUMN     "action" "SecurityAction" NOT NULL;
