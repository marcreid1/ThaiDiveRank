#!/usr/bin/env tsx

/**
 * Authentication and Voting Flow Test Script
 * 
 * This script tests the complete user authentication and voting functionality:
 * 1. Sign up a new test user
 * 2. Verify JWT token is returned
 * 3. Use token to submit a vote
 * 4. Retrieve user's votes to verify storage
 * 5. Confirm vote includes correct userId
 * 6. Clean up test data
 */

interface SignUpResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    createdAt: string;
  };
}

interface VoteResponse {
  message: string;
  vote: {
    id: number;
    winnerId: number;
    loserId: number;
    pointsChanged: number;
    userId: string;
    timestamp: string;
  };
}

interface MyVotesResponse {
  message: string;
  votes: Array<{
    id: number;
    winnerId: number;
    loserId: number;
    pointsChanged: number;
    userId: string;
    timestamp: string;
  }>;
}

class APITester {
  private baseUrl: string;
  private testEmail: string;
  private testPassword: string;
  private authToken: string | null = null;
  private testUserId: string | null = null;
  private createdVoteId: number | null = null;

  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    this.testEmail = `testuser-${Date.now()}@example.com`; // Unique email for each test
    this.testPassword = 'Test1234!';
  }

  private async makeRequest(
    endpoint: string, 
    method: 'GET' | 'POST' | 'DELETE' = 'GET', 
    body?: any,
    useAuth = false
  ): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (useAuth && this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && method === 'POST') {
      config.body = JSON.stringify(body);
    }

    console.log(`📡 ${method} ${this.baseUrl}${endpoint}`);
    if (body) {
      console.log(`📤 Request body:`, body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    
    console.log(`📥 Response status: ${response.status} ${response.statusText}`);
    
    return response;
  }

  async step1_SignUp(): Promise<boolean> {
    console.log('\n🔧 Step 1: Testing user sign-up');
    console.log(`📧 Test email: ${this.testEmail}`);
    
    try {
      const response = await this.makeRequest('/api/signup', 'POST', {
        email: this.testEmail,
        hashedPassword: this.testPassword
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Sign-up failed: ${error}`);
        return false;
      }

      const data: SignUpResponse = await response.json();
      console.log(`✅ Sign-up successful`);
      console.log(`🔑 JWT token received: ${data.token.substring(0, 20)}...`);
      console.log(`👤 User ID: ${data.user.id}`);
      
      this.authToken = data.token;
      this.testUserId = data.user.id;
      
      // Verify JWT token format
      const tokenParts = data.token.split('.');
      if (tokenParts.length !== 3) {
        console.error('❌ Invalid JWT token format');
        return false;
      }
      
      console.log('✅ JWT token format is valid');
      return true;
    } catch (error) {
      console.error('❌ Sign-up request failed:', error);
      return false;
    }
  }

  async step2_SubmitVote(): Promise<boolean> {
    console.log('\n🗳️  Step 2: Testing authenticated vote submission');
    
    if (!this.authToken) {
      console.error('❌ No auth token available');
      return false;
    }

    try {
      const votePayload = {
        winnerId: 1,
        loserId: 2,
        pointsChanged: 32 // ELO points
      };

      const response = await this.makeRequest('/api/vote', 'POST', votePayload, true);

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Vote submission failed: ${error}`);
        return false;
      }

      const data: VoteResponse = await response.json();
      console.log(`✅ Vote submitted successfully`);
      console.log(`🎯 Vote ID: ${data.vote.id}`);
      console.log(`🏆 Winner: Site ${data.vote.winnerId}, Loser: Site ${data.vote.loserId}`);
      console.log(`📊 Points changed: ${data.vote.pointsChanged}`);
      console.log(`👤 User ID: ${data.vote.userId}`);
      
      this.createdVoteId = data.vote.id;
      
      // Verify the vote includes the correct userId
      if (data.vote.userId !== this.testUserId) {
        console.error(`❌ Vote userId mismatch. Expected: ${this.testUserId}, Got: ${data.vote.userId}`);
        return false;
      }
      
      console.log('✅ Vote userId matches authenticated user');
      return true;
    } catch (error) {
      console.error('❌ Vote submission request failed:', error);
      return false;
    }
  }

  async step3_RetrieveMyVotes(): Promise<boolean> {
    console.log('\n📋 Step 3: Testing retrieval of user votes');
    
    if (!this.authToken) {
      console.error('❌ No auth token available');
      return false;
    }

    try {
      const response = await this.makeRequest('/api/my-votes', 'GET', undefined, true);

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ My votes retrieval failed: ${error}`);
        return false;
      }

      const data: MyVotesResponse = await response.json();
      console.log(`✅ Retrieved user votes successfully`);
      console.log(`📊 Total votes: ${data.votes.length}`);
      
      if (data.votes.length === 0) {
        console.error('❌ No votes found for user');
        return false;
      }

      // Find our created vote
      const ourVote = data.votes.find(vote => vote.id === this.createdVoteId);
      if (!ourVote) {
        console.error(`❌ Created vote (ID: ${this.createdVoteId}) not found in user votes`);
        return false;
      }

      console.log(`✅ Found our created vote in user's vote history`);
      console.log(`🎯 Vote details: Winner ${ourVote.winnerId} vs Loser ${ourVote.loserId}`);
      console.log(`👤 Vote userId: ${ourVote.userId}`);
      
      // Verify userId matches
      if (ourVote.userId !== this.testUserId) {
        console.error(`❌ Retrieved vote userId mismatch. Expected: ${this.testUserId}, Got: ${ourVote.userId}`);
        return false;
      }

      console.log('✅ Retrieved vote userId matches authenticated user');
      return true;
    } catch (error) {
      console.error('❌ My votes retrieval request failed:', error);
      return false;
    }
  }

  async step4_TestUnauthenticatedAccess(): Promise<boolean> {
    console.log('\n🚫 Step 4: Testing unauthenticated access protection');
    
    try {
      // Test voting without token
      const response1 = await this.makeRequest('/api/vote', 'POST', {
        winnerId: 3,
        loserId: 4,
        pointsChanged: 32
      }, false);

      if (response1.ok) {
        console.error('❌ Vote endpoint should reject unauthenticated requests');
        return false;
      }
      console.log('✅ Vote endpoint properly rejects unauthenticated requests');

      // Test my-votes without token
      const response2 = await this.makeRequest('/api/my-votes', 'GET', undefined, false);
      
      if (response2.ok) {
        console.error('❌ My-votes endpoint should reject unauthenticated requests');
        return false;
      }
      console.log('✅ My-votes endpoint properly rejects unauthenticated requests');

      return true;
    } catch (error) {
      console.error('❌ Unauthenticated access test failed:', error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleanup: Removing test data');
    
    // Note: In a real test environment, you might want to add cleanup endpoints
    // For now, we'll just log what should be cleaned up
    console.log(`📧 Test user email: ${this.testEmail}`);
    console.log(`👤 Test user ID: ${this.testUserId}`);
    console.log(`🗳️  Test vote ID: ${this.createdVoteId}`);
    console.log('ℹ️  Manual cleanup may be required in the database');
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Authentication and Voting Flow Tests');
    console.log('=' .repeat(60));

    let allTestsPassed = true;

    // Step 1: Sign up
    if (!(await this.step1_SignUp())) {
      allTestsPassed = false;
    }

    // Step 2: Submit vote (only if sign-up succeeded)
    if (allTestsPassed && !(await this.step2_SubmitVote())) {
      allTestsPassed = false;
    }

    // Step 3: Retrieve votes (only if vote submission succeeded)
    if (allTestsPassed && !(await this.step3_RetrieveMyVotes())) {
      allTestsPassed = false;
    }

    // Step 4: Test protection
    if (!(await this.step4_TestUnauthenticatedAccess())) {
      allTestsPassed = false;
    }

    // Cleanup
    await this.cleanup();

    // Final results
    console.log('\n' + '='.repeat(60));
    if (allTestsPassed) {
      console.log('🎉 ALL TESTS PASSED! Authentication and voting flow is working correctly.');
    } else {
      console.log('❌ SOME TESTS FAILED! Please check the errors above.');
      process.exit(1);
    }
  }
}

// Run the tests
async function main() {
  const tester = new APITester();
  await tester.runAllTests();
}

// Auto-run if this is the main module
main().catch(console.error);

export { APITester };