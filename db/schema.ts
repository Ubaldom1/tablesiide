import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const interests = sqliteTable('interests', {
 id: text('id').primaryKey(), email: text('email').notNull().unique(),
 name: text('name').notNull(), restaurant: text('restaurant').notNull(), city: text('city').notNull(),
 quantity: integer('quantity'), priceUsd: integer('price_usd'), finishes: text('finishes'),
 createdAt: text('created_at').notNull()
});
