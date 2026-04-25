-- DropForeignKey
ALTER TABLE "SupportMessage" DROP CONSTRAINT "SupportMessage_senderId_fkey";

-- DropForeignKey
ALTER TABLE "SupportMessage" DROP CONSTRAINT "SupportMessage_userId_fkey";

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
