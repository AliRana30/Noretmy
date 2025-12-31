require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Job = require('../models/Job');
const UserProfile = require('../models/UserProfile');

async function seedSampleData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB!\n');

    // Create sample users
    console.log('👤 Creating sample users...');
    
    const hashedPassword = await bcrypt.hash('Test123!', 10);
    
    const sampleUsers = [
      {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: hashedPassword,
        isSeller: true,
        isVerified: true,
      },
      {
        fullName: 'Jane Smith',
        email: 'jane.smith@example.com',
        username: 'janesmith',
        password: hashedPassword,
        isSeller: true,
        isVerified: true,
      },
      {
        fullName: 'Bob Wilson',
        email: 'bob.wilson@example.com',
        username: 'bobwilson',
        password: hashedPassword,
        isSeller: true,
        isVerified: true,
      }
    ];

    // Clear existing sample users
    await User.deleteMany({ email: { $in: sampleUsers.map(u => u.email) } });
    
    const createdUsers = await User.insertMany(sampleUsers);
    console.log(`✅ Created ${createdUsers.length} sample users`);

    // Create user profiles
    console.log('\n📝 Creating user profiles...');
    const userProfiles = createdUsers.map(user => ({
      userId: user._id,
      profilePicture: 'https://res.cloudinary.com/dqytzakzv/image/upload/v1234567890/sample-avatar.jpg',
      profileHeadline: `Professional ${['Developer', 'Designer', 'Writer'][Math.floor(Math.random() * 3)]}`,
      location: ['New York', 'London', 'Tokyo'][Math.floor(Math.random() * 3)],
      countryCode: ['US', 'GB', 'JP'][Math.floor(Math.random() * 3)],
      description: 'Experienced professional with 5+ years in the industry.',
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB']
    }));

    await UserProfile.deleteMany({ userId: { $in: createdUsers.map(u => u._id) } });
    await UserProfile.insertMany(userProfiles);
    console.log(`✅ Created ${userProfiles.length} user profiles`);

    // Create sample jobs
    console.log('\n💼 Creating sample jobs...');
    
    const categories = [
      { cat: 'Programming & Tech', subCat: 'Web Development' },
      { cat: 'Graphics & Design', subCat: 'Logo Design' },
      { cat: 'Writing & Translation', subCat: 'Content Writing' },
      { cat: 'Digital Marketing', subCat: 'Social Media Marketing' },
      { cat: 'Video & Animation', subCat: 'Video Editing' },
    ];

    const sampleJobs = [];
    
    for (let i = 0; i < 15; i++) {
      const user = createdUsers[i % createdUsers.length];
      const category = categories[i % categories.length];
      
      sampleJobs.push({
        title: `Professional ${category.subCat} Service ${i + 1}`,
        cat: category.cat,
        subCat: category.subCat,
        description: `High-quality ${category.subCat} service with professional results. I have years of experience and will deliver exceptional work tailored to your needs.`,
        keywords: ['professional', 'quality', 'fast', 'reliable', 'experienced'],
        whyChooseMe: [
          'Fast delivery',
          'High quality work',
          'Excellent communication',
          '100% satisfaction guaranteed'
        ],
        pricingPlan: {
          basic: {
            title: 'Basic Package',
            description: 'Essential service package',
            price: 50 + (i * 10),
            deliveryTime: 3
          },
          premium: {
            title: 'Premium Package',
            description: 'Advanced service package',
            price: 100 + (i * 20),
            deliveryTime: 5
          },
          pro: {
            title: 'Pro Package',
            description: 'Complete service package',
            price: 200 + (i * 30),
            deliveryTime: 7
          }
        },
        discount: i % 3 === 0 ? 10 : 0,
        addons: {
          title: 'Extra Fast Delivery',
          extraService: 20
        },
        faqs: [
          {
            question: 'What is included in the package?',
            answer: 'All necessary files and revisions are included.'
          },
          {
            question: 'Do you offer revisions?',
            answer: 'Yes, unlimited revisions until you are satisfied.'
          }
        ],
        jobStatus: 'active',
        photos: [
          'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
          'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800'
        ],
        upgradeOption: i < 5 ? 'homepage' : (i < 10 ? 'premium' : 'standard'),
        sellerId: user._id.toString(),
        totalStars: Math.floor(Math.random() * 50) + 10,
        starNumber: Math.floor(Math.random() * 10) + 2,
        sales: Math.floor(Math.random() * 100),
        payment_intent: 'Free'
      });
    }

    await Job.deleteMany({ sellerId: { $in: createdUsers.map(u => u._id.toString()) } });
    const createdJobs = await Job.insertMany(sampleJobs);
    console.log(`✅ Created ${createdJobs.length} sample jobs`);

    console.log('\n📊 Summary:');
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   User Profiles: ${await UserProfile.countDocuments()}`);
    console.log(`   Jobs: ${await Job.countDocuments()}`);
    console.log(`   Featured Jobs (homepage): ${await Job.countDocuments({ upgradeOption: 'homepage' })}`);

    console.log('\n✨ Sample data seeded successfully!');
    console.log('\n🔐 Test login credentials:');
    console.log('   Email: john.doe@example.com');
    console.log('   Password: Test123!');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
    process.exit(0);
  }
}

seedSampleData();
