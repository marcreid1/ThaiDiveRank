const assert = require('assert');

// Test configuration
const BASE_URL = 'http://localhost:5000';

// Test data
const testUsers = [
  {
    email: 'testuser1@example.com',
    password: 'password123',
    name: 'Test User 1'
  },
  {
    email: 'testuser2@example.com', 
    password: 'password456',
    name: 'Test User 2'
  }
];

// Helper function to make HTTP requests
async function makeRequest(method, url, data = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  const responseData = await response.json();
  
  return {
    status: response.status,
    data: responseData
  };
}

// Main test function
async function testUserVoteIsolation() {
  console.log('🧪 Starting User Vote Isolation Test');
  
  try {
    // Step 1: Sign up both users
    console.log('\n1️⃣ Signing up test users...');
    
    const user1Signup = await makeRequest('POST', `${BASE_URL}/api/signup`, testUsers[0]);
    const user2Signup = await makeRequest('POST', `${BASE_URL}/api/signup`, testUsers[1]);
    
    if (user1Signup.status !== 201 && user1Signup.status !== 409) {
      throw new Error(`User 1 signup failed: ${user1Signup.data.message}`);
    }
    
    if (user2Signup.status !== 201 && user2Signup.status !== 409) {
      throw new Error(`User 2 signup failed: ${user2Signup.data.message}`);
    }
    
    console.log('✅ Users signed up successfully');

    // Step 2: Sign in both users to get tokens
    console.log('\n2️⃣ Signing in users...');
    
    const user1Signin = await makeRequest('POST', `${BASE_URL}/api/signin`, {
      email: testUsers[0].email,
      password: testUsers[0].password
    });
    
    const user2Signin = await makeRequest('POST', `${BASE_URL}/api/signin`, {
      email: testUsers[1].email,
      password: testUsers[1].password
    });
    
    if (user1Signin.status !== 200) {
      throw new Error(`User 1 signin failed: ${user1Signin.data.message}`);
    }
    
    if (user2Signin.status !== 200) {
      throw new Error(`User 2 signin failed: ${user2Signin.data.message}`);
    }
    
    const user1Token = user1Signin.data.token;
    const user2Token = user2Signin.data.token;
    
    console.log('✅ Users signed in successfully');
    console.log(`   User 1 ID: ${user1Signin.data.user.id}`);
    console.log(`   User 2 ID: ${user2Signin.data.user.id}`);

    // Step 3: Get available dive sites for voting
    console.log('\n3️⃣ Getting dive sites for voting...');
    
    const diveSites = await makeRequest('GET', `${BASE_URL}/api/dive-sites`);
    if (diveSites.status !== 200 || diveSites.data.length < 2) {
      throw new Error('Not enough dive sites available for testing');
    }
    
    const site1 = diveSites.data[0];
    const site2 = diveSites.data[1];
    const site3 = diveSites.data[2] || diveSites.data[0]; // Fallback if only 2 sites
    
    console.log('✅ Dive sites retrieved');
    console.log(`   Will use sites: ${site1.name}, ${site2.name}, ${site3.name}`);

    // Step 4: User 1 casts votes
    console.log('\n4️⃣ User 1 casting votes...');
    
    const user1Vote1 = await makeRequest('POST', `${BASE_URL}/api/vote`, {
      winnerId: site1.id,
      loserId: site2.id
    }, user1Token);
    
    const user1Vote2 = await makeRequest('POST', `${BASE_URL}/api/vote`, {
      winnerId: site1.id,
      loserId: site3.id
    }, user1Token);
    
    if (user1Vote1.status !== 200) {
      throw new Error(`User 1 vote 1 failed: ${user1Vote1.data.message}`);
    }
    
    if (user1Vote2.status !== 200) {
      throw new Error(`User 1 vote 2 failed: ${user1Vote2.data.message}`);
    }
    
    console.log('✅ User 1 cast 2 votes successfully');

    // Step 5: User 2 casts votes
    console.log('\n5️⃣ User 2 casting votes...');
    
    const user2Vote1 = await makeRequest('POST', `${BASE_URL}/api/vote`, {
      winnerId: site2.id,
      loserId: site1.id
    }, user2Token);
    
    const user2Vote2 = await makeRequest('POST', `${BASE_URL}/api/vote`, {
      winnerId: site3.id,
      loserId: site2.id
    }, user2Token);
    
    const user2Vote3 = await makeRequest('POST', `${BASE_URL}/api/vote`, {
      winnerId: site3.id,
      loserId: site1.id
    }, user2Token);
    
    if (user2Vote1.status !== 200) {
      throw new Error(`User 2 vote 1 failed: ${user2Vote1.data.message}`);
    }
    
    if (user2Vote2.status !== 200) {
      throw new Error(`User 2 vote 2 failed: ${user2Vote2.data.message}`);
    }
    
    if (user2Vote3.status !== 200) {
      throw new Error(`User 2 vote 3 failed: ${user2Vote3.data.message}`);
    }
    
    console.log('✅ User 2 cast 3 votes successfully');

    // Step 6: Verify User 1 can only see their own votes
    console.log('\n6️⃣ Verifying User 1 vote isolation...');
    
    const user1Votes = await makeRequest('GET', `${BASE_URL}/api/my-votes`, null, user1Token);
    
    if (user1Votes.status !== 200) {
      throw new Error(`Failed to get User 1 votes: ${user1Votes.data.message}`);
    }
    
    const user1VoteList = user1Votes.data.votes;
    console.log(`   User 1 sees ${user1VoteList.length} votes`);
    
    // Verify User 1 sees exactly 2 votes (their own)
    assert.strictEqual(user1VoteList.length, 2, 'User 1 should see exactly 2 votes');
    
    // Verify all votes belong to User 1
    for (const vote of user1VoteList) {
      assert.strictEqual(vote.userId, user1Signin.data.user.id, 
        `Vote ${vote.id} should belong to User 1`);
    }
    
    console.log('✅ User 1 vote isolation verified');

    // Step 7: Verify User 2 can only see their own votes
    console.log('\n7️⃣ Verifying User 2 vote isolation...');
    
    const user2Votes = await makeRequest('GET', `${BASE_URL}/api/my-votes`, null, user2Token);
    
    if (user2Votes.status !== 200) {
      throw new Error(`Failed to get User 2 votes: ${user2Votes.data.message}`);
    }
    
    const user2VoteList = user2Votes.data.votes;
    console.log(`   User 2 sees ${user2VoteList.length} votes`);
    
    // Verify User 2 sees exactly 3 votes (their own)
    assert.strictEqual(user2VoteList.length, 3, 'User 2 should see exactly 3 votes');
    
    // Verify all votes belong to User 2
    for (const vote of user2VoteList) {
      assert.strictEqual(vote.userId, user2Signin.data.user.id, 
        `Vote ${vote.id} should belong to User 2`);
    }
    
    console.log('✅ User 2 vote isolation verified');

    // Step 8: Cross-verify no vote overlap
    console.log('\n8️⃣ Cross-verifying no vote overlap...');
    
    const user1VoteIds = new Set(user1VoteList.map(v => v.id));
    const user2VoteIds = new Set(user2VoteList.map(v => v.id));
    
    // Check for any overlap in vote IDs
    const overlap = [...user1VoteIds].filter(id => user2VoteIds.has(id));
    assert.strictEqual(overlap.length, 0, 'Users should not see any overlapping votes');
    
    console.log('✅ No vote overlap confirmed');

    // Step 9: Verify unauthenticated access is blocked
    console.log('\n9️⃣ Verifying unauthenticated access is blocked...');
    
    const unauthenticatedVotes = await makeRequest('GET', `${BASE_URL}/api/my-votes`);
    assert.strictEqual(unauthenticatedVotes.status, 401, 
      'Unauthenticated requests should be rejected');
    
    console.log('✅ Unauthenticated access properly blocked');

    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ User vote isolation is working correctly');
    console.log('✅ Users can only see their own votes');
    console.log('✅ No data leakage between users');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

// Run the test
testUserVoteIsolation().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});