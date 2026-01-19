@echo off
echo.
echo 🚀 Setting up Enhanced CRM Features...
echo.

cd backend

echo 📦 Step 1: Regenerating Prisma Client...
call npx prisma generate

if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    exit /b 1
)

echo ✅ Prisma client generated successfully!
echo.

echo 🔍 Step 2: Verifying migration status...
call npx prisma migrate status

echo.
echo ✅ Setup complete!
echo.
echo 📝 Next steps:
echo 1. Restart your backend server: npm run dev
echo 2. Test the new API endpoints
echo 3. Check SETUP_ENHANCED_CRM.md for usage examples
echo.
echo 🎉 Enhanced CRM features are ready to use!
echo.
pause
