// Test users for development - DO NOT USE IN PRODUCTION
export const testUsers = {
  // Platform Admin - HetheTrack team member
  admin: {
    email: 'admin@hethetrack.com',
    password: 'TestAdmin123!',
    userType: 'platform_admin',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    company: 'HetheTrack',
    description: 'Platform administrator with full system access'
  },

  // Business User - Consultant managing tenements
  consultant: {
    email: 'consultant@hetherington.com.au',
    password: 'TestConsultant123!',
    userType: 'business_user',
    firstName: 'James',
    lastName: 'Thompson',
    company: 'Hetherington Mining Consultants',
    description: 'Mining consultant managing tenement responsibilities'
  },

  // Client - Tenement holder/stakeholder
  client: {
    email: 'client@miningcorp.com.au',
    password: 'TestClient123!',
    userType: 'client',
    firstName: 'Michael',
    lastName: 'Chen',
    company: 'Australian Mining Corp',
    description: 'Mining company stakeholder and tenement holder'
  }
};

// Helper function to get test user by type
export const getTestUserByType = (userType: 'platform_admin' | 'business_user' | 'client') => {
  switch (userType) {
    case 'platform_admin':
      return testUsers.admin;
    case 'business_user':
      return testUsers.consultant;
    case 'client':
      return testUsers.client;
    default:
      return testUsers.client;
  }
};

// Display information for login page
export const getTestUserCredentials = () => {
  return {
    'Platform Admin': {
      email: testUsers.admin.email,
      password: testUsers.admin.password,
      name: `${testUsers.admin.firstName} ${testUsers.admin.lastName}`,
      company: testUsers.admin.company
    },
    'Business User': {
      email: testUsers.consultant.email,
      password: testUsers.consultant.password,
      name: `${testUsers.consultant.firstName} ${testUsers.consultant.lastName}`,
      company: testUsers.consultant.company
    },
    'Client': {
      email: testUsers.client.email,
      password: testUsers.client.password,
      name: `${testUsers.client.firstName} ${testUsers.client.lastName}`,
      company: testUsers.client.company
    }
  };
};
