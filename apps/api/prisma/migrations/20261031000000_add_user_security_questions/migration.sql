CREATE TABLE "user_security_questions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_security_questions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_security_questions_user_id_position_key"
ON "user_security_questions"("user_id", "position");

ALTER TABLE "user_security_questions"
ADD CONSTRAINT "user_security_questions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
