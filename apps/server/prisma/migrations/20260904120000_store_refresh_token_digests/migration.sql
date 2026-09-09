-- AlterTable
ALTER TABLE "refresh_tokens" RENAME COLUMN "token" TO "tokenHash";

-- AlterIndex
ALTER INDEX "refresh_tokens_token_key" RENAME TO "refresh_tokens_tokenHash_key";