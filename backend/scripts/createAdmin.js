import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';

const MONGODB_URI = 'mongodb://localhost:27017/profitvisionfx';

async function createAdmin() {
  await mongoose.connect(MONGODB_URI);
  
  const existingAdmin = await Admin.findOne({ email: 'admin@profitvisionfx.com' });
  if (existingAdmin) {
    console.log('Admin already exists, deleting...');
    await Admin.deleteOne({ email: 'admin@profitvisionfx.com' });
  }
  
  const hashedPassword = await bcrypt.hash('ProfitVision@2026!', 10);
  
  const admin = new Admin({
    email: 'admin@profitvisionfx.com',
    password: hashedPassword,
    firstName: 'Super',
    lastName: 'Admin',
    role: 'SUPER_ADMIN',
    urlSlug: 'main',
    brandName: 'ProfitVision FX',
    status: 'ACTIVE',
    permissions: {
      canManageUsers: true,
      canCreateUsers: true,
      canDeleteUsers: true,
      canViewUsers: true,
      canManageTrades: true,
      canCloseTrades: true,
      canModifyTrades: true,
      canManageAccounts: true,
      canCreateAccounts: true,
      canDeleteAccounts: true,
      canModifyLeverage: true,
      canManageDeposits: true,
      canApproveDeposits: true,
      canManageWithdrawals: true,
      canApproveWithdrawals: true,
      canManageKYC: true,
      canApproveKYC: true,
      canManageIB: true,
      canApproveIB: true,
      canManageCopyTrading: true,
      canApproveMasters: true,
      canManageSymbols: true,
      canManageGroups: true,
      canManageSettings: true,
      canManageTheme: true,
      canViewReports: true,
      canExportReports: true,
      canManageAdmins: true,
      canFundAdmins: true
    }
  });
  
  await admin.save();
  console.log('Admin created successfully!');
  console.log('Email: admin@profitvisionfx.com');
  console.log('Password: ProfitVision@2026!');
  
  await mongoose.disconnect();
}

createAdmin().catch(console.error);
