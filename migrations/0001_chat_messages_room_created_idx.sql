CREATE INDEX IF NOT EXISTS "IDX_chat_messages_room_created" ON "chat_messages" ("chat_room", "created_at");
