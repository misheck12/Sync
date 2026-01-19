#!/bin/bash

echo "🚀 Setting up Enhanced CRM Features..."
echo ""

# Navigate to backend directory
cd backend

echo "📦 Step 1: Regenerating Prisma Client..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma client generated successfully!"
else
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo ""
echo "🔍 Step 2: Verifying migration status..."
npx prisma migrate status

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Restart your backend server: npm run dev"
echo "2. Test the new API endpoints"
echo "3. Check SETUP_ENHANCED_CRM.md for usage examples"
echo ""
echo "🎉 Enhanced CRM features are ready to use!"
