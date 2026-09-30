require('dotenv').config();
const mongoose = require('mongoose');

// === Connect to MongoDB ===
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shop_mongoose_db';

mongoose.connect(MONGO_URI)
  .then(() => console.log("✓ Successfully connected to MongoDB via Mongoose!\n"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ============================================
// === Define User Schema ===
// ============================================
const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
  age: {
    type: Number,
    min: [18, 'User age must be at least 18'],
    max: [100, 'Invalid age']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'manager'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // === QUESTION 1: Custom validation - Vietnam phone number ===
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^(03|05|07|08|09)\d{8}$/.test(v);
      },
      message: 'Invalid Vietnam phone number (must start with 03/05/07/08/09 and have 10 digits)'
    }
  },
  // === QUESTION 4: Soft delete ===
  isDeleted: {
    type: Boolean,
    default: false
  },
  // === QUESTION 5: Password field ===
  password: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// ============================================
// === QUESTION 2: Virtual properties ===
// ============================================
userSchema.virtual('displayInfo').get(function() {
  return `${this.fullName} <${this.email}> [${this.role.toUpperCase()}]`;
});

userSchema.set('toJSON', { virtuals: true });

// ============================================
// === QUESTION 3: Static methods ===
// ============================================
userSchema.statics.findActiveByRole = function(roleName) {
  return this.find({ role: roleName, isActive: true }).sort({ fullName: 1 });
};

// ============================================
// === QUESTION 4: Instance methods - Soft delete ===
// ============================================
userSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.isActive = false;
  return this.save();
};

// ============================================
// === QUESTION 5: Middleware hooks ===
// ============================================
userSchema.pre('save', function() {
  if (this.password && !this.password.startsWith('***hashed***')) {
    this.password = '***hashed***' + this.password.substring(0, 3) + '...';
    console.log(`   [Pre-save middleware] Password has been hashed`);
  }
});

userSchema.pre(/^find/, function() {
  this.where({ isDeleted: { $ne: true } });
});

// ============================================
// === Create Model from Schema ===
// ============================================
const User = mongoose.model('User', userSchema);

// ============================================
// === BASIC CRUD OPERATIONS ===
// ============================================
async function basicCRUD() {
  try {
    await User.deleteMany({});
    console.log("🗑️  Old data cleared\n");

    console.log("=".repeat(80));
    console.log("📝 === BASIC CRUD: CREATE ===");
    console.log("=".repeat(80));
    const newUser = await User.create({
      fullName: "Nguyen Van Hung",
      email: "hung.nguyen@example.com",
      age: 22,
      role: "admin",
      phone: "0912345678"
    });
    console.log("✓ New user created:");
    console.log({
      'ID': newUser._id,
      'Name': newUser.fullName,
      'Email': newUser.email,
      'Phone': newUser.phone
    });
    console.log();

    console.log("=".repeat(80));
    console.log("🔍 === BASIC CRUD: READ ===");
    console.log("=".repeat(80));
    const foundUser = await User.findOne({ email: "hung.nguyen@example.com" });
    console.log("✓ User found:");
    console.log({
      'Name': foundUser.fullName,
      'Email': foundUser.email,
      'Role': foundUser.role
    });
    console.log();

    console.log("=".repeat(80));
    console.log("✏️  === BASIC CRUD: UPDATE ===");
    console.log("=".repeat(80));
    const updatedUser = await User.findByIdAndUpdate(
      newUser._id,
      { age: 23, role: "manager" },
      { returnDocument: 'after', runValidators: true }
    );
    console.log("✓ User after update:");
    console.log({
      'Name': updatedUser.fullName,
      'Age (22 → 23)': updatedUser.age,
      'Role (admin → manager)': updatedUser.role
    });
    console.log();

  } catch (error) {
    console.error("❌ CRUD Error:", error.message);
  }
}

// ============================================
// === QUESTION 1: Custom validation ===
// ============================================
async function question1() {
  console.log("=".repeat(80));
  console.log("❓ QUESTION 1: Custom validation - Vietnam phone number");
  console.log("=".repeat(80));
  console.log("📋 Requirement: Check Vietnam phone number format\n");

  try {
    console.log("✅ Test 1: Valid phone number");
    const validUser = await User.create({
      fullName: "Tran Thi Mai",
      email: "mai.tran@example.com",
      age: 25,
      phone: "0987654321"
    });
    console.log(`✓ User created successfully with phone: ${validUser.phone}\n`);

    console.log("❌ Test 2: Try invalid phone number");
    try {
      await User.create({
        fullName: "Test User",
        email: "test@example.com",
        age: 20,
        phone: "0123456789"
      });
    } catch (err) {
      console.log(`✓ Validation error caught: ${err.errors.phone.message}\n`);
    }

    console.log("📌 Explanation:");
    console.log("   - Validate phone field with regex pattern");
    console.log("   - /^(03|05|07|08|09)\\d{8}$/ - Valid Vietnam phone\n");

  } catch (error) {
    console.error("❌ Q1 Error:", error.message);
  }
}

