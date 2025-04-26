import {
  Client,
  Account,
  ID,
  Databases,
  Functions,
} from "react-native-appwrite";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { Alert } from "react-native";
import { Query } from "react-native-appwrite";

export const appwriteConfig = {
  endpoint: "https://cloud.appwrite.io/v1",
  platform: "com.tsm.workout",
  projectId: "674bb1a1001f9f5dc434",
  databaseId: "674cb1fa0017efe23138",
  userCollectionId: "674cb278002e8af8ae5c",
  goalCollectionId: "674cb2a10020270cd316",
  workoutCollectionId: "674cbdba000e1ece18ae",
  setCollectionId: "674cbe2000109e9f72eb",
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
    const newUser = await databases
      .createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        ID.unique(),
        {
          accountId: newAccount.$id,
          email: email,
          username: username,
          weight: 75,
        }
      )
      .catch((error) => {
        console.log("Error creating user document:", error);
        throw new Error(error);
      });

    return newUser;
  } catch (error) {
    throw new Error(error);
  }
}

// Sign In
export async function signIn(email, password) {
  try {
    const existingSession = await account
      .getSession("current")
      .catch(() => null);

    if (existingSession) {
      console.log("User is already logged in:", existingSession);
      return existingSession; // Return the existing session
    }

    // Create a new session if none exists
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (error) {
    console.error("Error during sign-in:", error);

    if (error.code === 401) {
      throw new Error("Invalid email or password. Please try again.");
    } else if (error.code === 404) {
      throw new Error("User not found. Please sign up first.");
    } else {
      throw new Error("An unexpected error occurred. Please try again later.");
    }
  }
}

// Logout function
export async function logout() {
  try {
    // Delete the current session (log the user out)
    await account.deleteSession("current");
    await SecureStore.deleteItemAsync("email"); 
    await SecureStore.deleteItemAsync("password");

    console.log("User logged out successfully.");

    return true;
  } catch (error) {
    console.error("Error during logout:", error);
    throw new Error("Failed to log out. Please try again.");
  }
}

// This function will call your cloud function to delete the account
export async function deleteAccount() {
  try {
    // Get the current logged-in user's details
    const user = await account.get();

    // Prepare payload to send to the cloud function (stringified)
    const payload = JSON.stringify({
      userId: user.$id, // Send the user ID to the cloud function
    });

    // Call the cloud function to delete the account
    const response = await functions.createExecution(
      "6754b2fc000ef1a0c649",
      "674dfbb1001b4f09e442"
    );

    // Log the raw response to understand its structure
    console.log("Cloud function response:", response);

    // Safely parse the response body
    let output;
    try {
      output = JSON.parse(response.response);
    } catch (parseError) {
      console.error("Error parsing response:", response.response);
      throw new Error("Invalid response format from cloud function.");
    }

    // Check the result
    if (output && output.success) {
      console.log("Account and related data deleted successfully");
    } else {
      console.error(
        "Error deleting account:",
        output?.message || "Unknown error"
      );
    }

    return true;
  } catch (error) {
    console.error("Error deleting account:", error.message || error);
    throw new Error("Failed to delete account. Please try again.");
  }
}

export async function newGoalFunction(exercise, goal) {
  try {
    console.log("Creating goal:", exercise, goal);

    // Convert goal to an integer
    const reps_goal = parseInt(goal, 10);
    if (isNaN(reps_goal)) {
      throw new Error("Goal must be a valid number.");
    }

    // Get the current user
    const user = await account.get();
    const user_id = user.$id;

    // Get the current timestamp
    const createdAt = new Date().toISOString();

    // Save the goal in the database
    const response = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.goalCollectionId,
      "unique()", // Auto-generate a unique document ID
      {
        exercise: exercise,
        reps_goal: reps_goal,
        current_rep: 0,
        user_id: user_id,
        createdAt: createdAt, // Add the timestamp field
      }
    );

    console.log("Goal created successfully:", response);
    return response; // Return response for confirmation or logging
  } catch (error) {
    console.error("Error creating goal:", error.message || error);
    throw new Error("Failed to create goal. Please try again.");
  }
}

