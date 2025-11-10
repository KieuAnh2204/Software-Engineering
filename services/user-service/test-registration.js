/**
 * Script để test Registration Flow với dữ liệu mẫu
 * Chạy: node test-registration.js
 */

const API_BASE_URL = 'http://localhost:5001/api/auth';

// ============ TEST DATA ============
const testCustomers = [
  {
    email: 'customer1@test.com',
    password: 'password123',
    fullName: 'Nguyễn Văn A',
    phone: '0901234567',
    address: {
      street: '123 Lê Lợi',
      ward: 'Phường Bến Nghé',
      district: 'Quận 1',
      city: 'Hồ Chí Minh'
    }
  },
  {
    email: 'customer2@test.com',
    password: 'password123',
    fullName: 'Trần Thị B',
    phone: '0907654321',
    address: {
      street: '456 Nguyễn Huệ',
      ward: 'Phường Bến Thành',
      district: 'Quận 1',
      city: 'Hồ Chí Minh'
    }
  }
];

const testBrandManagers = [
  {
    email: 'pho24@restaurant.com',
    password: 'password123',
    fullName: 'Lê Văn C',
    phone: '0912345678',
    brandName: 'Phở 24',
    restaurantName: 'Phở 24 - Chi nhánh Quận 1',
    address: {
      street: '789 Pasteur',
      ward: 'Phường 6',
      district: 'Quận 3',
      city: 'Hồ Chí Minh'
    }
  },
  {
    email: 'comtam@restaurant.com',
    password: 'password123',
    fullName: 'Phạm Thị D',
    phone: '0923456789',
    brandName: 'Cơm Tấm Sườn Nướng',
    restaurantName: 'Cơm Tấm Sườn Nướng - Chi nhánh Tân Bình',
    address: {
      street: '321 Cộng Hòa',
      ward: 'Phường 13',
      district: 'Quận Tân Bình',
      city: 'Hồ Chí Minh'
    }
  }
];

// ============ HELPER FUNCTIONS ============
async function registerCustomer(customerData) {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Customer registered successfully:');
      console.log(`   Email: ${customerData.email}`);
      console.log(`   Name: ${data.data.customer.name}`);
      console.log(`   Customer ID: ${data.data.customer.id}`);
      console.log(`   User ID: ${data.data.user.id}`);
      console.log('');
      return data;
    } else {
      console.log('❌ Failed to register customer:');
      console.log(`   Email: ${customerData.email}`);
      console.log(`   Error: ${data.message}`);
      console.log('');
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function registerBrandManager(managerData) {
  try {
    const response = await fetch(`${API_BASE_URL}/register-restaurant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(managerData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Brand Manager registered successfully:');
      console.log(`   Email: ${managerData.email}`);
      console.log(`   Brand: ${data.data.brand.name}`);
      console.log(`   Restaurant: ${data.data.restaurant.name}`);
      console.log(`   Brand ID: ${data.data.brand.id}`);
      console.log(`   Restaurant ID: ${data.data.restaurant.id}`);
      console.log(`   User ID: ${data.data.user.id}`);
      console.log('');
      return data;
    } else {
      console.log('❌ Failed to register brand manager:');
      console.log(`   Email: ${managerData.email}`);
      console.log(`   Error: ${data.message}`);
      console.log('');
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// ============ MAIN TEST FUNCTION ============
async function runTests() {
  console.log('========================================');
  console.log('🧪 TESTING REGISTRATION FLOW');
  console.log('========================================\n');

  console.log('📋 Testing Customer Registration...\n');
  for (const customer of testCustomers) {
    await registerCustomer(customer);
  }

  console.log('📋 Testing Brand Manager Registration...\n');
  for (const manager of testBrandManagers) {
    await registerBrandManager(manager);
  }

  console.log('========================================');
  console.log('✅ ALL TESTS COMPLETED');
  console.log('========================================');
}

// Run tests
runTests();
