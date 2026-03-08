import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/profitvision'

// User Schema (simplified)
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  country: String,
  isVerified: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

const User = mongoose.model('User', userSchema)

async function createTestUser() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    const testEmail = 'testuser@gmail.com'
    const testPassword = 'Test@123456'

    // Check if user exists
    const existingUser = await User.findOne({ email: testEmail })
    if (existingUser) {
      console.log('Test user already exists!')
      console.log('Email:', testEmail)
      console.log('Password: Test@123456')
      await mongoose.disconnect()
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(testPassword, 10)

    // Create user
    const newUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: testEmail,
      phone: '+911234567890',
      password: hashedPassword,
      country: 'India',
      isVerified: true
    })

    console.log('\n✅ Test User Created Successfully!')
    console.log('================================')
    console.log('Email:', testEmail)
    console.log('Password:', testPassword)
    console.log('User ID:', newUser._id)
    console.log('================================\n')

    await mongoose.disconnect()
  } catch (error) {
    console.error('Error:', error.message)
    await mongoose.disconnect()
  }
}

createTestUser()
