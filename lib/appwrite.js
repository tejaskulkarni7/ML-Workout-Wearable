import { Client, Account, ID, Databases, Functions } from 'react-native-appwrite';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Alert } from 'react-native';

export const appwriteConfig = {
  endpoint: "https://cloud.appwrite.io/v1",
  platform: "com.tsm.workout",
  projectId: "674bb1a1001f9f5dc434",
  databaseId: "674cb1fa0017efe23138",
  userCollectionId: "674cb278002e8af8ae5c",
  goalCollectionId: "674cb2a10020270cd316",
  workoutCollectionId: "674cbdba000e1ece18ae",
  setCollectionId: "674cbe2000109e9f72eb"
};

// Init your React Native SDK
export const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint) // Your Appwrite Endpoint
  .setProject(appwriteConfig.projectId) // Your project ID
  .setPlatform(appwriteConfig.platform); // Your application ID or bundle ID.
  

export const account = new Account(client);
export const databases = new Databases(client);
const functions = new Functions(client);

export async function createUser(email, password, username) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if (!newAccount) throw Error;
    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email: email,
        username: username,
      }
    ).catch(error => {
      console.log('Error creating user document:', error);
      throw new Error(error);
    });
    

    return newUser;
  } catch (error) {
    throw new Error(error);
  }
}

// Sign In
// Sign In
export async function signIn(email, password) {
  try {
    const existingSession = await account.getSession('current').catch(() => null);

    if (existingSession) {
      console.log('User is already logged in:', existingSession);
      return existingSession; // Return the existing session
    }

    // Create a new session if none exists
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (error) {
    console.error('Error during sign-in:', error);

    if (error.code === 401) {
      throw new Error('Invalid email or password. Please try again.');
    } else if (error.code === 404) {
      throw new Error('User not found. Please sign up first.');
    } else {
      throw new Error('An unexpected error occurred. Please try again later.');
    }
  }
}


// Logout function
export async function logout() {
  try {
    // Delete the current session (log the user out)
    await account.deleteSession('current');
    await SecureStore.deleteItemAsync('email'); // Example, replace with your actual keys
    await SecureStore.deleteItemAsync('password');

    console.log('User logged out successfully.');

    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    throw new Error('Failed to log out. Please try again.');
  }
}


// This function will call your cloud function to delete the account
export async function deleteAccount() {
  try {
    // Get the current logged-in user's details
    const user = await account.get();

    // Prepare payload to send to the cloud function (stringified)
    const payload = JSON.stringify({
      userId: user.$id // Send the user ID to the cloud function
    });

    // Call the cloud function to delete the account
    const response = await functions.createExecution('6754b2fc000ef1a0c649', '674dfbb1001b4f09e442');

    // Log the raw response to understand its structure
    console.log('Cloud function response:', response);

    // Safely parse the response body
    let output;
    try {
      output = JSON.parse(response.response);
    } catch (parseError) {
      console.error('Error parsing response:', response.response);
      throw new Error('Invalid response format from cloud function.');
    }

    // Check the result
    if (output && output.success) {
      console.log('Account and related data deleted successfully');
    } else {
      console.error('Error deleting account:', output?.message || 'Unknown error');
    }

    return true;
  } catch (error) {
    console.error('Error deleting account:', error.message || error);
    throw new Error('Failed to delete account. Please try again.');
  }
}


export async function newGoalFunction(exercise, goal) {
  try {
    console.log('Creating goal:', exercise, goal);

    // Convert goal to an integer
    const reps_goal = parseInt(goal, 10);
    if (isNaN(reps_goal)) {
      throw new Error('Goal must be a valid number.');
    }

    // Get the current user
    const user = await account.get();
    const user_id = user.$id;

    // Get the current timestamp
    const createdAt = new Date().toISOString();

    // Save the goal in the database
    const response = await databases.createDocument(
      appwriteConfig.databaseId, // Replace with your actual database ID
      appwriteConfig.goalCollectionId, // Replace with your actual collection ID
      'unique()', // Auto-generate a unique document ID
      { 
        exercise: exercise,
        reps_goal: reps_goal,
        current_rep: 0, 
        user_id: user_id,
        createdAt: createdAt // Add the timestamp field
      }
    );

    console.log('Goal created successfully:', response);
    return response; // Return response for confirmation or logging
  } catch (error) {
    console.error('Error creating goal:', error.message || error);
    throw new Error('Failed to create goal. Please try again.');
  }
}

export async function deleteGoal(goalId) {
  try {
    // Ensure the goalId is provided
    if (!goalId) {
      throw new Error("Goal ID is required to delete a goal.");
    }

    // Delete the goal document
    await databases.deleteDocument(
      appwriteConfig.databaseId, 
      appwriteConfig.goalCollectionId, 
      goalId
    );
    router.push('/goals');
    Alert.alert('Success', 'Goal deleted successfully');
    console.log(`Goal with ID ${goalId} deleted successfully.`);
  } catch (error) {
    console.error("Error deleting goal:", error.message || error);
    throw new Error("Failed to delete goal. Please try again.");
  }
}





