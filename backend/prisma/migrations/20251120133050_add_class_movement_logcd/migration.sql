-- CreateTable
CREATE TABLE "class_movement_logs" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromClassId" TEXT,
    "toClassId" TEXT NOT NULL,
    "reason" TEXT,
    "changedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_movement_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "class_movement_logs" ADD CONSTRAINT "class_movement_logs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_movement_logs" ADD CONSTRAINT "class_movement_logs_fromClassId_fkey" FOREIGN KEY ("fromClassId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_movement_logs" ADD CONSTRAINT "class_movement_logs_toClassId_fkey" FOREIGN KEY ("toClassId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_movement_logs" ADD CONSTRAINT "class_movement_logs_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
