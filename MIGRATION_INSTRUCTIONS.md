# Database Migration Instructions

## Add Password Column to Questionnaires Table

The password protection feature requires a new column in the `questionnaires` table.

### Steps to Run the Migration:

1. **Go to Supabase SQL Editor:**
   - Visit: https://supabase.com/dashboard/project/gzzgsyeqpnworczllraa/sql
   - Or navigate to: Your Project → SQL Editor

2. **Run this SQL command:**

```sql
ALTER TABLE questionnaires
ADD COLUMN IF NOT EXISTS password TEXT NULL;
```

3. **Click "Run" or press Ctrl+Enter**

4. **Verify the migration:**
   - The column should be added successfully
   - You can verify by going to Table Editor → questionnaires table
   - You should see a new "password" column

### What This Does:
- Adds an optional `password` column to the `questionnaires` table
- The column is nullable (NULL), meaning questionnaires without passwords will have NULL values
- Questionnaires with passwords will store them as plain text in this column

### After Migration:
Once the migration is complete, you can:
- Deploy the updated code to Vercel
- Admins can set passwords when creating/editing questionnaires
- Users will be prompted for passwords when accessing protected questionnaires