export async function newWeightFunction(weight) {
  try {
    console.log("Creating weight:", weight);

    // Convert goal to an integer
    const newWeight = parseInt(weight, 10);
    if (isNaN(newWeight)) {
      throw new Error("Weight must be a valid number.");
    }

    // Get the current user
    const user = await account.get();
    const userAccountId = user.$id;

    // First, find the document where accountId matches the user's accountId
    const documentList = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [
        Query.equal('accountId', userAccountId)
      ]
    );

    if (documentList.total === 0) {
      throw new Error("User document not found.");
    }

    const documentId = documentList.documents[0].$id;

    // Now update the found document
    const response = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      documentId,
      {
        weight: newWeight,
      }
    );

    console.log("Goal created successfully:", response);
    return response; // Return response for confirmation or logging
  } catch (error) {
    console.error("Error creating goal:", error.message || error);
    throw new Error("Failed to create goal. Please try again.");
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
    router.push("/goals");
    Alert.alert("Success", "Goal deleted successfully");
    console.log(`Goal with ID ${goalId} deleted successfully.`);
  } catch (error) {
    console.error("Error deleting goal:", error.message || error);
    throw new Error("Failed to delete goal. Please try again.");
  }
}

export async function uploadRecording(avghr, exercise, reps, elapsedTime) {
  try {
    console.log("Uploading Recording:", exercise, avghr, reps, elapsedTime);

    // Get the current user
    const user = await account.get();
    const user_id = user.$id;

    // Get the current timestamp
    const currentDate = new Date();

    // 1. Fetch the most recent workout
    const recentWorkoutResponse = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.workoutCollectionId,
      [
        Query.equal("user_id", user_id), // Filter by user ID
        Query.orderDesc("date"), // Sort by date in descending order
        Query.limit(1), // Get only the most recent workout
      ]
    );

    // Check if we have a recent workout
    let workoutIdToUse;
    const recentWorkout = recentWorkoutResponse.documents[0];

    if (recentWorkout) {
      // 2. Check if the most recent workout is within 2 hours of the current time
      const workoutDate = new Date(recentWorkout.date);
      const timeDiff = currentDate - workoutDate; // Difference in milliseconds

      // If it's within 2 hours (7200000ms), use the existing workout
      if (timeDiff <= 7200000) {
        workoutIdToUse = recentWorkout.$id;
      }
    }

    // If no recent workout or it's too old, create a new workout
    if (!workoutIdToUse) {
      const newWorkoutResponse = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.workoutCollectionId,
        "unique()", // Auto-generate a unique document ID
        {
          user_id: user_id,
          date: currentDate.toISOString(),
        }
      );

      workoutIdToUse = newWorkoutResponse.$id; // Use the new workout ID
    }

    // 3. Add the set to the selected workout (either new or existing)
    const response = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.setCollectionId,
      "unique()", // Auto-generate a unique document ID
      {
        exercise: exercise,
        rep_count: reps,
        avghr: parseInt(avghr),
        workout_id: workoutIdToUse, // Attach the workout ID
        elapsedTime: elapsedTime,
      }
    );

    console.log("Recording created successfully:", response);

    const recentGoalResponse = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.goalCollectionId,
      [
        Query.equal("user_id", user_id), // Filter by user ID
        Query.orderDesc("createdAt"), // Sort by creation date in descending order
        Query.limit(1), // Get only the most recent goal
      ]
    );

    const recentGoal = recentGoalResponse.documents[0];

    //if recent goal exists, check if the exercise matches the recording
    if (recentGoal && recentGoal.exercise === exercise) {
      const updatedReps = recentGoal.current_rep + reps;
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.goalCollectionId,
        recentGoal.$id,
        { current_rep: updatedReps }
      );
    }

    return response;
  } catch (error) {
    console.error("Error creating recording:", error.message || error);
    throw new Error("Failed to create recording. Please try again.");
  }
}
