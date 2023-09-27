-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "me" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "editorId" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL,
    CONSTRAINT "Note_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "Device" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
