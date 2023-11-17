-- CreateTable
CREATE TABLE "device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "me" BOOLEAN NOT NULL,
    "synced_at" DATETIME NOT NULL,
    "sync_enabled" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "thread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "display_mode" TEXT NOT NULL,
    "trash" BOOLEAN NOT NULL,
    "deleted" BOOLEAN NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "modified_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "trash" BOOLEAN NOT NULL,
    "deleted" BOOLEAN NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "modified_at" DATETIME NOT NULL,
    CONSTRAINT "note_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "thread" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "note_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