// ============================================
// === QUESTION 2: Virtual properties ===
// ============================================
async function question2() {
  console.log("=".repeat(80));
  console.log("❓ QUESTION 2: Virtual properties & Formatting");
  console.log("=".repeat(80));
  console.log("📋 Requirement: Create virtual field displayInfo\n");

  try {
    const user = await User.findOne({ email: "hung.nguyen@example.com" });
    
    console.log("✅ Virtual field displayInfo:");
    console.log(`   ${user.displayInfo}\n`);

    console.log("📌 Explanation:");
    console.log("   - Virtual property: Field not stored in DB");
    console.log("   - Computed from other fields (getter)\n");

  } catch (error) {
    console.error("❌ Q2 Error:", error.message);
  }
}

// ============================================
// === QUESTION 3: Static methods ===
// ============================================
async function question3() {
  console.log("=".repeat(80));
  console.log("❓ QUESTION 3: Static methods");
  console.log("=".repeat(80));
  console.log("📋 Requirement: Static method findActiveByRole(roleName)\n");

  try {
    await User.create([
      {
        fullName: "Admin User 1",
        email: "admin1@example.com",
        age: 30,
        role: "admin",
        isActive: true
      },
      {
        fullName: "Admin User 2",
        email: "admin2@example.com",
        age: 35,
        role: "admin",
        isActive: true
      }
    ]);

    console.log("✅ Find all active admins (sorted A-Z):");
    const adminUsers = await User.findActiveByRole('admin');
    adminUsers.forEach(user => {
      console.log(`   - ${user.fullName} (${user.email})`);
    });
    console.log();

    console.log("📌 Explanation:");
    console.log("   - Static method: Called on Model, not instance");
    console.log("   - User.findActiveByRole() - Find users by role & isActive\n");

  } catch (error) {
    console.error("❌ Q3 Error:", error.message);
  }
}

// ============================================
// === QUESTION 4: Instance methods - Soft delete ===
// ============================================
async function question4() {
  console.log("=".repeat(80));
  console.log("❓ QUESTION 4: Instance methods - Soft delete");
  console.log("=".repeat(80));
  console.log("📋 Requirement: Instance method softDelete()\n");

  try {
    const user = await User.findOne({ email: "mai.tran@example.com" });
    
    if (user) {
      console.log("✅ User before softDelete:");
      console.log(`   - Name: ${user.fullName}`);
      console.log(`   - isDeleted: ${user.isDeleted}`);
      console.log(`   - isActive: ${user.isActive}\n`);

      await user.softDelete();

      console.log("✓ After calling softDelete():");
      console.log(`   - isDeleted: ${user.isDeleted}`);
      console.log(`   - isActive: ${user.isActive}\n`);

      console.log("📌 Explanation:");
      console.log("   - Instance method: Called on document, not Model\n");
    }

  } catch (error) {
    console.error("❌ Q4 Error:", error.message);
  }
}

// ============================================
// === QUESTION 5: Middleware hooks ===
// ============================================
async function question5() {
  console.log("=".repeat(80));
  console.log("❓ QUESTION 5: Middleware hooks - pre-save & pre-find");
  console.log("=".repeat(80));
  console.log("📋 Requirement:\n");
  console.log("   1. Pre-save: Hash password before saving");
  console.log("   2. Pre-find: Auto-filter deleted documents\n");

  try {
    console.log("✅ Test 1: Pre-save - Hash password");
    const userWithPassword = await User.create({
      fullName: "Password User",
      email: "pwd.user@example.com",
      age: 26,
      password: "mysecretpassword123"
    });
    console.log(`✓ Password hashed: ${userWithPassword.password}\n`);

    console.log("✅ Test 2: Pre-find - Auto-filter deleted documents");
    const activeUsers = await User.find({});
    console.log(`✓ Total active users (deleted filtered out): ${activeUsers.length}\n`);

    console.log("📌 Explanation:");
    console.log("   - pre('save'): Run before document is saved");
    console.log("   - pre(/^find/): Run before any find query\n");

  } catch (error) {
    console.error("❌ Q5 Error:", error.message);
  }
}

// ============================================
// === Main function ===
// ============================================
async function main() {
  try {
    await basicCRUD();
    await question1();
    await question2();
    await question3();
    await question4();
    await question5();

    console.log("=".repeat(80));
    console.log("✅ EXERCISE 3 (Q1-Q5) COMPLETED!");
    console.log("=".repeat(80));

  } catch (error) {
    console.error("❌ Main Error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("\n✓ MongoDB connection closed.\n");
  }
}

main();